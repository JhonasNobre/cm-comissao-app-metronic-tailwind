import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';
import { EstruturaComissaoService } from '../../services/estrutura-comissao.service';
import { CreateEstruturaComissaoRequest, UpdateEstruturaComissaoRequest } from '../../models/estrutura-comissao.model';
import {
    TipoComissao, TipoComissaoLabels,
    TipoRateio, TipoRateioLabels,
    RegraLiberacao, RegraLiberacaoLabels,
    TipoValor, TipoValorLabels
} from '../../models/enums';
import { EmpresaSelectorService } from '../../../../core/services/empresa-selector.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CompanyService } from '../../../companies/services/company.service';
import { Company } from '../../../companies/models/company.model';

@Component({
    selector: 'app-estrutura-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ToastModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        InputNumberModule,
        CardModule,
        DividerModule,
        RippleModule
    ],
    providers: [MessageService],
    templateUrl: './estrutura-form.component.html',
    styleUrl: './estrutura-form.component.scss'
})
export class EstruturaFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private estruturaService = inject(EstruturaComissaoService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    public messageService = inject(MessageService);
    private empresaSelectorService = inject(EmpresaSelectorService);
    private companyService = inject(CompanyService);
    private authService = inject(AuthService);

    saving = signal(false);
    loading = signal(false);
    form!: FormGroup;
    estruturaId?: string;
    isEditMode = signal(false);
    versaoAtual: number = 0;

    // Enums para uso no template
    TipoComissao = TipoComissao;
    TipoRateio = TipoRateio;
    RegraLiberacao = RegraLiberacao;
    TipoValor = TipoValor;

    // Options para dropdowns
    tipoComissaoOptions = Object.entries(TipoComissaoLabels).map(([value, label]) => ({
        label,
        value: Number(value)
    }));

    tipoRateioOptions = Object.entries(TipoRateioLabels).map(([value, label]) => ({
        label,
        value: Number(value)
    }));

    regraLiberacaoOptions = Object.entries(RegraLiberacaoLabels).map(([value, label]) => ({
        label,
        value: Number(value)
    }));

    tipoValorOptions = Object.entries(TipoValorLabels).map(([value, label]) => ({
        label,
        value: Number(value)
    }));

    // Empresas
    empresas: { label: string; value: string }[] = [];

    ngOnInit() {
        this.form = this.fb.group({
            idEmpresa: [null, [Validators.required]],
            nome: ['', [Validators.required, Validators.maxLength(100)]],
            descricao: ['', [Validators.maxLength(500)]],
            status: ['Ativo', [Validators.required]],

            // Configuração de Cálculo
            tipoComissao: [TipoComissao.Percentual, [Validators.required]],
            valorPercentual: [null, [Validators.min(0), Validators.max(100)]],
            valorFixoInicial: [null, [Validators.min(0)]],
            tipoRateio: [TipoRateio.Linear, [Validators.required]],

            // Regras de Liberação
            regraLiberacao: [RegraLiberacao.Diretamente, [Validators.required]],
            percentualLiberacao: [null, [Validators.min(0), Validators.max(100)]],
            parcelaLiberacao: [null, [Validators.min(1)]],

            niveis: this.fb.array([])
        });

        // Carregar empresas
        if (this.authService.isAdmin()) {
            this.loading.set(true);
            this.companyService.list({ size: 1000 }).subscribe({
                next: (result: any) => {
                    // Verificando formato de retorno (pode variar entre array direto ou paginação)
                    const lista = Array.isArray(result) ? result : (result.content || []);

                    this.empresas = lista.map((e: Company) => ({
                        label: `${e.name} (${e.cnpj})`,
                        value: e.id
                    }));

                    // Auto-selecionar se tiver apenas 1 empresa e for criação
                    if (this.empresas.length === 1 && !this.estruturaId) {
                        this.form.patchValue({ idEmpresa: this.empresas[0].value });
                    }

                    this.loading.set(false);
                },
                error: (err) => {
                    console.error('Erro ao carregar todas as empresas', err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erro',
                        detail: 'Erro ao carregar lista de empresas'
                    });
                    this.loading.set(false);
                }
            });
        } else {
            // Usuário normal: empresas do token
            this.empresaSelectorService.userEmpresas$.subscribe(empresas => {
                this.empresas = empresas.map(e => ({ label: e.nome, value: e.id }));

                // Auto-selecionar se tiver apenas 1 empresa e for criação
                if (this.empresas.length === 1 && !this.estruturaId) {
                    this.form.patchValue({ idEmpresa: this.empresas[0].value });
                }
            });
        }

        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.estruturaId = id;
                this.isEditMode.set(true);
                this.loadEstrutura(id);
            }
        });
    }

    loadEstrutura(id: string) {
        this.estruturaService.getById(id).subscribe({
            next: (estrutura) => {
                this.versaoAtual = estrutura.versao;
                this.form.patchValue({
                    idEmpresa: estrutura.idEmpresa,
                    nome: estrutura.nome,
                    descricao: estrutura.descricao,
                    status: estrutura.ativo ? 'Ativo' : 'Inativo',

                    // Conversão de String para Enum (Backend retorna string, Frontend espera number no select)
                    tipoComissao: typeof estrutura.tipoComissao === 'string'
                        ? TipoComissao[estrutura.tipoComissao as keyof typeof TipoComissao]
                        : estrutura.tipoComissao,

                    valorPercentual: estrutura.valorPercentual,
                    valorFixoInicial: estrutura.valorFixoInicial,

                    tipoRateio: typeof estrutura.tipoRateio === 'string'
                        ? TipoRateio[estrutura.tipoRateio as keyof typeof TipoRateio]
                        : estrutura.tipoRateio,

                    regraLiberacao: typeof estrutura.regraLiberacao === 'string'
                        ? RegraLiberacao[estrutura.regraLiberacao as keyof typeof RegraLiberacao]
                        : estrutura.regraLiberacao,

                    percentualLiberacao: estrutura.percentualLiberacao,
                    parcelaLiberacao: estrutura.parcelaLiberacao
                });

                const niveisFormArray = this.form.get('niveis') as FormArray;
                niveisFormArray.clear();

                if (estrutura.niveis && estrutura.niveis.length > 0) {
                    estrutura.niveis.forEach(nivel => {
                        niveisFormArray.push(this.fb.group({
                            nomeNivel: [nivel.nomeNivel, [Validators.required, Validators.maxLength(50)]],
                            prioridade: [nivel.prioridade, [Validators.required, Validators.min(1)]],

                            tipoValor: typeof nivel.tipoValor === 'string'
                                ? TipoValor[nivel.tipoValor as keyof typeof TipoValor]
                                : nivel.tipoValor,

                            percentual: [nivel.percentual, [Validators.min(0), Validators.max(100)]],
                            valorFixo: [nivel.valorFixo, [Validators.min(0)]]
                        }));
                    });
                }
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar estrutura'
                });
                console.error(err);
                this.router.navigate(['/comissoes/estruturas']);
            }
        });
    }

    get niveis() {
        return this.form.get('niveis') as FormArray;
    }

    addNivel() {
        const nivelGroup = this.fb.group({
            nomeNivel: ['', [Validators.required, Validators.maxLength(50)]],
            prioridade: [this.niveis.length + 1, [Validators.required, Validators.min(1)]],
            tipoValor: [TipoValor.Percentual, [Validators.required]],
            percentual: [null, [Validators.min(0), Validators.max(100)]],
            valorFixo: [null, [Validators.min(0)]]
        });

        this.niveis.push(nivelGroup);
    }

    removeNivel(index: number) {
        this.niveis.removeAt(index);

        // Reordenar prioridades
        this.niveis.controls.forEach((control, idx) => {
            control.patchValue({ prioridade: idx + 1 });
        });
    }


    onSubmit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.messageService.add({
                severity: 'warn',
                summary: 'Atenção',
                detail: 'Por favor, preencha todos os campos obrigatórios corretamente.'
            });
            return;
        }

        if (this.niveis.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Atenção',
                detail: 'Adicione pelo menos um nível de comissão.'
            });
            return;
        }

        this.saving.set(true);
        const formValue = this.form.value;

        const request: CreateEstruturaComissaoRequest = {
            ...formValue,
            idEmpresa: formValue.idEmpresa,
            niveis: formValue.niveis.map((n: any) => ({
                nomeNivel: n.nomeNivel,
                prioridade: n.prioridade,
                tipoValor: n.tipoValor,
                percentual: n.percentual,
                valorFixo: n.valorFixo
            }))
        };


        if (this.isEditMode()) {
            this.estruturaService.update(this.estruturaId!, { ...request, id: this.estruturaId!, versao: this.versaoAtual } as UpdateEstruturaComissaoRequest)
                .subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Estrutura atualizada com sucesso'
                        });
                        setTimeout(() => this.router.navigate(['/comissoes/estruturas']), 1500);
                    },
                    error: (_error: unknown) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao atualizar estrutura'
                        });
                        this.saving.set(false);
                    }
                });
        } else {
            this.estruturaService.create(request)
                .subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Estrutura criada com sucesso'
                        });
                        setTimeout(() => this.router.navigate(['/comissoes/estruturas']), 1500);
                    },
                    error: (_error: unknown) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao criar estrutura'
                        });
                        this.saving.set(false);
                    }
                });
        }
    }

    cancel() {
        this.router.navigate(['/comissoes/estruturas']);
    }
}
