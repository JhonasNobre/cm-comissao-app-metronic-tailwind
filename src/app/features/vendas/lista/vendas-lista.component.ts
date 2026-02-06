import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

import { PendenciaService } from '../services/pendencia.service';
import { VendaPendencia } from '../models/pendencia.model';
import { AuthService } from '../../../core/services/auth.service';
import { ColumnHeader } from '../../../shared/models/column-header.model';
import { EmpresaSelectorService } from '../../../core/services/empresa-selector.service';

@Component({
    selector: 'app-vendas-lista',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        TagModule,
        ToastModule
    ],
    providers: [MessageService],
    templateUrl: './vendas-lista.component.html'
})
export class VendasListaComponent implements OnInit {
    private pendenciaService = inject(PendenciaService);
    private empresaSelectorService = inject(EmpresaSelectorService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private messageService = inject(MessageService);

    vendas: (VendaPendencia & { expanded?: boolean })[] = [];
    vendasFiltradas: (VendaPendencia & { expanded?: boolean })[] = [];
    totalRecords = 0;
    loading = false;
    filtroTexto = '';

    columns: ColumnHeader<VendaPendencia>[] = [];

    // Filtros simplificados
    // Futuramente podemos adicionar mais filtros no backend

    ngOnInit() {
        this.initializeColumns();
        this.loadVendas();
    }

    initializeColumns() {
        this.columns = [
            { field: 'codigoVendaLegado', header: 'ID Venda' },
            { field: 'nomeCliente', header: 'Cliente', filter: true },
            { field: 'empreendimento', header: 'Empreendimento' },
            { field: 'unidade', header: 'Unidade' },
            { field: 'dataVenda', header: 'Data', displayAs: 'date', pipeArgs: 'dd/MM/yyyy' },
            {
                field: 'statusGeral',
                header: 'Status',
                displayAs: 'badge',
                badgeSeverityMap: {
                    'Pendente': 'warn',
                    'Liberado': 'success'
                }
            }
        ];
    }


    loadVendas() {
        this.loading = true;
        this.pendenciaService.listarPendencias().subscribe({
            next: (data) => {
                this.vendas = data.map(v => ({ ...v, id: v.codigoVendaLegado, expanded: false }));
                this.totalRecords = data.length;
                this.vendasFiltradas = [...this.vendas];
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar pendências' });
            }
        });
    }

    onFilterChange() {
        if (!this.filtroTexto) {
            this.vendasFiltradas = [...this.vendas];
            return;
        }

        const termo = this.filtroTexto.toLowerCase();
        this.vendasFiltradas = this.vendas.filter(v =>
            v.nomeCliente?.toLowerCase().includes(termo) ||
            v.empreendimento?.toLowerCase().includes(termo) ||
            v.unidade?.toLowerCase().includes(termo) ||
            v.endereco?.toLowerCase().includes(termo) ||
            v.idVendaLegado.includes(termo)
        );
    }

    toggleExpand(venda: any) {
        venda.expanded = !venda.expanded;
    }

    onLazyLoad(event: any) {
        // Como a API retorna tudo por enquanto, não precisamos reenviar request na paginação
    }

    verDetalhes(venda: VendaPendencia) {
        this.router.navigate(['/vendas/pendentes', venda.codigoVendaLegado]);
    }
}
