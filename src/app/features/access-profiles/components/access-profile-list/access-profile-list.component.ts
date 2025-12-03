import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AccessProfileService } from '../../services/access-profile.service';
import { AccessProfile } from '../../models/access-profile.model';
import { GenericPTableComponent } from '../../../../shared/components/ui/generic-p-table/generic-p-table.component';
import { ColumnHeader } from '../../../../shared/models/column-header.model';

@Component({
    selector: 'app-access-profile-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        GenericPTableComponent
    ],
    templateUrl: './access-profile-list.component.html'
})
export class AccessProfileListComponent implements OnInit {
    private service = inject(AccessProfileService);
    private router = inject(Router);

    profiles: AccessProfile[] = [];
    columns: ColumnHeader<AccessProfile>[] = [
        { field: 'nome', header: 'Nome' },
        { field: 'limiteDescontoMaximo', header: 'Limite Desconto (%)' },
        { field: 'quantidadeMaximaReservas', header: 'Max. Reservas' },
        { field: 'ehPadrao', header: 'Padrão', displayAs: 'yesNo' }
    ];

    ngOnInit(): void {
        this.loadProfiles();
    }

    loadProfiles() {
        this.service.list().subscribe({
            next: (data) => {
                this.profiles = data;
            },
            error: (err) => console.error('Error loading profiles', err)
        });
    }

    onNew(): void {
        this.router.navigate(['/access-profiles/new']);
    }

    onEdit(item: AccessProfile) {
        this.router.navigate(['/access-profiles', item.id]);
    }

    onDelete(item: AccessProfile) {
        if (confirm(`Deseja realmente excluir o perfil "${item.nome}"?`)) {
            this.service.delete(item.id).subscribe({
                next: () => {
                    this.profiles = this.profiles.filter(p => p.id !== item.id);
                },
                error: (err) => console.error('Error deleting profile', err)
            });
        }
    }
}
