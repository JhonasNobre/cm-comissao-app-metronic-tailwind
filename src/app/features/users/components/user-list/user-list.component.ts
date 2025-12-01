import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { UserListDTO, UserRole, UserStatus } from '../../models/user.model';
import { Observable } from 'rxjs';
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        TableModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        ButtonModule
    ],
    templateUrl: './user-list.component.html',
})
export class UserListComponent implements OnInit {
    private userService = inject(UserService);

    users$: Observable<UserListDTO[]> = this.userService.getUsers();

    ngOnInit(): void {
        // Initial load handled by async pipe
    }

    getRoleBadgeClass(role: UserRole): string {
        switch (role) {
            case UserRole.ADMIN: return 'kt-badge-primary kt-badge-outline';
            case UserRole.GESTOR: return 'kt-badge-success kt-badge-outline';
            case UserRole.VENDEDOR: return 'kt-badge-info kt-badge-outline';
            default: return 'kt-badge-secondary kt-badge-outline';
        }
    }

    getStatusBadgeClass(status: UserStatus): string {
        switch (status) {
            case UserStatus.ACTIVE: return 'kt-badge-success';
            case UserStatus.INACTIVE: return 'kt-badge-danger';
            case UserStatus.PENDING: return 'kt-badge-warning';
            case UserStatus.LOCKED: return 'kt-badge-dark';
            default: return 'kt-badge-secondary';
        }
    }
}
