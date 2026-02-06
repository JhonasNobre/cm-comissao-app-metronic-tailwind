import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { GenericPTableComponent } from '../../../../shared/components/ui/generic-p-table/generic-p-table.component';
import { OrigemPagamentoService } from '../services/origem-pagamento.service';
import { EmpresaSelectorService } from '../../../../core/services/empresa-selector.service';
import { OrigemPagamento } from '../models/origem-pagamento.model';
import { ColumnHeader } from '../../../../shared/models/column-header.model';
import { OrigemPagamentoFormComponent } from '../origem-pagamento-form/origem-pagamento-form.component';

@Component({
    selector: 'app-origem-pagamento-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        GenericPTableComponent,
        DialogModule,
        ToastModule,
        ConfirmDialogModule,
        OrigemPagamentoFormComponent
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './origem-pagamento-list.component.html'
})
export class OrigemPagamentoListComponent implements OnInit {
    private service = inject(OrigemPagamentoService);
    private empresaService = inject(EmpresaSelectorService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    origens: OrigemPagamento[] = [];
    totalRecords = 0;
    loading = false;

    columns: ColumnHeader<OrigemPagamento>[] = [
        { field: 'nome', header: 'Nome', sortable: true },
        { field: 'descricao', header: 'Descrição', sortable: true },
        {
            field: 'isDefault',
            header: 'Padrão',
            sortable: true,
            displayAs: 'badge',
            badgeSeverityMap: {
                'true': 'success',
                'false': 'secondary'
            },
            formatter: (v) => v ? 'Sim' : 'Não'
        },
        {
            field: 'ativo',
            header: 'Ativo',
            sortable: true,
            displayAs: 'badge',
            badgeSeverityMap: {
                'true': 'success',
                'false': 'danger'
            },
            formatter: (v) => v ? 'Ativo' : 'Inativo'
        }
    ];

    filtros = {
        idEmpresa: '',
        tamanhoPagina: 10
    };

    // Form Dialog
    displayForm = false;
    isEditing = false;
    selectedOrigem: OrigemPagamento | null = null;

    ngOnInit() {
        this.empresaService.selectedEmpresaIds$.subscribe(ids => {
            if (ids.length > 0) {
                this.filtros.idEmpresa = ids[0];
                this.loadData();
            } else {
                this.origens = [];
            }
        });
    }

    loadData() {
        if (!this.filtros.idEmpresa) return;

        this.loading = true;
        this.service.getAll(this.filtros.idEmpresa).subscribe({
            next: (data) => {
                this.origens = data;
                this.totalRecords = data.length;
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar origens.' });
                this.loading = false;
            }
        });
    }

    onAdd() {
        this.isEditing = false;
        this.selectedOrigem = null;
        this.displayForm = true;
    }

    onEdit(origem: OrigemPagamento) {
        this.isEditing = true;
        this.selectedOrigem = { ...origem };
        this.displayForm = true;
    }

    onDelete(origem: OrigemPagamento) {
        this.confirmationService.confirm({
            message: `Tem certeza que deseja desativar "${origem.nome}"?`,
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.service.delete(origem.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Origem desativada.' });
                        this.loadData();
                    },
                    error: (err) => {
                        console.error(err);
                        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao desativar origem.' });
                    }
                });
            }
        });
    }

    onSave(success: boolean) {
        if (success) {
            this.displayForm = false;
            this.loadData();
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Registro salvo com sucesso.' });
        }
    }

    onCancel() {
        this.displayForm = false;
    }

    onFormHide() {
        this.selectedOrigem = null;
        this.isEditing = false;
    }
}
