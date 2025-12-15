import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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

    accessProfiles: AccessProfile[] = [];
    teamGroups: TeamGroup[] = [];
    hasRestricaoHorario = false;
    members: TeamMember[] = [];

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

        // Carregar dependências em paralelo antes de preencher o form
        // para garantir que os dropdowns tenham opções
        const requests = {
            profiles: this.accessProfileService.list(),
            groups: this.teamGroupService.list({ apenasAtivos: true })
        };

        import('rxjs').then(({ forkJoin }) => {
            forkJoin(requests).subscribe({
                next: (results) => {
                    this.accessProfiles = results.profiles;
                    this.teamGroups = results.groups;

                    // Só aplica o patchValue depois que as listas estiverem carregadas
                    if (data && data.id) {
                        this.patchFormData(data);
                        this.loadMembers(data.id);
                    }
                },
                error: (err) => console.error('Error loading dependencies', err)
            });
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

    protected override newForm(): FormGroup {
        return this.formBuilder.group({
            id: [null],
            nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
            descricao: ['', [Validators.maxLength(500)]],
            grupoEquipeId: [null],
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
            restricaoHorario: this.hasRestricaoHorario ? formValue.restricaoHorario : null
        };
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
