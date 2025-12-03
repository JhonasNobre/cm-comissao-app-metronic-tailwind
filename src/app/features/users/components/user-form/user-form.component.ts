import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { InputMaskModule } from 'primeng/inputmask';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { UserService } from '../../services/user.service';
import { AccessProfileService } from '../../../access-profiles/services/access-profile.service';
import { UserRole } from '../../models/user.model';

@Component({
    selector: 'app-user-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        CheckboxModule,
        SelectModule,
        InputMaskModule,
        CardModule,
        ToastModule,
        DividerModule,
        PasswordModule
    ],
    providers: [MessageService],
    templateUrl: './user-form.component.html'
})
export class UserFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private service = inject(UserService);
    private profileService = inject(AccessProfileService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private messageService = inject(MessageService);

    form!: FormGroup;
    isEditMode = false;
    userId: string | null = null;
    loading = false;
    accessProfiles: any[] = [];
    hasRestricaoHorario = false;

    userRoleOptions = [
        { label: 'Colaborador', value: UserRole.COLABORADOR },
        { label: 'Cliente', value: UserRole.CLIENTE },
        { label: 'Administrador', value: UserRole.ADMINISTRADOR }
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
        this.loadAccessProfiles();
        this.checkEditMode();
    }

    private initForm(): void {
        this.form = this.fb.group({
            nomeCompleto: ['', [Validators.required]],
            cpf: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            telefone: ['', [Validators.required]],
            senha: ['', [Validators.required, Validators.minLength(8)]],
            role: ['', [Validators.required]], // Keycloak Role
            perfilAcessoId: [null],
            tipoUsuario: [UserRole.COLABORADOR, [Validators.required]],
            idEmpresa: ['3fa85f64-5717-4562-b3fc-2c963f66afa6'], // TODO: Get from context
            restricaoHorario: this.fb.group({
                bloquearEmFeriadosNacionais: [false],
                ufFeriados: [''],
                codigoIbgeMunicipio: [''],
                horarios: this.fb.array([])
            })
        });
    }

    get horarios(): FormArray {
        return this.form.get('restricaoHorario.horarios') as FormArray;
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

    private loadAccessProfiles(): void {
        this.profileService.list().subscribe({
            next: (data) => this.accessProfiles = data,
            error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar perfis de acesso' })
        });
    }

    private checkEditMode(): void {
        this.route.params.subscribe(params => {
            if (params['id']) {
                this.isEditMode = true;
                this.userId = params['id'];
                this.loadUser(this.userId!);

                // Disable fields that cannot be edited
                this.form.get('cpf')?.disable();
                this.form.get('email')?.disable(); // Email update not supported in this form
                this.form.get('senha')?.disable(); // Password update not supported in this form
                this.form.get('senha')?.clearValidators();
                this.form.get('senha')?.updateValueAndValidity();
            }
        });
    }

    private loadUser(id: string): void {
        this.loading = true;
        this.service.get(id).subscribe({
            next: (user: any) => {
                this.form.patchValue({
                    nomeCompleto: user.nomeCompleto,
                    cpf: user.cpf, // Assuming API returns CPF
                    email: user.email,
                    telefone: user.telefone, // Assuming API returns phone
                    tipoUsuario: user.tipoUsuario,
                    role: user.role, // Assuming API returns role
                    perfilAcessoId: user.perfilAcessoId
                });

                if (user.restricaoHorario) {
                    this.hasRestricaoHorario = true;
                    this.form.get('restricaoHorario')?.patchValue({
                        bloquearEmFeriadosNacionais: user.restricaoHorario.bloquearEmFeriadosNacionais,
                        ufFeriados: user.restricaoHorario.ufFeriados,
                        codigoIbgeMunicipio: user.restricaoHorario.codigoIbgeMunicipio
                    });

                    while (this.horarios.length !== 0) {
                        this.horarios.removeAt(0);
                    }
                    if (user.restricaoHorario.horarios) {
                        user.restricaoHorario.horarios.forEach((h: any) => {
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
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar usuário' });
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
        const formValue = this.form.getRawValue(); // Use getRawValue to include disabled fields if needed (though we don't send disabled ones for update usually)

        const payload = {
            ...formValue,
            restricaoHorario: this.hasRestricaoHorario ? formValue.restricaoHorario : null
        };

        if (this.isEditMode && this.userId) {
            // Remove fields that shouldn't be sent on update
            const { cpf, email, senha, idEmpresa, ...updatePayload } = payload;
            updatePayload.id = this.userId;

            this.service.update(updatePayload, this.userId).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Usuário atualizado com sucesso' });
                    setTimeout(() => this.router.navigate(['/users']), 1000);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao atualizar usuário' });
                    this.loading = false;
                }
            });
        } else {
            this.service.create(payload).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Usuário criado com sucesso' });
                    setTimeout(() => this.router.navigate(['/users']), 1000);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao criar usuário' });
                    this.loading = false;
                }
            });
        }
    }

    onCancel(): void {
        this.router.navigate(['/users']);
    }
}
