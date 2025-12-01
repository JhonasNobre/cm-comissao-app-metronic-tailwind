import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CompanyService } from '../../services/company.service';
import { Company } from '../../models/company.model';
import { GenericPTableComponent } from '../../../../shared/components/ui/generic-p-table/generic-p-table.component';
import { ColumnHeader } from '../../../../shared/models/column-header.model';

@Component({
    selector: 'app-company-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        GenericPTableComponent
    ],
    templateUrl: './company-list.component.html'
})
export class CompanyListComponent implements OnInit {
    private companyService = inject(CompanyService);

    companies: Company[] = [];
    loading: boolean = true;
    columns: ColumnHeader<Company>[] = [];

    ngOnInit(): void {
        this.initializeColumns();
        this.loadCompanies();
    }

    private initializeColumns(): void {
        this.columns = [
            { field: 'name', header: 'Razão Social' },
            { field: 'tradeName', header: 'Nome Fantasia' },
            { field: 'cnpj', header: 'CNPJ' },
            {
                field: 'status',
                header: 'Status',
                displayAs: 'badge',
                badgeSeverityMap: {
                    'ACTIVE': 'success',
                    'INACTIVE': 'danger',
                    'PENDING': 'warn',
                    'BLOCKED': 'secondary'
                }
            }
        ];
    }

    private loadCompanies(): void {
        this.companyService.getCompanies().subscribe((data) => {
            this.companies = data;
            this.loading = false;
        });
    }

    onEdit(company: Company): void {
        console.log('Edit company:', company);
    }

    onDelete(company: Company): void {
        console.log('Delete company:', company);
    }
}
