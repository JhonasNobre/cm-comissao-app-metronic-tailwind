import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, switchMap, forkJoin, of, map } from 'rxjs';
import { TeamService } from '../../services/team.service';
import { TeamListDTO, TeamCreateDTO, TeamUpdateDTO } from '../../models/team.model';
import { TeamGroupService } from '../../services/team-group.service';
import { GenericPTableComponent } from '../../../../shared/components/ui/generic-p-table/generic-p-table.component';
import { ColumnHeader } from '../../../../shared/models/column-header.model';
import { BaseListComponent } from '../../../../shared/components/base/base-list/base-list.component';
import { TeamFormDialogComponent } from '../team-form/team-form-dialog.component';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
    selector: 'app-team-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        GenericPTableComponent,
        TranslocoModule
    ],
    templateUrl: './team-list.component.html'
})
export class TeamListComponent extends BaseListComponent<TeamListDTO> {
    private teamService = inject(TeamService);
    private teamGroupService = inject(TeamGroupService);

    protected storageKey = 'teams-list';

    columns: ColumnHeader<TeamListDTO>[] = [
        { field: 'nome', header: 'Nome' },
        { field: 'perfilAcessoNome', header: 'Perfil de Acesso' },
        { field: 'quantidadeUsuarios', header: 'Membros' },
        { field: 'criadoEm', header: 'Criado Em', displayAs: 'date' }
    ];

    protected loadData(params: any): Observable<TeamListDTO[]> {
        return this.teamService.list(params);
    }

    protected override onDelete(id: string): Observable<void> {
        return this.teamService.delete(id);
    }

    protected override onAdd(object: TeamListDTO): Observable<any> {
        const teamDto = object as unknown as TeamCreateDTO;
        const groups = teamDto.groups;

        return this.teamService.create(teamDto).pipe(
            switchMap((response: any) => {
                // Tenta extrair o ID da resposta
                let teamId = response;
                if (response && response.data) {
                    teamId = response.data;
                } else if (response && response.id) {
                    teamId = response.id;
                }

                if (groups && groups.length > 0 && typeof teamId === 'string') {
                    const groupObservables = groups.map((g: any) => {
                        return this.teamGroupService.create({ ...g, idEquipe: teamId });
                    });
                    // Aguarda todos os grupos serem criados e retorna a resposta original (ou processada)
                    return forkJoin(groupObservables).pipe(map(() => response));
                }

                return of(response);
            })
        );
    }

    protected override onEdit(object: TeamListDTO, id: string): Observable<any> {
        return this.teamService.update(object as unknown as TeamUpdateDTO, id);
    }

    override openDialog(object?: TeamListDTO) {
        if (object?.id) {
            // Edit mode - load full team data with restrictions
            this.teamService.get(object.id).subscribe({
                next: (fullTeam) => {
                    this.showDialog(fullTeam);
                },
                error: (err) => {
                    console.error('Error loading team', err);
                    this.showError('Erro ao carregar equipe');
                }
            });
        } else {
            // Create mode
            this.showDialog();
        }
    }

    private showDialog(teamData?: any) {
        const ref = this.dialogService.open(TeamFormDialogComponent, {
            data: teamData || {},
            header: teamData?.id ? this.translate.translate('teams.list.edit_team') : this.translate.translate('teams.list.new_team'),
            closable: true,
            modal: true,
            draggable: true,
            resizable: true,
            contentStyle: { overflow: 'auto' },
            style: {
                width: '800px',
                maxWidth: '99vw',
                maxHeight: '99vh'
            }
        });

        if (ref) {
            ref.onClose.subscribe((result: TeamCreateDTO | TeamUpdateDTO) => {
                if (result) {
                    this.handleSave(result as unknown as TeamListDTO, teamData?.id);
                }
            });
        }
    }

    // Helper method to handle save logic since it's private in BaseListComponent
    // Wait, handleSave is private in BaseListComponent. I cannot call it.
    // I should check BaseListComponent visibility.
    // If handleSave is private, I need to duplicate logic or change visibility.
    // Let's check BaseListComponent again.
}
