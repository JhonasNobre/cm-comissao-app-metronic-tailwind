import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { InputMaskModule } from 'primeng/inputmask';
import { DividerModule } from 'primeng/divider';
import { TranslocoModule } from '@jsverse/transloco';
import { BaseFormDialogComponent } from '../../../../shared/components/base/base-form/base-form-dialog.component';
import { TeamCreateDTO, TeamUpdateDTO } from '../../models/team.model';
import { AccessProfileService } from '../../../access-profiles/services/access-profile.service';
import { AccessProfile } from '../../../access-profiles/models/access-profile.model';
import { TeamGroupService, TeamGroup } from '../../services/team-group.service';
import { TeamMembersService, TeamMember } from '../../services/team-members.service';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { StateService } from '../../../../features/states/services/state.service';
import { HolidayService } from '../../../../core/services/holiday.service';
import { Holiday } from '../../../../core/models/holiday.model';

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
        TableModule,
        TooltipModule
    ],
    templateUrl: './team-form-dialog.component.html'
})
export class TeamFormDialogComponent extends BaseFormDialogComponent<TeamCreateDTO | TeamUpdateDTO> {
    private accessProfileService = inject(AccessProfileService);
    private teamGroupService = inject(TeamGroupService);
    private teamMembersService = inject(TeamMembersService);
    private stateService = inject(StateService);
    private holidayService = inject(HolidayService);

    accessProfiles: AccessProfile[] = [];
    teamGroups: TeamGroup[] = [];
    hasRestricaoHorario = false;
    members: TeamMember[] = [];
    states: any[] = [];
    cities: any[] = [];

    diasSemanaOptions: any[] = [];

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

        this.loadStates();

        // Carregar dependências em paralelo antes de preencher o form
        const requests = {
            profiles: this.accessProfileService.list(),
            groups: this.teamGroupService.list({ apenasAtivos: true })
        };

        import('rxjs').then(({ forkJoin }) => {
            forkJoin(requests).subscribe({
                next: (results) => {
                    this.accessProfiles = results.profiles;
                    this.teamGroups = results.groups;

                    if (data && data.id) {
                        this.patchFormData(data);
                        this.loadMembers(data.id);
                    }
                },
                error: (err) => console.error('Error loading dependencies', err)
            });
        });

        // Listeners
        const restricaoGroup = this.form.get('restricaoHorario');

        restricaoGroup?.get('ativo')?.valueChanges.subscribe(isActive => {
            this.hasRestricaoHorario = isActive;
        });

        restricaoGroup?.get('estadoId')?.valueChanges.subscribe(stateId => {
            if (stateId) {
                this.loadCities(stateId);
            } else {
                this.cities = [];
                restricaoGroup?.get('municipioId')?.setValue(null);
            }
        });
    }

    private patchFormData(data: any): void {
        this.form.patchValue({
            id: data.id,
            nome: data.nome,
            descricao: data.descricao,
            perfilAcessoId: data.perfilAcessoId,
            grupoEquipeId: data.grupoEquipeId
        });

        if (data.restricaoHorario) {
            this.hasRestricaoHorario = true;
            this.form.get('restricaoHorario')?.patchValue({
                ativo: true,
                feriadosIds: data.restricaoHorario.feriadosIds || [],
                estadoId: data.restricaoHorario.estadoId,
                municipioId: data.restricaoHorario.municipioId
            });

            if (data.restricaoHorario.estadoId) {
                this.loadCities(data.restricaoHorario.estadoId);
            }

            if (data.restricaoHorario?.horarios) {
                this.clearHorarios();
                data.restricaoHorario.horarios.forEach((h: any) => {
                    this.addHorario(h);
                });
                this.sortHorarios();
            }
        } else {
            this.hasRestricaoHorario = false;
            this.form.get('restricaoHorario.ativo')?.setValue(false);
        }
    }

    protected override newForm(): FormGroup {
        return this.formBuilder.group({
            id: [null],
            nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
            descricao: ['', [Validators.maxLength(500)]],
            grupoEquipeId: [null],
            perfilAcessoId: [null],
            restricaoHorario: this.formBuilder.group({
                ativo: [false],
                feriadosIds: this.fb.array([]),
                estadoId: [null],
                municipioId: [null],
                horarios: this.formBuilder.array([])
            })
        });
    }

    protected override getFormValue(): TeamCreateDTO | TeamUpdateDTO {
        const formValue = this.form.getRawValue();

        const res = formValue.restricaoHorario;
        const hasRestricao = res && res.ativo;

        let restricaoPayload = null;
        if (hasRestricao) {
            const { ativo, ...rest } = res;
            restricaoPayload = rest;
        }

        return {
            ...formValue,
            restricaoHorario: restricaoPayload
        };
    }

    get horarios(): FormArray {
        return this.form.get('restricaoHorario.horarios') as FormArray;
    }

    loadStates(): void {
        this.stateService.list().subscribe(data => this.states = data);
    }

    loadCities(stateId: string): void {
        this.stateService.listCities(stateId).subscribe(data => this.cities = data);
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
        const isChecked = event.checked;
        this.hasRestricaoHorario = isChecked;

        const group = this.form.get('restricaoHorario');
        group?.get('ativo')?.setValue(isChecked);

        if (!isChecked) {
            this.form.get('restricaoHorario')?.patchValue({
                feriadosIds: [],
                estadoId: null,
                municipioId: null
            });
            this.clearHorarios();
        } else if (this.horarios.length === 0) {
            this.addHorario();
        }
    }
    loadMembers(teamId: string): void {
        this.teamMembersService.listMembers(teamId).subscribe({
            next: (members) => this.members = members,
            error: (err) => console.error('Error loading members', err)
        });
    }

    onAddMember(email: string): void {
        const teamId = this.form.get('id')?.value;
        if (!email || !teamId) return;

        this.teamMembersService.addMember(teamId, email).subscribe({
            next: () => {
                this.loadMembers(teamId);
            },
            error: (err) => {
                // O ErrorInterceptor já exibe o toast com a mensagem correta
                console.error('Erro ao adicionar membro', err);
            }
        });
    }

    onRemoveMember(member: TeamMember): void {
        const teamId = this.form.get('id')?.value;
        if (!teamId) return;

        if (confirm(`Tem certeza que deseja remover ${member.nome} da equipe?`)) {
            this.teamMembersService.removeMember(teamId, member.usuarioId).subscribe({
                next: () => this.loadMembers(teamId),
                error: (err) => console.error('Error removing member', err)
            });
        }
    }
}
