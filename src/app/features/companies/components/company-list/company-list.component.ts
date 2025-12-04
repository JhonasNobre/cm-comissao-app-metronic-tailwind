import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CompanyService } from '../../services/company.service';
import { Company } from '../../models/company.model';
import { GenericPTableComponent } from '../../../../shared/components/ui/generic-p-table/generic-p-table.component';
import { ColumnHeader } from '../../../../shared/models/column-header.model';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { BaseListComponent } from '../../../../shared/components/base/base-list/base-list.component';
import { CompanyFormService } from '../../services/company-form.service';
import { FormItemBase } from '../../../../shared/components/ui/dynamic-form/models/form-item-base';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-company-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        GenericPTableComponent,
        ConfirmDialogModule
    ],
    templateUrl: './company-list.component.html'
})
export class CompanyListComponent extends BaseListComponent<Company> implements OnInit {
    private companyService = inject(CompanyService);
    private companyFormService = inject(CompanyFormService);

    protected storageKey = 'company-list-search';
    columns: ColumnHeader<Company>[] = [];

    override ngOnInit(): void {
        super.ngOnInit();
        this.initializeColumns();
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

    protected loadData(params: any): Observable<Company[]> {
        return this.companyService.list(params);
    }

    protected override getFormItems(object?: Company): FormItemBase[] {
        return this.companyFormService.getFormFields(object);
    }

    protected override getObjectName(object?: Company): string | undefined {
        return object?.name || 'Empresa';
    }

    protected override onAdd(object: Company): Observable<any> {
        return this.companyService.create(object);
    }

    protected override onEdit(object: Company, id: string | number): Observable<any> {
        return this.companyService.update(object, id.toString());
    }

    protected override onDelete(id: string | number): Observable<void> {
        return this.companyService.delete(id.toString());
    }

    // Métodos chamados pelo template
    onAddClick(): void {
        this.openDialog();
    }

    onEditClick(company: Company): void {
        this.openDialog(company);
    }

    onDeleteClick(company: Company): void {
        this.onRemover(company);
    }
}
