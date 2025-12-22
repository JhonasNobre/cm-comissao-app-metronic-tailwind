import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import { GenericPTableComponent } from '../../../shared/components/ui/generic-p-table/generic-p-table.component';
import { ComissaoService } from '../services/comissao.service';
import { EmpresaSelectorService } from '../../../core/services/empresa-selector.service';
import { Comissao, ComissaoFiltros, EStatusComissao } from '../models/comissao.model';
import { ColumnHeader } from '../../../shared/models/column-header.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-comissoes-list',
    standalone: true,
    imports: [
        CommonModule,
        GenericPTableComponent,
        ToastModule,
        ConfirmDialogModule,
        TextareaModule,
        FormsModule,
        TooltipModule,
        ButtonModule,
        DialogModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './comissoes-list.component.html',
    styleUrl: './comissoes-list.component.scss'
})
export class ComissoesListComponent implements OnInit {
    private comissaoService = inject(ComissaoService);
    private empresaSelectorService = inject(EmpresaSelectorService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private authService = inject(AuthService);
    private router = inject(Router);

    activeTab: 'pendentes' | 'historico' = 'pendentes';

    // Pendentes
    pendentes: any[] = []; // ComissaoPendente
    totalRecordsPendentes = 0;
    columnsPendentes: ColumnHeader<any>[] = [];
    filtrosPendentes = {
        pagina: 1,
        tamanhoPagina: 10,
        idEmpresa: undefined as string | undefined,
        termoBusca: ''
    };

    // Histórico
    historico: any[] = []; // ComissaoHistorico
    totalRecordsHistorico = 0;
    columnsHistorico: ColumnHeader<any>[] = [];
    filtrosHistorico = {
        pagina: 1,
        tamanhoPagina: 10,
        idEmpresa: undefined as string | undefined,
        dataInicio: undefined as Date | undefined,
        dataFim: undefined as Date | undefined
    };

    loading = false;
    saving = false;

    // Modal Rejeição (mantido apenas por compatibilidade por enquanto, ajustar conforme regra de negócio)
    rejeicaoVisible = false;
    motivoRejeicao = '';
    comissaoEmEdicao: any | null = null;

    ngOnInit() {
        this.initializeColumns();

        this.empresaSelectorService.selectedEmpresaIds$.subscribe(ids => {
            const idEmpresa = ids.length > 0 ? ids[0] : undefined;
            this.filtrosPendentes.idEmpresa = idEmpresa;
            this.filtrosHistorico.idEmpresa = idEmpresa;

            if (idEmpresa) {
                this.loadData();
            } else {
                this.pendentes = [];
                this.historico = [];
            }
        });
    }

    setActiveTab(tab: 'pendentes' | 'historico') {
        this.activeTab = tab;
        // Não chamamos loadData() aqui porque a mudança de aba (via *ngIf) recria o componente p-table,
        // o que dispara automaticamente o evento (lazyLoad), chamando a função de carregar dados.
    }

    loadData() {
        if (this.activeTab === 'pendentes') {
            this.loadPendentes();
        } else {
            this.loadHistorico();
        }
    }

    private initializeColumns(): void {
        // Colunas Pendentes
        this.columnsPendentes = [
            { field: 'numeroParcela', header: 'Nº Parcela', sortable: true },
            { field: 'produto', header: 'Produto', sortable: true },
            { field: 'imovel', header: 'Imóvel', sortable: true },
            { field: 'nome', header: 'Nome', sortable: true },
            { field: 'cargo', header: 'Cargo', sortable: true },
            {
                field: 'valor',
                header: 'Valor',
                formatter: (v) => `R$ ${v?.toFixed(2) || '0.00'}`,
                sortable: true
            },
            {
                field: 'dataPrevista',
                header: 'Data Prevista',
                pipe: 'date',
                pipeArgs: 'dd/MM/yyyy',
                sortable: true
            },
            {
                field: 'status',
                header: 'Status',
                displayAs: 'badge',
                badgeSeverityMap: {
                    'Pendente': 'warning',
                    'Bloqueado': 'danger',
                    'Liberado': 'success',
                    'Pagar': 'info'
                }
            }
        ];

        // Colunas Histórico
        this.columnsHistorico = [
            {
                field: 'periodo',
                header: 'Período',
                pipe: 'date',
                pipeArgs: 'MM/yyyy',
                sortable: true
            },
            {
                field: 'valorFaturado',
                header: 'Valor Faturado',
                formatter: (v) => `R$ ${v?.toFixed(2) || '0.00'}`,
                sortable: true
            },
            { field: 'qtdParcelasFaturadas', header: 'Qtd (Parc)', sortable: true },
            {
                field: 'valorRecebido',
                header: 'Valor Recebido',
                formatter: (v) => `R$ ${v?.toFixed(2) || '0.00'}`,
                sortable: true,
                styleClass: 'text-green-500 font-bold' // Exemplo de estilo customizado se suportado
            },
            { field: 'qtdParcelasRecebidas', header: 'Qtd (Parc)', sortable: true },
            {
                field: 'valorAReceber',
                header: 'Valor a Receber',
                formatter: (v) => `R$ ${v?.toFixed(2) || '0.00'}`,
                sortable: true,
                styleClass: 'text-blue-500 font-bold'
            },
            { field: 'qtdParcelasAReceber', header: 'Qtd (Parc)', sortable: true },
        ];
    }

    loadPendentes() {
        if (!this.filtrosPendentes.idEmpresa) return;

        this.loading = true;
        this.comissaoService.getPendentes(this.filtrosPendentes).subscribe({
            next: (res) => {
                this.pendentes = res.items;
                this.totalRecordsPendentes = res.totalItems;
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
            }
        });
    }

    loadHistorico() {
        if (!this.filtrosHistorico.idEmpresa) return;

        this.loading = true;
        this.comissaoService.getHistorico(this.filtrosHistorico).subscribe({
            next: (res) => {
                this.historico = res.items;
                this.totalRecordsHistorico = res.totalItems;
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
            }
        });
    }

    onLazyLoadPendentes(event: any) {
        // GenericPTable emits { page: number (0-indexed), rows: number, filter: string }
        this.filtrosPendentes.pagina = event.page + 1;
        this.filtrosPendentes.tamanhoPagina = event.rows;
        this.loadPendentes();
    }

    onLazyLoadHistorico(event: any) {
        // GenericPTable emits { page: number (0-indexed), rows: number, filter: string }
        this.filtrosHistorico.pagina = event.page + 1;
        this.filtrosHistorico.tamanhoPagina = event.rows;
        this.loadHistorico();
    }
}
