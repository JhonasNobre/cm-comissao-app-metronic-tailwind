import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { InputMaskModule } from 'primeng/inputmask';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';
import { TranslocoModule } from '@jsverse/transloco';
import { forkJoin } from 'rxjs';
import { BaseFormDialogComponent } from '../../../../shared/components/base/base-form/base-form-dialog.component';
import { TeamCreateDTO, TeamUpdateDTO, MembroEquipe } from '../../models/team.model';
import { AccessProfileService } from '../../../access-profiles/services/access-profile.service';
import { AccessProfile } from '../../../access-profiles/models/access-profile.model';
import { TeamGroupService, GrupoEquipe } from '../../services/team-group.service';
import { TeamService } from '../../services/team.service';

@Component({
    selector: 'app-team-form-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        CheckboxModule,
        SelectModule,
        InputMaskModule,
        DividerModule,
        TranslocoModule,
        DialogModule,
        TooltipModule,
        TextareaModule
    ],
    templateUrl: './team-form-dialog.component.html'
})
export class TeamFormDialogComponent extends BaseFormDialogComponent<TeamCreateDTO | TeamUpdateDTO> {
    private accessProfileService = inject(AccessProfileService);
    private teamGroupService = inject(TeamGroupService);
    private teamService = inject(TeamService);

    accessProfiles: AccessProfile[] = [];
    hasRestricaoHorario = false;

    diasSemanaOptions: any[] = [];

    // Configurações de Grupos
    groups: GrupoEquipe[] = [];
    displayGroupDialog: boolean = false;
    currentGroup: GrupoEquipe = { id: '', nome: '', idEquipe: '', cor: '#FFE69C' };
    isNewGroup: boolean = false;
    submittedGroup: boolean = false;

    // Cores predefinidas (mesmo padrão do React)
    coresGrupo: string[] = [
        '#FFE69C',
        '#FEB272',
        '#F1416C',
        '#3E97FF',
        '#0DCAF0',
        '#3A7A57',
        '#8C68CD'
    ];

    // Gestão de Membros
    membros: MembroEquipe[] = [];
    emailInput: string = '';
    grupoMembroId: string = '';
    loadingMembro: boolean = false;
    erroMembro: string = '';

    protected override onInitDialog(data: any): void {
        this.diasSemanaOptions = [
            { label: this.translate.translate('general.days.sunday'), value: 'Domingo' },
            { label: this.translate.translate('general.days.monday'), value: 'Segunda' },
            { label: this.translate.translate('general.days.tuesday'), value: 'Terca' },
            { label: this.translate.translate('general.days.wednesday'), value: 'Quarta' },
            { label: this.translate.translate('general.days.thursday'), value: 'Quinta' },
            { label: this.translate.translate('general.days.friday'), value: 'Sexta' },
            { label: this.translate.translate('general.days.saturday'), value: 'Sabado' }
        ];

        this.loadAccessProfiles();

        if (data && data.id) {
            this.form.patchValue({
                id: data.id,
                nome: data.nome,
                descricao: data.descricao || '',
                perfilAcessoId: data.perfilAcessoId
            });

            this.loadGroups(data.id);
            this.loadMembros(data.id);

            if (data.restricaoHorario) {
                this.hasRestricaoHorario = true;
                this.form.get('restricaoHorario')?.patchValue({
                    bloquearEmFeriadosNacionais: data.restricaoHorario.bloquearEmFeriadosNacionais,
                    ufFeriados: data.restricaoHorario.ufFeriados,
                    codigoIbgeMunicipio: data.restricaoHorario.codigoIbgeMunicipio
                });

                if (data.restricaoHorario?.horarios) {
                    this.clearHorarios();
                    data.restricaoHorario.horarios.forEach((h: any) => {
                        this.addHorario(h);
                    });
                    this.sortHorarios();
                }
            } else {
                this.hasRestricaoHorario = false;
            }
        }
    }

