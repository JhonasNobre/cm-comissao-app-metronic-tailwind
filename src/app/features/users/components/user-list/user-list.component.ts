import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { UserListDTO } from '../../models/user.model';
import { GenericPTableComponent } from '../../../../shared/components/ui/generic-p-table/generic-p-table.component';
import { ColumnHeader } from '../../../../shared/models/column-header.model';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        GenericPTableComponent
    ],
    templateUrl: './user-list.component.html'
})
export class UserListComponent implements OnInit {
    private userService = inject(UserService);
    private router = inject(Router);

    users: UserListDTO[] = [];
    loading: boolean = true;
    columns: ColumnHeader<UserListDTO>[] = [];

    ngOnInit(): void {
        this.initializeColumns();
        this.loadUsers();
    }

    private initializeColumns(): void {
        this.columns = [
            { field: 'nome', header: 'Nome' },
            { field: 'email', header: 'Email' },
            { field: 'perfil', header: 'Perfil' },
            { field: 'ativo', header: 'Status' }
        ];
    }

    private loadUsers(): void {
        this.loading = true;
        this.userService.list().subscribe({
            next: (data) => {
                this.users = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading users', err);
                this.loading = false;
            }
        });
    }

    onNew(): void {
        this.router.navigate(['/users/new']);
    }

    onEdit(user: UserListDTO): void {
        this.router.navigate(['/users', user.id]);
    }

    onDelete(user: UserListDTO): void {
        // TODO: Use a proper confirmation dialog service
        if (confirm(`Deseja realmente excluir o usuário "${user.nome}"?`)) {
            this.userService.delete(user.id).subscribe({
                next: () => {
                    this.users = this.users.filter(u => u.id !== user.id);
                },
                error: (err) => console.error('Error deleting user', err)
            });
        }
    }
}
