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
import { TableModule } from 'primeng/table';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { AccessProfileService } from '../../services/access-profile.service';
import { PermissionDetail } from '../../models/access-profile.model';

@Component({
    selector: 'app-access-profile-form',
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
        TableModule,
        InputNumberModule
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

    // Helper for permissions UI
    permissionRows: any[] = [];

    diasSemanaOptions = [
        { label: 'Domingo', value: 0 },
        { label: 'Segunda', value: 1 },
        { label: 'Terça', value: 2 },
        { label: 'Quarta', value: 3 },
        { label: 'Quinta', value: 4 },
        { label: 'Sexta', value: 5 },
        { label: 'Sábado', value: 6 }
    ];

    scopeOptions = [
        { label: 'Dados do Usuário', value: 'DADOS_USUARIO' },
        { label: 'Dados da Equipe', value: 'DADOS_EQUIPE' },
        { label: 'Todos', value: 'TODOS' }
    ];

    ngOnInit(): void {
        this.initForm();
        this.loadResources();
        this.checkEditMode();
    }

    private initForm(): void {
        this.form = this.fb.group({
            nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
            limiteDescontoMaximo: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
            quantidadeMaximaReservas: [0, [Validators.required, Validators.min(0)]],
            ehPadrao: [false],
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

    private loadResources(): void {
        this.service.listResources().subscribe({
            next: (data) => {
                this.resources = data;
                this.initPermissionRows();
            },
            error: (err) => console.error('Error loading resources', err)
        });
    }

    private initPermissionRows(): void {
        // Create a row for each resource
        this.permissionRows = this.resources.map(res => ({
            recursoId: res.id,
            recursoNome: res.nome,
            canCreate: false,
            canRead: false,
            canUpdate: false,
            canDelete: false,
            scope: 'DADOS_USUARIO' // Default scope
        }));
    }

    private checkEditMode(): void {
        this.profileId = this.route.snapshot.paramMap.get('id');
        if (this.profileId) {
            this.isEditMode = true;
            this.loadProfile(this.profileId);
        }
    }

    private loadProfile(id: string): void {
        this.loading = true;
        this.service.get(id).subscribe({
            next: (profile: any) => {
                if (profile) {
                    this.form.patchValue({
                        nome: profile.nome,
                        limiteDescontoMaximo: profile.limiteDescontoMaximo,
                        quantidadeMaximaReservas: profile.quantidadeMaximaReservas,
                        ehPadrao: profile.ehPadrao
                    });

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

                    // Map permissions to UI rows
                    if (profile.permissoes) {
                        this.mapPermissionsToRows(profile.permissoes);
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

    private mapPermissionsToRows(permissions: PermissionDetail[]): void {
        // Reset rows first (or keep init state)
        // Iterate over permissions and update rows
        permissions.forEach(p => {
            const row = this.permissionRows.find(r => r.recursoId === p.recursoId);
            if (row) {
                if (p.acao === 'CRIAR') row.canCreate = true;
                if (p.acao === 'LER') row.canRead = true;
                if (p.acao === 'ATUALIZAR') row.canUpdate = true;
                if (p.acao === 'EXCLUIR') row.canDelete = true;
                row.scope = p.nivelAcesso; // Assuming scope is same for all actions of a resource for simplicity, or taking the last one
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

        // Build permissions list
        const permissions: any[] = [];
        this.permissionRows.forEach(row => {
            if (row.canCreate) permissions.push({ recursoId: row.recursoId, acao: 'CRIAR', nivelAcesso: row.scope });
            if (row.canRead) permissions.push({ recursoId: row.recursoId, acao: 'LER', nivelAcesso: row.scope });
            if (row.canUpdate) permissions.push({ recursoId: row.recursoId, acao: 'ATUALIZAR', nivelAcesso: row.scope });
            if (row.canDelete) permissions.push({ recursoId: row.recursoId, acao: 'EXCLUIR', nivelAcesso: row.scope });
        });

        if (permissions.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione ao menos uma permissão.' });
            this.loading = false;
            return;
        }

        const payload = {
            ...formValue,
            restricaoHorario: this.hasRestricaoHorario ? formValue.restricaoHorario : null,
            permissoes: permissions
        };

        if (this.isEditMode && this.profileId) {
            this.service.update(this.profileId, payload).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Perfil atualizado com sucesso' });
                    setTimeout(() => this.router.navigate(['/access-profiles']), 1000);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao atualizar perfil' });
                    this.loading = false;
                }
            });
        } else {
            this.service.create(payload).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Perfil criado com sucesso' });
                    setTimeout(() => this.router.navigate(['/access-profiles']), 1000);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao criar perfil' });
                    this.loading = false;
                }
            });
        }
    }

    onCancel(): void {
        this.router.navigate(['/access-profiles']);
    }
}
