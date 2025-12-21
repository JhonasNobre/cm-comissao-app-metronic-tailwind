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
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { UserService } from '../../services/user.service';
import { AccessProfileService } from '../../../access-profiles/services/access-profile.service';
import { TeamService } from '../../../teams/services/team.service';
import { CompanyService } from '../../../companies/services/company.service';
import { AuthService } from '../../../../core/services/auth.service';
import { SystemService } from '../../../../core/services/system.service';
import { UserRole, EAcao, ENivelAcesso, PermissaoRecursoInput, PermissaoDetalhadaDto } from '../../models/user.model';
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
        PasswordModule,
        TableModule
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
        return this.authService.isGestor() || this.authService.isAdmin();
    }

    userRoleOptions: any[] = [];
    keycloakRoleOptions: any[] = [];
    diasSemanaOptions: any[] = [];

    // Permissões individuais
    resources: any[] = [];
    permissionRows: any[] = [];

    scopeOptions = [
        { label: 'Dados do Usuário', value: 'DADOS_USUARIO' },
        { label: 'Dados da Equipe', value: 'DADOS_EQUIPE' },
        { label: 'Todos', value: 'TODOS' }
    ];

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
        this.loadResources();
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
            empresaIds: [[], [Validators.required]],
            equipeIds: [[]],
            // Novos campos de alçada individual
            limiteDescontoMaximoIndividual: [null],
            quantidadeMaximaReservasIndividual: [null],
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
            diaSemana: ['Segunda', Validators.required],
            horaInicio: ['08:00', Validators.required],
            horaFim: ['18:00', Validators.required]
        });
        this.horarios.push(horarioGroup);
        this.sortHorarios();
    }

    removeHorario(index: number): void {
        this.horarios.removeAt(index);
    }

    sortHorarios(): void {
        const daysOrder: { [key: string]: number } = {
            'Domingo': 0,
            'Segunda': 1,
            'Terca': 2,
            'Quarta': 3,
            'Quinta': 4,
            'Sexta': 5,
            'Sabado': 6
        };

        const horariosArray = this.horarios.controls.map((control, index) => ({
            control,
            index,
            value: control.value
        }));

        horariosArray.sort((a, b) => {
            const dayA = daysOrder[a.value.diaSemana] ?? 0;
            const dayB = daysOrder[b.value.diaSemana] ?? 0;

            if (dayA !== dayB) {
                return dayA - dayB;
            }

            return a.value.horaInicio.localeCompare(b.value.horaInicio);
        });

        while (this.horarios.length !== 0) {
            this.horarios.removeAt(0);
        }
        horariosArray.forEach(item => {
            this.horarios.push(item.control);
        });
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

    private loadResources(): void {
        this.profileService.listResources().subscribe({
            next: (recursos: any[]) => {
                console.log('📦 Recursos carregados da API:', recursos);
                this.resources = recursos;
                this.initPermissionRows();
            },
            error: (error) => {
                console.error('❌ Erro ao carregar recursos:', error);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar recursos' });
            }
        });
    }

    private initPermissionRows(): void {
        this.permissionRows = this.resources.map(res => ({
            recursoId: res.id,
            recursoNome: res.nome,
            canCreate: false,
            canRead: false,
            canUpdate: false,
            canDelete: false,
            scope: 'DADOS_USUARIO'
        }));
    }

    private mapPermissionsToRows(permissions: PermissaoDetalhadaDto[]): void {
        permissions.forEach(p => {
            const row = this.permissionRows.find(r => r.recursoId === p.recursoId);
            if (row) {
                if (p.acao === 'CRIAR') row.canCreate = true;
                if (p.acao === 'LER') row.canRead = true;
                if (p.acao === 'ATUALIZAR') row.canUpdate = true;
                if (p.acao === 'EXCLUIR') row.canDelete = true;
                row.scope = p.nivelAcesso;
            }
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
                    equipeIds: user.equipeIds || [],
                    limiteDescontoMaximoIndividual: user.limiteDescontoMaximoIndividual,
                    quantidadeMaximaReservasIndividual: user.quantidadeMaximaReservasIndividual
                });

                console.log('📊 Permissões individuais do usuário:', user.permissoesIndividuais);
                console.log('💰 Limite de desconto individual:', user.limiteDescontoMaximoIndividual);
                console.log('🏠 Quantidade máxima de reservas:', user.quantidadeMaximaReservasIndividual);

                // Mapear permissões individuais
                if (user.permissoesIndividuais && user.permissoesIndividuais.length > 0) {
                    this.mapPermissionsToRows(user.permissoesIndividuais);
                }

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
                        this.sortHorarios();
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
            // Remove fields that shouldn't be sent on update (email/cpf are generally immutable here)
            const { cpf, email, senha, ...updatePayload } = formValue;
            updatePayload.id = this.userId;

            // Construir array de permissões individuais
            const permissoesIndividuais: PermissaoRecursoInput[] = [];
            this.permissionRows.forEach(row => {
                if (row.canCreate) permissoesIndividuais.push({ recursoId: row.recursoId, acao: EAcao.CRIAR, nivelAcesso: row.scope });
                if (row.canRead) permissoesIndividuais.push({ recursoId: row.recursoId, acao: EAcao.LER, nivelAcesso: row.scope });
                if (row.canUpdate) permissoesIndividuais.push({ recursoId: row.recursoId, acao: EAcao.ATUALIZAR, nivelAcesso: row.scope });
                if (row.canDelete) permissoesIndividuais.push({ recursoId: row.recursoId, acao: EAcao.EXCLUIR, nivelAcesso: row.scope });
            });

            updatePayload.permissoesIndividuais = permissoesIndividuais.length > 0 ? permissoesIndividuais : undefined;

            console.log('📤 Enviando permissões individuais:', permissoesIndividuais);

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
            // CREATE MODE
            // Construir array de permissões individuais
            const permissoesIndividuais: PermissaoRecursoInput[] = [];
            this.permissionRows.forEach(row => {
                if (row.canCreate) permissoesIndividuais.push({ recursoId: row.recursoId, acao: EAcao.CRIAR, nivelAcesso: row.scope });
                if (row.canRead) permissoesIndividuais.push({ recursoId: row.recursoId, acao: EAcao.LER, nivelAcesso: row.scope });
                if (row.canUpdate) permissoesIndividuais.push({ recursoId: row.recursoId, acao: EAcao.ATUALIZAR, nivelAcesso: row.scope });
                if (row.canDelete) permissoesIndividuais.push({ recursoId: row.recursoId, acao: EAcao.EXCLUIR, nivelAcesso: row.scope });
            });

            const createPayload: any = {
                nomeCompleto: formValue.nomeCompleto,
                email: formValue.email,
                senha: formValue.senha,
                cpf: formValue.cpf,
                telefone: formValue.telefone,
                role: formValue.role,
                empresaIds: formValue.empresaIds,
                perfilAcessoId: formValue.perfilAcessoId,
                tipoUsuario: formValue.tipoUsuario,
                equipeIds: formValue.equipeIds || [],
                restricaoHorario: this.hasRestricaoHorario ? formValue.restricaoHorario : null,
                permissoesIndividuais: permissoesIndividuais.length > 0 ? permissoesIndividuais : undefined,
                limiteDescontoMaximoIndividual: formValue.limiteDescontoMaximoIndividual,
                quantidadeMaximaReservasIndividual: formValue.quantidadeMaximaReservasIndividual
            };

            console.log('📤 Create payload:', createPayload);

            this.service.create(createPayload).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Usuário criado com sucesso' });
                    setTimeout(() => this.router.navigate(['/users']), 1000);
                },
                error: (err) => {
                    console.error('Erro ao criar usuário:', err);
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao criar usuário. Verifique os dados.' });
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
