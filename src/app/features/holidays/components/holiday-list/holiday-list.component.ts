import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HolidayService } from '../../services/holiday.service';
import { Holiday, HolidayType } from '../../models/holiday.model';
import { GenericPTableComponent } from '../../../../shared/components/ui/generic-p-table/generic-p-table.component';
import { ColumnHeader } from '../../../../shared/models/column-header.model';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { BaseListComponent } from '../../../../shared/components/base/base-list/base-list.component';
import { HolidayFormService } from '../../services/holiday-form.service';
import { FormItemBase } from '../../../../shared/components/ui/dynamic-form/models/form-item-base';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { HolidayFormDialogComponent } from '../holiday-form/holiday-form-dialog.component';

@Component({
    selector: 'app-holiday-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        GenericPTableComponent,
        ConfirmDialogModule
    ],
    templateUrl: './holiday-list.component.html'
})
export class HolidayListComponent extends BaseListComponent<Holiday> implements OnInit {
    private holidayService = inject(HolidayService);
    private holidayFormService = inject(HolidayFormService);

    protected storageKey = 'holiday-list-search';
    columns: ColumnHeader<Holiday>[] = [];

    // Filtros
    selectedYear: number | null = new Date().getFullYear();
    selectedType: string | null = null;
    selectedState: string | null = null;

    years: number[] = [];
    types = [
        { label: 'Todos', value: null },
        { label: 'Nacional', value: 'Nacional' },
        { label: 'Estadual', value: 'Estadual' },
        { label: 'Municipal', value: 'Municipal' }
    ];

    override ngOnInit(): void {
        super.ngOnInit();
        this.initializeColumns();
        this.initializeYears();
    }

    private initializeColumns(): void {
        this.columns = [
            { field: 'name', header: 'Nome' },
            {
                field: 'date',
                header: 'Data',
                formatter: (value: Date) => this.formatDate(value)
            },
            { field: 'type', header: 'Tipo' },
            { field: 'stateCode', header: 'UF' },
            { field: 'city', header: 'Município' }
        ];
    }

    private initializeYears(): void {
        const currentYear = new Date().getFullYear();
        for (let i = currentYear - 2; i <= currentYear + 2; i++) {
            this.years.push(i);
        }
    }

    private formatDate(date: Date): string {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        return date.toLocaleDateString('pt-BR');
    }

    protected loadData(params: any): Observable<Holiday[]> {
        const filterParams = {
            ...params,
            ano: this.selectedYear,
            tipo: this.selectedType,
            estadoUf: this.selectedState
        };
        return this.holidayService.list(filterParams);
    }

    protected override getFormItems(object?: Holiday): FormItemBase[] {
        return this.holidayFormService.getFormFields(object);
    }

    protected override getObjectName(object?: Holiday): string | undefined {
        return object?.name || 'Feriado';
    }

    protected override onAdd(object: Holiday): Observable<any> {
        // Converter date string para Date se necessário
        if (typeof object.date === 'string') {
            object.date = new Date(object.date);
        }
        return this.holidayService.create(object);
    }

    protected override onEdit(object: Holiday, id: string | number): Observable<any> {
        // Converter date string para Date se necessário
        if (typeof object.date === 'string') {
            object.date = new Date(object.date);
        }
        return this.holidayService.update(object, id.toString());
    }

    protected override onDelete(id: string | number): Observable<void> {
        return this.holidayService.delete(id.toString());
    }

    // Métodos chamados pelo template
    onAddClick(): void {
        this.openDialog();
    }

    onEditClick(holiday: Holiday): void {
        this.openDialog(holiday);
    }

    onDeleteClick(holiday: Holiday): void {
        this.onRemover(holiday);
    }

    onFilterChange(): void {
        this.loadData({});
        // Recarregar os dados chamando o método de carregamento
        this.load();
    }

    override openDialog(object?: Holiday): void {
        const ref = this.dialogService.open(HolidayFormDialogComponent, {
            data: {
                holiday: object
            },
            header: object?.id ? 'Editar Feriado' : 'Novo Feriado',
            width: '500px',
            contentStyle: { overflow: 'auto' },
            baseZIndex: 10000,
            maximizable: false,
            modal: true
        });

        if (ref) {
            ref.onClose.subscribe((result: { form: Holiday }) => {
                if (result && result.form) {
                    this.handleSave(result.form, object?.id);
                }
            });
        }
    }
}
