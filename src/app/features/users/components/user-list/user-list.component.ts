import { Component, OnInit, inject, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
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
export class UserListComponent implements OnInit, AfterViewInit {
    private userService = inject(UserService);
    private router = inject(Router);

    @ViewChild('nameTemplate') nameTemplate!: TemplateRef<any>;
    @ViewChild('roleTemplate') roleTemplate!: TemplateRef<any>;
    @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
    users: any[] = []; // Changed to any to support extended properties like corAvatar
    loading: boolean = true;
    columns: ColumnHeader<UserListDTO>[] = [];

    private avatarColors = ['primary', 'success', 'info', 'warning', 'danger', 'dark'];

    ngOnInit(): void {
        this.loadUsers();
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.initializeColumns();
        });
    }

    private initializeColumns(): void {
        this.columns = [
            { field: 'nome', header: 'Nome', bodyTemplate: this.nameTemplate },
            { field: 'email', header: 'Email', hidden: true },
            { field: 'perfil', header: 'Perfil', bodyTemplate: this.roleTemplate },
            { field: 'ativo', header: 'Status', bodyTemplate: this.statusTemplate }
        ];
    }

    private loadUsers(): void {
        this.loading = true;
        this.userService.list().subscribe({
            next: (data) => {
                this.users = data.map(user => ({
                    ...user,
                    corAvatar: this.getAvatarColor(user.nome)
                }));
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading users', err);
                this.loading = false;
            }
        });
    }

    getInitial(name: any): string {
        if (!name) return '';
        return String(name).charAt(0).toUpperCase();
    }

    private getAvatarColor(name: string): string {
        if (!name) return 'primary';
        const index = name.charCodeAt(0) % this.avatarColors.length;
        return this.avatarColors[index];
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
