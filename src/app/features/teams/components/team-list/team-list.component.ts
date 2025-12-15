import { Component, inject, AfterViewInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { TeamService } from '../../services/team.service';
import { TeamListDTO, TeamCreateDTO, TeamUpdateDTO } from '../../models/team.model';
import { ColumnHeader } from '../../../../shared/models/column-header.model';
import { BaseListComponent } from '../../../../shared/components/base/base-list/base-list.component';
import { TeamFormDialogComponent } from '../team-form/team-form-dialog.component';
import { TranslocoModule } from '@jsverse/transloco';
import { GenericPTableComponent } from '../../../../shared/components/ui/generic-p-table/generic-p-table.component';


@Component({
    selector: 'app-team-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        TranslocoModule,
        GenericPTableComponent // Usando componente genérico
    ],
    templateUrl: './team-list.component.html'
})
export class TeamListComponent extends BaseListComponent<TeamListDTO> implements AfterViewInit {
    private teamService = inject(TeamService);

    // Referências aos templates definidos no HTML
    @ViewChild('nameTemplate') nameTemplate!: TemplateRef<any>;
    @ViewChild('groupTemplate') groupTemplate!: TemplateRef<any>;
    @ViewChild('leaderTemplate') leaderTemplate!: TemplateRef<any>;
    @ViewChild('profileTemplate') profileTemplate!: TemplateRef<any>;
    @ViewChild('membersTemplate') membersTemplate!: TemplateRef<any>;

    protected storageKey = 'teams-list';

    // Propriedade loading usada no template
    loading = false;
    viewMode: 'grid' | 'list' = 'grid';

    columns: ColumnHeader<TeamListDTO>[] = [];

    // Inicializa colunas após a view carregar para ter acesso aos templates
    ngAfterViewInit() {
        // Timeout para evitar ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
            this.columns = [
                { field: 'nome', header: 'Nome', bodyTemplate: this.nameTemplate },
                { field: 'grupoEquipeNome', header: 'Grupo', bodyTemplate: this.groupTemplate },
                { field: 'liderNome', header: 'Líder', bodyTemplate: this.leaderTemplate },
                { field: 'perfilAcessoNome', header: 'Perfil de Acesso', bodyTemplate: this.profileTemplate },
                { field: 'quantidadeUsuarios', header: 'Membros', bodyTemplate: this.membersTemplate },
                // { field: 'criadoEm', header: 'Criado Em', displayAs: 'date' } // Opcional
            ];
        });
    }

    protected loadData(params: any): Observable<TeamListDTO[]> {
        return this.teamService.list(params);
    }

    protected override onDelete(id: string): Observable<void> {
        return this.teamService.delete(id);
    }

    protected override onAdd(object: TeamListDTO): Observable<any> {
        return this.teamService.create(object as unknown as TeamCreateDTO);
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

    /**
     * Gera iniciais do nome para avatar
     */
    getInitials(nome: string | undefined): string {
        if (!nome) return '??';
        const parts = nome.trim().split(' ');
        if (parts.length === 1) {
            return parts[0].substring(0, 2).toUpperCase();
        }
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    /**
     * Gera classe de cor do avatar baseada no email (ou nome)
     * Cores consistentes para mesmo usuário
     */
    getAvatarClasses(identifier: string | undefined): string {
        const colors = [
            'bg-blue-500',
            'bg-green-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-indigo-500',
            'bg-yellow-500',
            'bg-red-500',
            'bg-teal-500'
        ];

        if (!identifier) return colors[0];

        // Hash simples baseado no identifier
        const hash = identifier.split('').reduce((acc, char) => {
            return char.charCodeAt(0) + ((acc << 5) - acc);
        }, 0);

        return colors[Math.abs(hash) % colors.length];
    }
}
