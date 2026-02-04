import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { BonusService } from '../../services/bonus.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-bonus-structure-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        RouterModule,
        ToastModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        InputNumberModule,
        CheckboxModule,
        TooltipModule
    ],
    providers: [MessageService],
    templateUrl: './bonus-structure-form.component.html'
})
export class BonusStructureFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private bonusService = inject(BonusService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private messageService = inject(MessageService);

    form: FormGroup;
    saving = signal(false);
    activeTab = signal('planos'); // 'planos' or 'metas'
    id = signal<string | null>(null);

    // Mock de Origens (idealmente viria de um serviço de domínios/enums)
    origens = [
        { label: 'Caixa da Empresa', value: 'e4b5d8a0-7f3c-4d8e-9a1b-2c3d4e5f6a7b' },
        { label: 'Fundo de Incentivo', value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' },
        { label: 'Receita Imobiliária', value: 'f6e5d4c3-b2a1-4d0c-8b7a-6f5e4d3c2b1a' }
    ];

    constructor() {
        this.form = this.fb.group({
            nome: ['', Validators.required],
            descricao: [''],
            idOrigemPadrao: ['e4b5d8a0-7f3c-4d8e-9a1b-2c3d4e5f6a7b', Validators.required],
            ativo: [true],
            planos: this.fb.array([]),
            metas: this.fb.array([])
        });
    }

    ngOnInit(): void {
        const id = this.route.snapshot.params['id'];
        if (id) {
            this.id.set(id);
            this.loadEstrutura(id);
        } else {
            // Inicia com um plano vazio para facilitar na criação
            this.addPlano();
        }
    }

    loadEstrutura(id: string): void {
        this.bonusService.obterEstrutura(id).subscribe({
            next: (data) => {
                this.form.patchValue({
                    nome: data.nome,
                    descricao: data.descricao,
                    idOrigemPadrao: data.idOrigemPadrao || 'e4b5d8a0-7f3c-4d8e-9a1b-2c3d4e5f6a7b',
                    ativo: data.ativo
                });

                // Limpar arrays antes de preencher
                this.planos.clear();
                this.metas.clear();

                // Preencher Planos
                data.planos?.forEach(p => {
                    this.planos.push(this.fb.group({
                        id: [p.id],
                        nomePlano: [p.nomePlano, Validators.required],
                        percentualBonus: [p.percentualBonus, [Validators.required, Validators.min(0), Validators.max(100)]],
                        qtdParcelasBonus: [p.qtdParcelasBonus, [Validators.required, Validators.min(1)]],
                        parcelaInicialLiberacao: [p.parcelaInicialLiberacao, [Validators.required, Validators.min(1)]],
                        prioridade: [p.prioridade, [Validators.required, Validators.min(1)]],
                        idOrigem: [p.idOrigem, Validators.required],
                        liberarAutomaticamenteNaQuitacao: [p.liberarAutomaticamenteNaQuitacao]
                    }));
                });

                // Preencher Metas
                data.metas?.forEach(m => {
                    this.metas.push(this.fb.group({
                        id: [m.id],
                        nomeMeta: [m.nomeMeta, Validators.required],
                        quantidadeVendasMinima: [m.quantidadeVendasMinima, [Validators.required, Validators.min(1)]],
                        valorBonus: [m.valorBonus, [Validators.required, Validators.min(0)]],
                        qtdParcelasBonus: [m.qtdParcelasBonus, [Validators.required, Validators.min(1)]],
                        parcelaInicialLiberacao: [m.parcelaInicialLiberacao, [Validators.required, Validators.min(1)]],
                        idOrigem: [m.idOrigem, Validators.required]
                    }));
                });
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar estrutura.' });
            }
        });
    }

    // Getters para FormArrays
    get planos(): FormArray {
        return this.form.get('planos') as FormArray;
    }

    get metas(): FormArray {
        return this.form.get('metas') as FormArray;
    }

    // Métodos para Planos
    addPlano(): void {
        const planoGroup = this.fb.group({
            id: [crypto.randomUUID()],
            nomePlano: ['', Validators.required],
            percentualBonus: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
            qtdParcelasBonus: [1, [Validators.required, Validators.min(1)]],
            parcelaInicialLiberacao: [1, [Validators.required, Validators.min(1)]],
            prioridade: [1, [Validators.required, Validators.min(1)]],
            idOrigem: ['e4b5d8a0-7f3c-4d8e-9a1b-2c3d4e5f6a7b', Validators.required],
            liberarAutomaticamenteNaQuitacao: [false]
        });
        this.planos.push(planoGroup);
    }

    removePlano(index: number): void {
        this.planos.removeAt(index);
    }

    // Métodos para Metas
    addMeta(): void {
        const metaGroup = this.fb.group({
            id: [crypto.randomUUID()],
            nomeMeta: ['', Validators.required],
            quantidadeVendasMinima: [1, [Validators.required, Validators.min(1)]],
            valorBonus: [0, [Validators.required, Validators.min(0)]],
            qtdParcelasBonus: [1, [Validators.required, Validators.min(1)]],
            parcelaInicialLiberacao: [1, [Validators.required, Validators.min(1)]],
            idOrigem: ['e4b5d8a0-7f3c-4d8e-9a1b-2c3d4e5f6a7b', Validators.required]
        });
        this.metas.push(metaGroup);
    }

    removeMeta(index: number): void {
        this.metas.removeAt(index);
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha todos os campos obrigatórios.' });
            return;
        }

        if (this.id()) {
            // Atualizar
            const updateCommand = { ...this.form.value, id: this.id() };
            this.bonusService.atualizarEstrutura(updateCommand).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Estrutura atualizada com sucesso!' });
                    setTimeout(() => this.router.navigate(['/bonificacao/estruturas']), 1500);
                },
                error: (err) => {
                    console.error(err);
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao atualizar estrutura.' });
                    this.saving.set(false);
                }
            });
        } else {
            // Criar
            this.bonusService.criarEstrutura(this.form.value).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Estrutura criada com sucesso!' });
                    setTimeout(() => this.router.navigate(['/bonificacao/estruturas']), 1500);
                },
                error: (err) => {
                    console.error(err);
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao criar estrutura.' });
                    this.saving.set(false);
                }
            });
        }
    }
}
