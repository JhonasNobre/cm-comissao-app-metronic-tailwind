import { Component, OnInit, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { Observable } from 'rxjs';
import { CompanyService } from '../../services/company.service';
import { Company, CompanyStatus } from '../../models/company.model';

@Component({
    selector: 'app-company-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        RippleModule,
        TooltipModule
    ],
    templateUrl: './company-list.component.html',
    encapsulation: ViewEncapsulation.None,
    styles: [`
        /* Table Styles */
        :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
            background-color: #F9F9F9;
            color: #3F4254;
            font-weight: 600;
            padding: 1rem !important;
            border-bottom: 1px solid #EFF2F5;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.025em;
        }

        :host ::ng-deep .p-datatable .p-datatable-tbody > tr > td {
            padding: 1rem !important;
            border-bottom: 1px solid #EFF2F5;
            color: #7E8299;
            font-size: 0.9rem;
            font-weight: 500;
            vertical-align: middle;
        }

        :host ::ng-deep .p-datatable .p-datatable-tbody > tr:last-child > td {
            border-bottom: none;
        }

        :host ::ng-deep .p-datatable .p-datatable-tbody > tr:hover {
            background-color: #F5F8FA;
        }

        /* Badge Styles */
        :host ::ng-deep .badge {
            padding: 0.35em 0.65em;
            border-radius: 0.375rem;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        :host ::ng-deep .badge-light-success { background-color: #E8FFF3; color: #50CD89; }
        :host ::ng-deep .badge-light-danger { background-color: #FFE2E5; color: #F1416C; }
        :host ::ng-deep .badge-light-warning { background-color: #FFF4DE; color: #FFA800; }
        :host ::ng-deep .badge-light-info { background-color: #F1FAFF; color: #009EF7; }
        :host ::ng-deep .badge-light-secondary { background-color: #EFF2F5; color: #181C32; }

        /* Paginator Styles */
        :host ::ng-deep .p-paginator {
            background: transparent;
            border: none;
            border-top: 1px solid #EFF2F5;
            padding: 1.5rem 0;
            justify-content: flex-end;
        }
        :host ::ng-deep .p-paginator-page,
        :host ::ng-deep .p-paginator-first,
        :host ::ng-deep .p-paginator-prev,
        :host ::ng-deep .p-paginator-next,
        :host ::ng-deep .p-paginator-last {
            min-width: 2.5rem;
            height: 2.5rem;
            border-radius: 0.475rem;
            margin: 0 0.15rem;
            color: #7E8299;
            border: 1px solid transparent;
            font-weight: 500;
        }
        :host ::ng-deep .p-paginator-page:hover,
        :host ::ng-deep .p-paginator-first:hover,
        :host ::ng-deep .p-paginator-prev:hover,
        :host ::ng-deep .p-paginator-next:hover,
        :host ::ng-deep .p-paginator-last:hover {
            background-color: #F1F1F4;
            color: #181C32;
        }
        :host ::ng-deep .p-paginator-page.p-highlight {
            background-color: #009EF7;
            color: #ffffff;
            box-shadow: 0 4px 12px rgba(0, 158, 247, 0.35);
        }
        :host ::ng-deep .p-paginator .p-dropdown {
            height: 2.5rem;
            align-items: center;
            border-color: #EFF2F5;
        }
    `]
})
export class CompanyListComponent implements OnInit {
    private companyService = inject(CompanyService);

    companies$: Observable<Company[]> = this.companyService.getCompanies();

    ngOnInit(): void {
        console.log('CompanyListComponent initialized');
    }

    onAdd(): void {
        console.log('Add company clicked');
    }

    onEdit(company: Company): void {
        console.log('Edit company:', company);
    }

    onDelete(company: Company): void {
        console.log('Delete company:', company);
    }

    getStatusBadgeClass(status: CompanyStatus): string {
        switch (status) {
            case CompanyStatus.ACTIVE: return 'badge-light-success';
            case CompanyStatus.INACTIVE: return 'badge-light-danger';
            case CompanyStatus.PENDING: return 'badge-light-warning';
            case CompanyStatus.BLOCKED: return 'badge-light-secondary';
            default: return 'badge-light-info';
        }
    }
}
