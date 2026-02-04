import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ProdutoService } from '../services/produto.service';
import { ProdutoImportado, ProdutoFiltros } from '../models/produto.model';
import { GenericPTableComponent } from '../../../shared/components/ui/generic-p-table/generic-p-table.component';
import { ColumnHeader } from '../../../shared/models/column-header.model';

@Component({
    selector: 'app-produtos-importados-lista',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        ToastModule,
        GenericPTableComponent
    ],
    providers: [MessageService],
    templateUrl: './produtos-importados-lista.component.html'
})
export class ProdutosImportadosListaComponent implements OnInit {
    private produtoService = inject(ProdutoService);
    private messageService = inject(MessageService);

    produtos: ProdutoImportado[] = [];
    totalRecords = 0;
    loading = false;

    columns: ColumnHeader<ProdutoImportado>[] = [];

    filtros: ProdutoFiltros = {
        pagina: 1,
        tamanhoPagina: 10,
        busca: ''
    };

    ngOnInit() {
        this.initializeColumns();
    }

    initializeColumns() {
        this.columns = [
            { field: 'codigoLegado', header: 'Código Legado' },
            { field: 'nome', header: 'Produto', filter: true },
            { field: 'nomeCidade', header: 'Cidade' },
            { field: 'uf', header: 'UF' },
            {
                field: 'status',
                header: 'Status',
                displayAs: 'badge',
                badgeSeverityMap: {
                    '0': 'success', // Disponivel
                    '1': 'warn',    // Reservado
                    '2': 'danger'   // Vendido
                }
            }
        ];
    }

    onLazyLoad(event: any) {
        this.filtros.pagina = event.page + 1;
        this.filtros.tamanhoPagina = event.rows;
        if (event.filter !== undefined) {
            this.filtros.busca = event.filter;
        }
        this.loadProdutos();
    }

    loadProdutos() {
        this.loading = true;
        this.produtoService.getAll(this.filtros).subscribe({
            next: (data) => {
                this.produtos = data.items;
                this.totalRecords = data.totalItems;
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar produtos' });
            }
        });
    }
}
