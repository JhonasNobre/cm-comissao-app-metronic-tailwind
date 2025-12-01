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
        /* PrimeNG Table Border Customization */
        /* Apply light borders directly to table cells */
        .p-datatable .p-datatable-tbody > tr > td {
            border-bottom: 1px solid #EFF2F5 !important;
        }
        
        .kt-table tbody td {
            border-bottom: 1px solid #EFF2F5 !important;
        }
        
        /* Remove border from last row */
        .p-datatable .p-datatable-tbody > tr:last-child > td,
        .kt-table tbody tr:last-child td {
            border-bottom: none !important;
        }
        
        /* Table Header Styles */
        .kt-table thead tr {
            border-bottom-style: var(--tw-border-style);
            border-bottom-width: 1px;
        }
        
        .kt-table thead th {
            height: calc(var(--spacing) * 10);
            background-color: color-mix(in oklab, var(--muted) 40%, transparent);
            padding-inline: calc(var(--spacing) * 4);
            text-align: left;
            vertical-align: middle;
            font-weight: var(--font-weight-normal);
            color: var(--secondary-foreground) !important;
            border-bottom: 1px solid #EFF2F5 !important;
            border-right: 1px solid #EFF2F5 !important;
        }
        
        /* Remove vertical border from last header cell */
        .kt-table thead th:last-child {
            border-right: none !important;
        }
        
        /* Table Body Cell Padding */
        .kt-table tbody td {
            padding-inline: calc(var(--spacing) * 2);
            padding-block: calc(var(--spacing) * 1);
            vertical-align: middle;
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

        /* Custom Badge Styles */
        .custom-badge {
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.5rem;
            border-radius: 0.375rem;
            font-size: 0.75rem;
            font-weight: 500;
            line-height: 1;
        }
        .custom-badge-dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            margin-right: 0.4rem;
            display: inline-block;
        }
        
        /* Badge Colors */
        .badge-light-success { background-color: #E8FFF3; color: #50CD89; }
        .badge-light-danger { background-color: #FFE2E5; color: #F1416C; }
        .badge-light-warning { background-color: #FFF4DE; color: #FFA800; }
        .badge-light-primary { background-color: #F1FAFF; color: #009EF7; }
        .badge-light-dark { background-color: #EFF2F5; color: #181C32; }

        .dot-success { background-color: #50CD89; }
        .dot-danger { background-color: #F1416C; }
        .dot-warning { background-color: #FFA800; }
        .dot-primary { background-color: #009EF7; }
        .dot-dark { background-color: #181C32; }
        
        /* Remove padding do card-content para eliminar espaço */
        .kt-card-content {
            padding-bottom: 0 !important;
        }
        
        /* Remove espaço do wrapper da tabela PrimeNG */
        .p-datatable-wrapper {
            margin-bottom: 0 !important;
        }
        
        /* PrimeNG Native Paginator Styles - ALTA ESPECIFICIDADE */
        app-user-list .p-datatable .p-paginator,
        .p-datatable .p-paginator,
        .p-paginator {
            background: transparent !important;
            border: none !important;
            border-top: 2px solid #EFF2F5 !important;
            padding: 1rem 1rem 0.75rem 1rem !important;
            margin: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 1rem !important;
            flex-wrap: wrap !important;
        }
        
        /* Current Page Report (Showing X to Y of Z) */
        .p-datatable .p-paginator .p-paginator-current,
        .p-paginator .p-paginator-current {
            color: var(--secondary-foreground) !important;
            font-size: 0.875rem !important;
            margin-right: auto !important;
            order: -1 !important;
        }
        
        /* Rows Per Page Dropdown */
        .p-datatable .p-paginator .p-dropdown,
        .p-paginator .p-dropdown {
            border: 1px solid #EFF2F5 !important;
            border-radius: 0.475rem !important;
            height: 2.5rem !important;
            min-width: 5rem !important;
            background: #ffffff !important;
        }
        
        .p-datatable .p-paginator .p-dropdown:hover,
        .p-paginator .p-dropdown:hover {
            border-color: #D5D8DE !important;
        }
        
        .p-datatable .p-paginator .p-dropdown-label,
        .p-paginator .p-dropdown-label {
            padding: 0.625rem 1rem !important;
            font-size: 0.875rem !important;
            color: var(--foreground) !important;
        }
        
        /* Dropdown Panel (Fix para as opções aparecerem) */
        .p-dropdown-panel {
            background: #ffffff !important;
            border: 1px solid #EFF2F5 !important;
            border-radius: 0.475rem !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
            z-index: 9999 !important;
            margin-top: 0.25rem !important;
            min-width: 5rem !important;
        }
        
        .p-dropdown-panel .p-dropdown-items {
            padding: 0.5rem 0 !important;
            max-height: 15rem !important;
        }
        
        .p-dropdown-panel .p-dropdown-item {
            padding: 0.625rem 1rem !important;
            font-size: 0.875rem !important;
            color: var(--foreground) !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
            min-height: 2.5rem !important;
            display: flex !important;
            align-items: center !important;
        }
        
        .p-dropdown-panel .p-dropdown-item:hover {
            background-color: #F1F1F4 !important;
        }
        
        .p-dropdown-panel .p-dropdown-item.p-highlight {
            background-color: #E8F4FF !important;
            color: #1B84FF !important;
            font-weight: 500 !important;
        }
        
        /* Page Number Buttons */
        .p-datatable .p-paginator .p-paginator-page,
        .p-paginator .p-paginator-page {
            min-width: 2.75rem !important;
            height: 2.75rem !important;
            border-radius: 0.475rem !important;
            font-weight: 500 !important;
            font-size: 0.875rem !important;
            color: #78829D !important;
            margin: 0 0.125rem !important;
            transition: all 0.2s ease !important;
            border: 1px solid transparent !important;
            background: transparent !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }
        
        .p-datatable .p-paginator .p-paginator-page:hover,
        .p-paginator .p-paginator-page:hover {
            background-color: #F1F1F4 !important;
            color: #181C32 !important;
        }
        
        /* Página Selecionada - SUPER DESTACADA */
        .p-datatable .p-paginator .p-paginator-page.p-highlight,
        .p-paginator .p-paginator-page.p-highlight {
            background-color: #1B84FF !important;
            color: #ffffff !important;
            border-color: #1B84FF !important;
            font-weight: 700 !important;
            box-shadow: 0 4px 12px rgba(27, 132, 255, 0.5) !important;
            transform: scale(1.2) !important;
            z-index: 1 !important;
            position: relative !important;
        }
        
        /* Navigation Buttons (First, Prev, Next, Last) */
        .p-datatable .p-paginator .p-paginator-first,
        .p-datatable .p-paginator .p-paginator-prev,
        .p-datatable .p-paginator .p-paginator-next,
        .p-datatable .p-paginator .p-paginator-last,
        .p-paginator .p-paginator-first,
        .p-paginator .p-paginator-prev,
        .p-paginator .p-paginator-next,
        .p-paginator .p-paginator-last {
            min-width: 2.75rem !important;
            height: 2.75rem !important;
            border-radius: 0.475rem !important;
            color: #78829D !important;
            margin: 0 0.125rem !important;
            transition: all 0.2s ease !important;
            border: 1px solid #EFF2F5 !important;
            background: transparent !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }
        
        .p-datatable .p-paginator .p-paginator-first:hover:not(.p-disabled),
        .p-datatable .p-paginator .p-paginator-prev:hover:not(.p-disabled),
        .p-datatable .p-paginator .p-paginator-next:hover:not(.p-disabled),
        .p-datatable .p-paginator .p-paginator-last:hover:not(.p-disabled),
        .p-paginator .p-paginator-first:hover:not(.p-disabled),
        .p-paginator .p-paginator-prev:hover:not(.p-disabled),
        .p-paginator .p-paginator-next:hover:not(.p-disabled),
        .p-paginator .p-paginator-last:hover:not(.p-disabled) {
            background-color: #F1F1F4 !important;
            color: #181C32 !important;
            border-color: #D5D8DE !important;
        }
        
        /* Disabled State */
        .p-datatable .p-paginator .p-disabled,
        .p-paginator .p-disabled {
            opacity: 0.4 !important;
            cursor: not-allowed !important;
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
