import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

import { VendaService } from '../../services/venda.service';
import { VendaImportada, VendaImportadaFiltros, EStatusImportacao, ESistemaOrigem } from '../../models/venda-importada.model';
import { EmpresaSelectorService } from '../../../../core/services/empresa-selector.service';
import { GenericPTableComponent } from '../../../../shared/components/ui/generic-p-table/generic-p-table.component';
import { ColumnHeader } from '../../../../shared/models/column-header.model';
import { GerarComissaoModalComponent } from '../gerar-comissao-modal/gerar-comissao-modal.component';

@Component({
    selector: 'app-vendas-list',
    standalone: true,
    imports: [
        CommonModule,
        GenericPTableComponent,
        ToastModule,
        ButtonModule,
        TooltipModule,
        GerarComissaoModalComponent
    ],
    providers: [MessageService],
    templateUrl: './vendas-list.component.html',
    styleUrl: './vendas-list.component.scss'
})
export class VendasListComponent implements OnInit {
    private vendaService = inject(VendaService);
    private empresaSelectorService = inject(EmpresaSelectorService);
    private messageService = inject(MessageService);
    private router = inject(Router);

    // State
    vendas: VendaImportada[] = [];
    loading = false;
    totalRecords = 0;

    // Columns
    columns: ColumnHeader<VendaImportada>[] = [];

    // Filtros
    filtros: VendaImportadaFiltros = {
        busca: '',
        pagina: 1,
        tamanhoPagina: 10,
        idEmpresa: undefined,
        apenasPendentes: true
    };

    // Modal State
    modalVisible = false;
    selectedVenda: VendaImportada | null = null;

    ngOnInit() {
        this.initializeColumns();

        // Observar mudanças na empresa selecionada
        this.empresaSelectorService.currentEmpresa$.subscribe(empresa => {
            if (empresa) {
                this.filtros.idEmpresa = empresa.id;
                this.loadVendas();
            } else {
                this.vendas = [];
                this.totalRecords = 0;
            }
        });
    }

    private initializeColumns(): void {
        this.columns = [
            { field: 'idVendaLegado', header: 'Código', sortable: true, filter: true },
            { field: 'nomeCliente', header: 'Cliente', sortable: true, filter: true },
            {
                field: 'valorTotalVenda',
                header: 'Valor',
                formatter: (v) => `R$ ${v?.toFixed(2) || '0.00'}`,
                sortable: true
            },
            {
                field: 'dataVenda',
                header: 'Data Venda',
                pipe: 'date',
                pipeArgs: 'dd/MM/yyyy',
                sortable: true
            },
            {
                field: 'sistemaOrigem',
                header: 'Origem',
                formatter: (v) => {
                    const labels: Record<number, string> = {
                        [ESistemaOrigem.Manual]: 'Manual',
                        [ESistemaOrigem.Legado]: 'Legado',
                        [ESistemaOrigem.Integracao]: 'Integração'
                    };
                    return labels[v] || 'Desconhecido';
                }
            },
            {
                field: 'statusImportacao',
                header: 'Status',
                displayAs: 'badge',
                badgeSeverityMap: { 'Pendente': 'warning', 'Processada': 'success', 'Falha': 'danger' },
                formatter: (v) => {
                    const labels: Record<number, string> = {
                        [EStatusImportacao.Pendente]: 'Pendente',
                        [EStatusImportacao.Processada]: 'Processada',
                        [EStatusImportacao.FalhaRegra]: 'Falha'
                    };
                    return labels[v] || 'Desconhecido';
                }
            }
        ];
    }

    onLazyLoad(event: { page: number; rows: number; filter: string }) {
        this.filtros.pagina = event.page + 1;
        this.filtros.tamanhoPagina = event.rows;
        this.filtros.busca = event.filter;
        this.loadVendas();
    }

    loadVendas() {
        if (!this.filtros.idEmpresa) return;

        this.loading = true;
        this.vendaService.getAll(this.filtros).subscribe({
            next: (result) => {
                this.vendas = result.items;
                this.totalRecords = result.totalItems;
                this.loading = false;
            },
            error: (_error: unknown) => {
                console.error('Erro ao carregar vendas:', _error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar vendas'
                });
                this.loading = false;
            }
        });
    }

    openGerarComissao(venda: VendaImportada) {
        this.selectedVenda = venda;
        this.modalVisible = true;
    }

    onComissaoGerada() {
        this.loadVendas(); // Recarrega a lista para atualizar status
    }

    onAdd() {
        // Navegar para tela de geração de comissão (futura)
        // this.router.navigate(['/comissoes/gerar']);
    }

    onRowSelect(venda: VendaImportada) {
        this.openGerarComissao(venda);
    }
}