    protected override newForm(): FormGroup {
        return this.formBuilder.group({
            id: [null],
            nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
            descricao: [''],
            perfilAcessoId: [null],
            restricaoHorario: this.formBuilder.group({
                bloquearEmFeriadosNacionais: [false],
                ufFeriados: [''],
                codigoIbgeMunicipio: [''],
                horarios: this.formBuilder.array([])
            })
        });
    }

    protected override getFormValue(): TeamCreateDTO | TeamUpdateDTO {
        const formValue = this.form.getRawValue();
        return {
            ...formValue,
            restricaoHorario: this.hasRestricaoHorario ? formValue.restricaoHorario : null,
            groups: this.groups
        };
    }

    private loadAccessProfiles(): void {
        this.accessProfileService.list().subscribe({
            next: (profiles) => this.accessProfiles = profiles,
            error: (err) => console.error('Error loading access profiles', err)
        });
    }

    get horarios(): FormArray {
        return this.form.get('restricaoHorario.horarios') as FormArray;
    }

    addHorario(data?: any): void {
        const horarioGroup = this.formBuilder.group({
            diaSemana: [data?.diaSemana ?? 'Segunda', Validators.required],
            horaInicio: [data?.horaInicio ?? '08:00', Validators.required],
            horaFim: [data?.horaFim ?? '18:00', Validators.required]
        });
        this.horarios.push(horarioGroup);
        this.sortHorarios();
    }

    removeHorario(index: number): void {
        this.horarios.removeAt(index);
    }

