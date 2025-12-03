import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { InputMaskModule } from 'primeng/inputmask';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { AccessProfileService } from '../../services/access-profile.service';

@Component({
    selector: 'app-access-profile-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        CheckboxModule,
        SelectModule,
        InputMaskModule,
        CardModule,
        ToastModule,
        DividerModule
    ],
    providers: [MessageService],
    templateUrl: './access-profile-form.component.html'
})
export class AccessProfileFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private service = inject(AccessProfileService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private messageService = inject(MessageService);

    form!: FormGroup;
    isEditMode = false;
    profileId: string | null = null;
    loading = false;
    resources: any[] = [];
    hasRestricaoHorario = false;

    acaoOptions = [
        { label: 'Nenhum', value: 0 },
        { label: 'Criar', value: 1 },
        { label: 'Ler', value: 2 },
        { label: 'Atualizar', value: 3 },
        { label: 'Excluir', value: 4 },
        { label: 'Todos', value: 99 }
    ];

    nivelAcessoOptions = [
        { label: 'Nenhum', value: 0 },
        { label: 'Dados Usuário', value: 1 },
        { label: 'Dados Equipe', value: 2 },
        { label: 'Todos', value: 3 }
    ];

    diasSemanaOptions = [
        { label: 'Domingo', value: 0 },
        { label: 'Segunda', value: 1 },
        { label: 'Terça', value: 2 },
        { label: 'Quarta', value: 3 },
        { label: 'Quinta', value: 4 },
        { label: 'Sexta', value: 5 },
        { label: 'Sábado', value: 6 }
    ];

    ngOnInit(): void {
        this.initForm();
        this.loadResources();
        this.checkEditMode();
    }

    private initForm(): void {
        this.form = this.fb.group({
            nome: ['', [Validators.required]],
            limiteDescontoMaximo: [0, [Validators.required, Validators.min(0)]],
            quantidadeMaximaReservas: [0, [Validators.required, Validators.min(0)]],
            ehPadrao: [false],
            permissoes: this.fb.array([]),
            restricaoHorario: this.fb.group({
                bloquearEmFeriadosNacionais: [false],
                ufFeriados: [''],
                codigoIbgeMunicipio: [''],
                horarios: this.fb.array([])
            })
        });

        // Adiciona uma permissão inicial
        if (!this.isEditMode) {
            this.addPermissao();
        }
    }

    get permissoes(): FormArray {
        return this.form.get('permissoes') as FormArray;
    }

    get horarios(): FormArray {
        return this.form.get('restricaoHorario.horarios') as FormArray;
    }

    addPermissao(): void {
        const permGroup = this.fb.group({
            recursoId: ['', Validators.required],
            acao: [0, Validators.required],
            nivelAcesso: [0, Validators.required]
        });
        this.permissoes.push(permGroup);
    }

    removePermissao(index: number): void {
        this.permissoes.removeAt(index);
    }

    addHorario(): void {
        const horarioGroup = this.fb.group({
            diaSemana: [1, Validators.required],
            horaInicio: ['08:00', Validators.required],
            horaFim: ['18:00', Validators.required]
        });
        this.horarios.push(horarioGroup);
    }

    removeHorario(index: number): void {
        this.horarios.removeAt(index);
    }

    toggleRestricaoHorario(event: any): void {
        this.hasRestricaoHorario = event.checked;
        if (!this.hasRestricaoHorario) {
            // Limpar controles se desativado
            this.form.get('restricaoHorario')?.patchValue({
                bloquearEmFeriadosNacionais: false,
                ufFeriados: '',
                codigoIbgeMunicipio: ''
            });
            while (this.horarios.length !== 0) {
                this.horarios.removeAt(0);
            }
        } else if (this.horarios.length === 0) {
            this.addHorario();
        }
    }

    private loadResources(): void {
        this.service.listResources().subscribe({
            next: (data) => this.resources = data,
            error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar recursos' })
        });
    }

    private checkEditMode(): void {
        this.route.params.subscribe(params => {
            if (params['id']) {
                this.isEditMode = true;
                this.profileId = params['id'];
                this.loadProfile(this.profileId!);
            }
        });
    }

    private loadProfile(id: string): void {
        this.loading = true;
        this.service.get(id).subscribe({
            next: (profile: any) => {
                this.form.patchValue({
                    nome: profile.nome,
                    limiteDescontoMaximo: profile.limiteDescontoMaximo,
                    quantidadeMaximaReservas: profile.quantidadeMaximaReservas,
                    ehPadrao: profile.ehPadrao
                });

                // Carregar permissões
                while (this.permissoes.length !== 0) {
                    this.permissoes.removeAt(0);
                }
                if (profile.permissoes && profile.permissoes.length > 0) {
                    profile.permissoes.forEach((p: any) => {
                        const permGroup = this.fb.group({
                            recursoId: [p.recursoId, Validators.required],
                            acao: [p.acao, Validators.required],
                            nivelAcesso: [p.nivelAcesso, Validators.required]
                        });
                        this.permissoes.push(permGroup);
                    });
                } else {
                    this.addPermissao();
                }

                // Carregar restrições
                if (profile.restricaoHorario) {
                    this.hasRestricaoHorario = true;
                    this.form.get('restricaoHorario')?.patchValue({
                        bloquearEmFeriadosNacionais: profile.restricaoHorario.bloquearEmFeriadosNacionais,
                        ufFeriados: profile.restricaoHorario.ufFeriados,
                        codigoIbgeMunicipio: profile.restricaoHorario.codigoIbgeMunicipio
                    });

                    while (this.horarios.length !== 0) {
                        this.horarios.removeAt(0);
                    }
                    if (profile.restricaoHorario.horarios) {
                        profile.restricaoHorario.horarios.forEach((h: any) => {
                            const horarioGroup = this.fb.group({
                                diaSemana: [h.diaSemana, Validators.required],
                                horaInicio: [h.horaInicio, Validators.required],
                                horaFim: [h.horaFim, Validators.required]
                            });
                            this.horarios.push(horarioGroup);
                        });
                    }
                }

                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar perfil' });
                this.loading = false;
            }
        });
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading = true;
        const formValue = this.form.value;

        // Ajustar objeto para envio
        const payload = {
            ...formValue,
            restricaoHorario: this.hasRestricaoHorario ? formValue.restricaoHorario : null
        };

        if (this.isEditMode && this.profileId) {
            this.service.update(this.profileId, payload).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Perfil atualizado com sucesso' });
                    setTimeout(() => this.router.navigate(['/access-profiles']), 1000);
                },
                error: () => this.loading = false
            });
        } else {
            this.service.create(payload).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Perfil criado com sucesso' });
                    setTimeout(() => this.router.navigate(['/access-profiles']), 1000);
                },
                error: () => this.loading = false
            });
        }
    }

    onCancel(): void {
        this.router.navigate(['/access-profiles']);
    }
}
