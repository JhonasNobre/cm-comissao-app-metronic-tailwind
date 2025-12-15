import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { TabsModule } from 'primeng/tabs';
import { MessageService } from 'primeng/api';
import { UserService } from '../../services/user.service';
import { AccessProfileService } from '../../../access-profiles/services/access-profile.service';
import { TeamService } from '../../../teams/services/team.service';
import { CompanyService } from '../../../companies/services/company.service';
import { AuthService } from '../../../../core/services/auth.service';
import { SystemService } from '../../../../core/services/system.service';
import { AppConfirmationService } from '../../../../shared/services/confirmation.service';
import { UserGeneralTabComponent } from './tabs/user-general-tab/user-general-tab.component';
import { UserAccessTabComponent } from './tabs/user-access-tab/user-access-tab.component';
import { UserScheduleTabComponent } from './tabs/user-schedule-tab/user-schedule-tab.component';

@Component({
    selector: 'app-user-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        RouterModule,
        ButtonModule,
        CardModule,
        ToastModule,
        TabsModule,
        UserGeneralTabComponent,
        UserAccessTabComponent,
        UserScheduleTabComponent
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
    isProtected = false;
    isInactive = false;

    get isManager(): boolean {
        return this.authService.isGestor() || this.authService.isAdmin();
    }

    userRoleOptions: any[] = [];
    keycloakRoleOptions: any[] = [];
    diasSemanaOptions: any[] = [];

    // ... properties
    resources: any[] = [];
    currentPermissions: any[] = [];

    // ...

    ngOnInit(): void {
        this.initForm();
        this.loadAccessProfiles();
        this.loadTeams();
        this.loadCompanies();
        this.loadSystemOptions();
        this.loadResources(); // Load all resources
        this.checkEditMode();
        this.setupProfileWatcher(); // Watch for profile changes
    }

    private loadResources(): void {
        this.profileService.listResources().subscribe({
            next: (data) => this.resources = data,
            error: () => console.error('Falha ao carregar recursos')
        });
    }

    private setupProfileWatcher(): void {
        this.form.get('perfilAcessoId')?.valueChanges.subscribe(profileId => {
            if (profileId) {
                this.loadProfilePermissions(profileId);
            } else {
                this.currentPermissions = [];
            }
        });
    }

    private loadProfilePermissions(profileId: string): void {
        this.profileService.get(profileId).subscribe({
            next: (profile: any) => {
                this.currentPermissions = profile.permissoes || [];
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar permissões do perfil' })
        });
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
            empresaIds: [[], [Validators.required]],
            equipeIds: [[]],
            restricaoHorario: this.fb.group({
                ativo: [false],
                feriadosIds: this.fb.array([]),
                estadoId: [null],
                municipioId: [null],
                horarios: this.fb.array([])
            })
        });
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
                    empresaIds: user.empresaIds || [],
                    equipeIds: user.equipeIds || []
                });

                if (user.perfilAcessoId) {
                    this.loadProfilePermissions(user.perfilAcessoId);
                }

                this.isProtected = user.isProtected;
                this.isInactive = user.inativo;

                if (user.restricaoHorario) {
                    this.form.get('restricaoHorario')?.patchValue({
                        ativo: true,
                        bloquearEmFeriadosNacionais: user.restricaoHorario.bloquearEmFeriadosNacionais,
                        estadoId: user.restricaoHorario.estadoId,
                        municipioId: user.restricaoHorario.municipioId
                    });

                    // Logic to populate FormArray is now expected to be handled by the child or we prepopulate here?
                    // WE MUST prepopulate here because the child displays what's in the form.
                    // The child reads 'restricaoHorario.horarios' FormArray.
                    // So we must push into it here.
                    const horariosArray = this.form.get('restricaoHorario.horarios') as any; // FormArray
                    while (horariosArray.length !== 0) {
                        horariosArray.removeAt(0);
                    }
                    if (user.restricaoHorario.horarios) {
                        user.restricaoHorario.horarios.forEach((h: any) => {
                            const horarioGroup = this.fb.group({
                                diaSemana: [h.diaSemana, Validators.required],
                                horaInicio: [h.horaInicio, Validators.required],
                                horaFim: [h.horaFim, Validators.required]
                            });
                            horariosArray.push(horarioGroup);
                        });
                        // Sorting can be done here or child will sort on add.
                    }
                } else {
                    this.form.get('restricaoHorario.ativo')?.setValue(false);
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
        const formValue = this.form.getRawValue();

        // Check if there is actual restriction data
        const res = formValue.restricaoHorario;
        const hasRestricao = res && res.ativo;

        let restricaoPayload = null;
        if (hasRestricao) {
            const { ativo, ...rest } = res;
            restricaoPayload = rest;
        }

        const payload = {
            ...formValue,
            restricaoHorario: restricaoPayload
        };

        if (this.isEditMode && this.userId) {
            const { cpf, email, senha, ...updatePayload } = payload;
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