    clearHorarios(): void {
        while (this.horarios.length !== 0) {
            this.horarios.removeAt(0);
        }
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

        this.clearHorarios();
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
            this.clearHorarios();
        } else if (this.horarios.length === 0) {
            this.addHorario();
        }
    }

    // --- Métodos de Gestão de Grupos ---

    loadGroups(teamId: string): void {
        this.teamGroupService.listByTeam(teamId).subscribe({
            next: (data) => this.groups = data,
            error: (err: any) => console.error('Erro ao carregar grupos', err)
        });
    }

    openNewGroup(): void {
        this.currentGroup = { id: '', nome: '', idEquipe: this.form.get('id')?.value || '', cor: '#FFE69C' };
        this.submittedGroup = false;
        this.isNewGroup = true;
        this.displayGroupDialog = true;
    }

    editGroup(group: GrupoEquipe): void {
        this.currentGroup = { ...group };
        this.submittedGroup = false;
        this.isNewGroup = false;
        this.displayGroupDialog = true;
    }

    deleteGroup(group: GrupoEquipe): void {
        const teamId = this.form.get('id')?.value;
        if (teamId && !group.isNew) {
            this.teamGroupService.delete(group.id).subscribe({
                next: () => {
                    this.groups = this.groups.filter(g => g.id !== group.id);
                    this.membros = this.membros.filter(m => m.grupoEquipeId !== group.id);
                },
                error: (err: any) => console.error('Erro ao deletar grupo', err)
            });
        } else {
            this.groups = this.groups.filter(g => g !== group);
            this.membros = this.membros.filter(m => m.grupoEquipeId !== group.id);
        }
    }

    selectCor(cor: string): void {
        this.currentGroup = { ...this.currentGroup, cor };
    }

    saveGroup(): void {
        this.submittedGroup = true;

        if (!this.currentGroup.nome?.trim()) {
            return;
        }

        const teamId = this.form.get('id')?.value;

        if (teamId) {
            if (this.isNewGroup) {
                const payload = { ...this.currentGroup, idEquipe: teamId };
                this.teamGroupService.create(payload).subscribe({
                    next: (newId: string) => {
                        this.currentGroup.id = newId;
                        this.groups = [...this.groups, { ...this.currentGroup }];
                        this.displayGroupDialog = false;
                    },
                    error: (err: any) => console.error('Erro ao criar grupo', err)
                });
            } else {
                this.teamGroupService.update(this.currentGroup, this.currentGroup.id).subscribe({
                    next: () => {
                        const index = this.groups.findIndex(g => g.id === this.currentGroup.id);
                        if (index !== -1) {
                            this.groups[index] = { ...this.currentGroup };
                        }
                        this.groups = [...this.groups];
                        this.displayGroupDialog = false;
                    },
                    error: (err: any) => console.error('Erro ao atualizar grupo', err)
                });
            }
        } else {
            // Equipe nova — persiste apenas localmente
            if (this.isNewGroup) {
                this.currentGroup.id = 'temp-' + crypto.randomUUID();
                this.currentGroup.isNew = true;
                this.groups = [...this.groups, { ...this.currentGroup }];
            } else {
                const index = this.groups.findIndex(g => g.id === this.currentGroup.id);
                if (index !== -1) {
                    this.groups[index] = { ...this.currentGroup };
                    this.groups = [...this.groups];
                }
            }
            this.displayGroupDialog = false;
        }
    }

    cancelGroup(): void {
        this.displayGroupDialog = false;
    }

    getGrupoById(id: string): GrupoEquipe | undefined {
        return this.groups.find(g => g.id === id);
    }

    membrosDoGrupo(grupoId: string): MembroEquipe[] {
        return this.membros.filter(m => m.grupoEquipeId === grupoId);
    }

    // --- Métodos de Gestão de Membros ---

    loadMembros(teamId: string): void {
        this.teamService.listarMembros(teamId).subscribe({
            next: (data) => this.membros = data,
            error: (err: any) => console.error('Erro ao carregar membros', err)
        });
    }

    validateEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    adicionarMembro(): void {
        this.erroMembro = '';

        if (!this.grupoMembroId) {
            this.erroMembro = 'Selecione um grupo antes de adicionar um membro.';
            return;
        }

        const emails = this.emailInput
            .split(';')
            .map(e => e.trim())
            .filter(e => e !== '');

        if (emails.length === 0) {
            this.erroMembro = 'Insira pelo menos um e-mail.';
            return;
        }

        const invalidos = emails.filter(e => !this.validateEmail(e));
        if (invalidos.length > 0) {
            this.erroMembro = `E-mail(s) inválido(s): ${invalidos.join(', ')}`;
            return;
        }

        const teamId = this.form.get('id')?.value;
        const grupo = this.getGrupoById(this.grupoMembroId);

        if (teamId && !grupo?.isNew) {
            // Equipe existente — salva na API
            this.loadingMembro = true;
            const observables = emails.map(email =>
                this.teamService.adicionarMembro(teamId, email, this.grupoMembroId)
            );

            forkJoin(observables).subscribe({
                next: () => {
                    this.loadMembros(teamId);
                    this.emailInput = '';
                    this.grupoMembroId = '';
                    this.loadingMembro = false;
                },
                error: (err: any) => {
                    console.error('Erro ao adicionar membro', err);
                    this.erroMembro = 'Erro ao adicionar membro. Tente novamente.';
                    this.loadingMembro = false;
                }
            });
        } else {
            // Equipe ou grupo novos — salva localmente
            emails.forEach(email => {
                const jaExiste = this.membros.some(m => m.email === email && m.grupoEquipeId === this.grupoMembroId);
                if (!jaExiste) {
                    this.membros = [...this.membros, {
                        usuarioId: '',
                        nome: email.split('@')[0],
                        email,
                        perfilNome: '',
                        grupoEquipeId: this.grupoMembroId
                    }];
                }
            });
            this.emailInput = '';
            this.grupoMembroId = '';
        }
    }

    removerMembro(membro: MembroEquipe): void {
        const teamId = this.form.get('id')?.value;

        if (teamId && membro.usuarioId) {
            this.teamService.removerMembro(teamId, membro.usuarioId).subscribe({
                next: () => {
                    this.membros = this.membros.filter(m => m !== membro);
                },
                error: (err: any) => console.error('Erro ao remover membro', err)
            });
        } else {
            this.membros = this.membros.filter(m => m !== membro);
        }
    }
}
