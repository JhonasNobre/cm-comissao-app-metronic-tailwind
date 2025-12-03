import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CompanyService } from '../../services/company.service';
import { Company } from '../../models/company.model';
import { GenericPTableComponent } from '../../../../shared/components/ui/generic-p-table/generic-p-table.component';
import { ColumnHeader } from '../../../../shared/models/column-header.model';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
    selector: 'app-company-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        GenericPTableComponent,
        ConfirmDialogModule
    ],
    providers: [ConfirmationService],
    templateUrl: './company-list.component.html'
})
export class CompanyListComponent implements OnInit {
    private companyService = inject(CompanyService);
    private router = inject(Router);
    private confirmationService = inject(ConfirmationService);

    companies: Company[] = [];
    loading: boolean = true;
    columns: ColumnHeader<Company>[] = [];

    ngOnInit(): void {
        this.initializeColumns();
        this.loadCompanies();
    }

    private initializeColumns(): void {
        this.columns = [
            { field: 'nome', header: 'Razão Social' },
            { field: 'cnpj', header: 'CNPJ' }
        ];
    }

    private loadCompanies(): void {
        this.companyService.list().subscribe((data) => {
            this.companies = data;
            this.loading = false;
        });
    }

    onAdd(): void {
        this.router.navigate(['/companies/new']);
    }

    onEdit(company: Company): void {
        this.router.navigate(['/companies', company.id]);
    }

    onDelete(company: Company): void {
        this.confirmationService.confirm({
            message: `Deseja realmente excluir a empresa "${company.name}"?`,
            header: 'Confirmar Exclusão',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sim, excluir',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.companyService.delete(company.id).subscribe({
                    next: () => {
                        this.companies = this.companies.filter(c => c.id !== company.id);
                    },
                    error: (err) => console.error('Error deleting company', err)
                });
            }
        });
    }
}
