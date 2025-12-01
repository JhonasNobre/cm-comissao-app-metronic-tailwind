import { Component, OnInit, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { UserListDTO, UserRole, UserStatus } from '../../models/user.model';
import { Observable } from 'rxjs';
import { TableModule } from 'primeng/table';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        TableModule
    ],
    templateUrl: './user-list.component.html',
    encapsulation: ViewEncapsulation.None,
    styles: [`        
        /* Table Header Background */
        .kt-table thead {
            background-color: #F9FAFB;
        }
        
        /* Table Body Cell Padding */
        .kt-table tbody td {
            border-right: 1px solid #EFF2F5 !important;
        }
        
        /* Remove vertical border from last body cell */
        .kt-table tbody td:last-child {
            border-right: none !important;
        }
        
        /* Force padding on first column */
        .kt-table th:first-child,
        .kt-table td:first-child {
            padding-left: 1.25rem !important;
        }
       
        /* Current Page Report (Showing X to Y of Z) */
        .p-datatable .p-paginator .p-paginator-current,
        .p-paginator .p-paginator-current {
            font-size: 0.875rem !important;
            margin-right: auto !important;
            order: -1 !important;
        }      
        
    `]
})
export class UserListComponent implements OnInit {
    private userService = inject(UserService);

    users$: Observable<UserListDTO[]> = this.userService.getUsers();

    ngOnInit(): void {
        // Initial load handled by async pipe
        console.log('UserListComponent initialized - PrimeNG Native Pagination');
    }

    getStatusBadgeClass(status: UserStatus): string {
        switch (status) {
            case UserStatus.ACTIVE: return 'badge-light-success';
            case UserStatus.INACTIVE: return 'badge-light-danger';
            case UserStatus.PENDING: return 'badge-light-warning';
            case UserStatus.LOCKED: return 'badge-light-dark';
            default: return 'badge-light-primary';
        }
    }

    getStatusDotClass(status: UserStatus): string {
        switch (status) {
            case UserStatus.ACTIVE: return 'dot-success';
            case UserStatus.INACTIVE: return 'dot-danger';
            case UserStatus.PENDING: return 'dot-warning';
            case UserStatus.LOCKED: return 'dot-dark';
            default: return 'dot-primary';
        }
    }
}
