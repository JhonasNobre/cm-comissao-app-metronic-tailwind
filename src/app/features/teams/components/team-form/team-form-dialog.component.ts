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
import { TranslocoModule } from '@jsverse/transloco';
import { BaseFormDialogComponent } from '../../../../shared/components/base/base-form/base-form-dialog.component';
import { TeamCreateDTO, TeamUpdateDTO } from '../../models/team.model';
import { AccessProfileService } from '../../../access-profiles/services/access-profile.service';
import { AccessProfile } from '../../../access-profiles/models/access-profile.model';
import { TeamGroupService, GrupoEquipe } from '../../services/team-group.service';

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
        TooltipModule
    ],
    templateUrl: './team-form-dialog.component.html'
})
export class TeamFormDialogComponent extends BaseFormDialogComponent<TeamCreateDTO | TeamUpdateDTO> {
    private accessProfileService = inject(AccessProfileService);
    private teamGroupService = inject(TeamGroupService);

    accessProfiles: AccessProfile[] = [];
    hasRestricaoHorario = false;

    diasSemanaOptions: any[] = [];

    // Configurações de Grupos
    groups: GrupoEquipe[] = [];
    displayGroupDialog: boolean = false;
    currentGroup: GrupoEquipe = { id: '', nome: '', idEquipe: '' };
    isNewGroup: boolean = false;
    submittedGroup: boolean = false;

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
                perfilAcessoId: data.perfilAcessoId
            });

            this.loadGroups(data.id);

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
            groups: this.groups // Adiciona grupos ao resultado para processamento posterior se necessário
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

    openNewGroup() {
        this.currentGroup = { id: '', nome: '', idEquipe: this.form.get('id')?.value || '' };
        this.submittedGroup = false;
        this.isNewGroup = true;
        this.displayGroupDialog = true;
    }

    editGroup(group: GrupoEquipe) {
        this.currentGroup = { ...group };
        this.submittedGroup = false;
        this.isNewGroup = false;
        this.displayGroupDialog = true;
    }

    deleteGroup(group: GrupoEquipe) {
        // Se a equipe já existe (tem ID), deleta direto na API
        const teamId = this.form.get('id')?.value;
        if (teamId) {
            this.teamGroupService.delete(group.id).subscribe({
                next: () => {
                    this.groups = this.groups.filter(g => g.id !== group.id);
                },
                error: (err: any) => console.error('Erro ao deletar grupo', err)
            });
        } else {
            // Se a equipe é nova, apenas deleta da lista local
            this.groups = this.groups.filter(g => g !== group);
        }
    }

    saveGroup() {
        this.submittedGroup = true;

        if (!this.currentGroup.nome?.trim()) {
            return;
        }

        const teamId = this.form.get('id')?.value;

        // Se estamos editando uma equipe existente
        if (teamId) {
            if (this.isNewGroup) {
                const payload = { ...this.currentGroup, idEquipe: teamId };
                this.teamGroupService.create(payload).subscribe({
                    next: (newId: string) => {
                        this.currentGroup.id = newId;
                        this.groups.push(this.currentGroup);
                        this.displayGroupDialog = false;
                        this.groups = [...this.groups]; // Refresh UI
                    },
                    error: (err: any) => console.error('Erro ao criar grupo', err)
                });
            } else {
                this.teamGroupService.update(this.currentGroup, this.currentGroup.id).subscribe({
                    next: () => {
                        const index = this.groups.findIndex(g => g.id === this.currentGroup.id);
                        if (index !== -1) {
                            this.groups[index] = this.currentGroup;
                        }
                        this.displayGroupDialog = false;
                        this.groups = [...this.groups]; // Refresh UI
                    },
                    error: (err: any) => console.error('Erro ao atualizar grupo', err)
                });
            }
        }
        // Se estamos criando uma equipe nova (dados apenas em memória)
        else {
            if (this.isNewGroup) {
                // Gera ID temporário para manipulação local
                this.currentGroup.id = 'temp-' + new Date().getTime();
                this.groups.push(this.currentGroup);
            } else {
                const index = this.groups.findIndex(g => g.id === this.currentGroup.id);
                if (index !== -1) {
                    this.groups[index] = this.currentGroup;
                }
            }
            this.displayGroupDialog = false;
            this.groups = [...this.groups];
        }
    }

    cancelGroup() {
        this.displayGroupDialog = false;
    }
}
