import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AccessProfileService } from '../../services/access-profile.service';
import { AccessProfile } from '../../models/access-profile.model';
import { GenericPTableComponent } from '../../../../shared/components/ui/generic-p-table/generic-p-table.component';
import { ColumnHeader } from '../../../../shared/models/column-header.model';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
    selector: 'app-access-profile-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        GenericPTableComponent,
        ConfirmDialogModule
    ],
    providers: [ConfirmationService],
    templateUrl: './access-profile-list.component.html'
})
export class AccessProfileListComponent implements OnInit {
    private service = inject(AccessProfileService);
    private router = inject(Router);
    private confirmationService = inject(ConfirmationService);

    profiles: AccessProfile[] = [];
    loading = true;

    columns: ColumnHeader<AccessProfile>[] = [
        { field: 'nome', header: 'Nome' },
        { field: 'limiteDescontoMaximo', header: 'Limite Desconto (%)' },
        { field: 'quantidadeMaximaReservas', header: 'Max. Reservas' },
        { field: 'ehPadrao', header: 'Padrão' }
    ];

    ngOnInit(): void {
        this.loadProfiles();
    }

    loadProfiles(): void {
        this.loading = true;
        this.service.list().subscribe({
            next: (data) => {
                this.profiles = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading profiles', err);
                this.loading = false;
            }
        });
    }

    onAdd(): void {
        this.router.navigate(['/access-profiles/new']);
    }

    onEdit(profile: AccessProfile): void {
        this.router.navigate(['/access-profiles', profile.id]);
    }

    onDelete(profile: AccessProfile): void {
        this.confirmationService.confirm({
            message: `Deseja realmente excluir o perfil "${profile.nome}"?`,
            header: 'Confirmar Exclusão',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sim, excluir',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.service.delete(profile.id).subscribe({
                    next: () => {
                        this.profiles = this.profiles.filter(p => p.id !== profile.id);
                    },
                    error: (err) => console.error('Error deleting profile', err)
                });
            }
        });
    }
}
