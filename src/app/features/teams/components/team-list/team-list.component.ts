import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TeamService } from '../../services/team.service';
import { TeamListDTO } from '../../models/team.model';
import { GenericPTableComponent } from '../../../../shared/components/ui/generic-p-table/generic-p-table.component';
import { ColumnHeader } from '../../../../shared/models/column-header.model';

@Component({
    selector: 'app-team-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        GenericPTableComponent
    ],
    templateUrl: './team-list.component.html'
})
export class TeamListComponent implements OnInit {
    private teamService = inject(TeamService);
    private router = inject(Router);

    teams: TeamListDTO[] = [];

    columns: ColumnHeader<TeamListDTO>[] = [
        { field: 'nome', header: 'Nome' },
        { field: 'perfilAcessoNome', header: 'Perfil de Acesso' },
        { field: 'quantidadeUsuarios', header: 'Membros' },
        { field: 'criadoEm', header: 'Criado Em', displayAs: 'date' }
    ];

    ngOnInit(): void {
        this.loadTeams();
    }

    loadTeams() {
        this.teamService.list().subscribe({
            next: (data) => {
                this.teams = data;
            },
            error: (err) => console.error('Error loading teams', err)
        });
    }

    onNew(): void {
        this.router.navigate(['/teams/new']);
    }

    onEdit(item: TeamListDTO) {
        this.router.navigate(['/teams', item.id]);
    }

    onDelete(item: TeamListDTO) {
        if (confirm(`Deseja realmente excluir a equipe "${item.nome}"?`)) {
            this.teamService.delete(item.id).subscribe({
                next: () => {
                    this.teams = this.teams.filter(t => t.id !== item.id);
                },
                error: (err) => console.error('Error deleting team', err)
            });
        }
    }
}
