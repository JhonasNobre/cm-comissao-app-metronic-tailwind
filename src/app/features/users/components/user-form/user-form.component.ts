import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { MultiSelect, MultiSelectModule } from 'primeng/multiselect';
import { InputMaskModule } from 'primeng/inputmask';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { UserService } from '../../services/user.service';
import { AccessProfileService } from '../../../access-profiles/services/access-profile.service';
import { TeamService } from '../../../teams/services/team.service';
import { CompanyService } from '../../../companies/services/company.service';
import { AuthService } from '../../../../core/services/auth.service';
import { SystemService } from '../../../../core/services/system.service';
import { UserRole } from '../../models/user.model';
import { AppConfirmationService } from '../../../../shared/services/confirmation.service';

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
        MultiSelectModule,
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
    private teamService = inject(TeamService);
    private companyService = inject(CompanyService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private messageService = inject(MessageService);
    private systemService = inject(SystemService);
    private confirmationService = inject(AppConfirmationService);

    form!: FormGroup;
    isEditMode = false;
    userId: string | null = null;
    loading = false;
    accessProfiles: any[] = [];
    teams: any[] = [];
    companies: any[] = [];
    hasRestricaoHorario = false;
    isProtected = false;
    isInactive = false;

    get isManager(): boolean {
        return this.authService.hasRole('Gestor') || this.authService.hasRole('Admin');
    }

    userRoleOptions: any[] = [];
    keycloakRoleOptions: any[] = [];
    diasSemanaOptions: any[] = [];

    getRoleLabel(value: string): string {
        const role = this.keycloakRoleOptions.find(r => r.value === value);
        return role ? role.label : value;
    }

    ngOnInit(): void {
        this.initForm();
        this.loadAccessProfiles();
        this.loadTeams();
        this.loadCompanies();
        this.loadSystemOptions();
        this.checkEditMode();
    }

    private loadSystemOptions(): void {
        this.systemService.getRoles().subscribe(data => this.keycloakRoleOptions = data);
        this.systemService.getUserTypes().subscribe(data => this.userRoleOptions = data);
        this.systemService.getDaysOfWeek().subscribe(data => this.diasSemanaOptions = data);
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
            tipoUsuario: [null, [Validators.required]],
            idEmpresa: [null, [Validators.required]],
            equipeIds: [[]],
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

    private loadTeams(): void {
        this.teamService.list().subscribe({
            next: (data) => this.teams = data,
            error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar equipes' })
        });
    }

    private loadCompanies(): void {
        this.companyService.list().subscribe({
            next: (data) => this.companies = data,
            error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar imobiliárias' })
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
                    cpf: user.cpf,
                    email: user.email,
                    telefone: user.telefone,
                    tipoUsuario: user.tipoUsuario,
                    role: user.role,
                    perfilAcessoId: user.perfilAcessoId,
                    idEmpresa: user.idEmpresa,
                    equipeIds: user.equipeIds || []
                });

                this.isProtected = user.isProtected;
                this.isInactive = user.inativo;

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

    onInactivate(): void {
        if (!this.userId) return;

        this.confirmationService.confirm({
            header: 'Confirmar Inativação',
            message: 'Tem certeza que deseja inativar este usuário? Ele perderá o acesso ao sistema.',
            acceptLabel: 'Inativar',
            acceptButtonStyleClass: 'p-button-danger',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.loading = true;
                this.service.inativar([this.userId!]).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Usuário inativado com sucesso' });
                        this.loadUser(this.userId!); // Reload to update status
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao inativar usuário' });
                        this.loading = false;
                    }
                });
            }
        });
    }

    onReactivate(): void {
        if (!this.userId) return;

        this.confirmationService.confirm({
            header: 'Confirmar Reativação',
            message: 'Deseja reativar este usuário? Ele voltará a ter acesso ao sistema.',
            acceptLabel: 'Habilitar Usuário',
            acceptButtonStyleClass: 'p-button-success',
            icon: 'pi pi-check-circle',
            accept: () => {
                this.loading = true;
                this.service.reativar([this.userId!]).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Usuário reativado com sucesso' });
                        this.loadUser(this.userId!); // Reload to update status
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao reativar usuário' });
                        this.loading = false;
                    }
                });
            }
        });
    }
}
