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
import { MenuModule } from 'primeng/menu';
import { TableModule } from 'primeng/table';

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
        DialogModule,
        MenuModule,
        TableModule
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

    // Batch selection
    selectedParcelas: any[] = [];

    // Action menu
    parcelaEmAcao: any | null = null;
    showActionMenu = false;
    motivoCancelamento = '';
    motivoBloqueio = '';

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
            { field: 'codigoVenda', header: 'Código da Venda', sortable: true },
            {
                field: 'statusPagamento',
                header: 'Status de Pagamento',
                displayAs: 'badge',
                badgeSeverityMap: {
                    'Atrasado': 'danger',
                    'A receber': 'info',
                    'Recebido': 'success'
                },
                sortable: true
            },
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

    // Action methods
    onBloquearParcela(parcela: any) {
        this.confirmationService.confirm({
            message: `Deseja realmente bloquear a parcela ${parcela.numeroParcela}?`,
            header: 'Confirmar Bloqueio',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.saving = true;
                this.comissaoService.bloquearParcela(parcela.id, this.motivoBloqueio).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Parcela bloqueada com sucesso'
                        });
                        this.motivoBloqueio = '';
                        this.loadData();
                        this.saving = false;
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao bloquear parcela'
                        });
                        console.error(err);
                        this.saving = false;
                    }
                });
            }
        });
    }

    onLiberarParcela(parcela: any) {
        this.confirmationService.confirm({
            message: `Deseja liberar a parcela ${parcela.numeroParcela}?`,
            header: 'Confirmar Liberação',
            icon: 'pi pi-check-circle',
            accept: () => {
                this.saving = true;
                this.comissaoService.liberarParcelaManual(parcela.idComissao, parcela.id, 'current-user').subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Parcela liberada com sucesso'
                        });
                        this.loadData();
                        this.saving = false;
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao liberar parcela'
                        });
                        console.error(err);
                        this.saving = false;
                    }
                });
            }
        });
    }

    onCancelarParcela(parcela: any) {
        this.parcelaEmAcao = parcela;
        this.confirmationService.confirm({
            message: 'Digite o motivo do cancelamento:',
            header: 'Cancelar Parcela',
            icon: 'pi pi-times-circle',
            accept: () => {
                if (!this.motivoCancelamento) {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Atenção',
                        detail: 'É necessário informar o motivo do cancelamento'
                    });
                    return;
                }

                this.saving = true;
                this.comissaoService.cancelarParcela(parcela.id, this.motivoCancelamento).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Parcela cancelada com sucesso'
                        });
                        this.motivoCancelamento = '';
                        this.parcelaEmAcao = null;
                        this.loadData();
                        this.saving = false;
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao cancelar parcela'
                        });
                        console.error(err);
                        this.saving = false;
                    }
                });
            },
            reject: () => {
                this.motivoCancelamento = '';
                this.parcelaEmAcao = null;
            }
        });
    }

    onLiberarLote() {
        if (!this.selectedParcelas || this.selectedParcelas.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Atenção',
                detail: 'Selecione pelo menos uma parcela para liberar'
            });
            return;
        }

        this.confirmationService.confirm({
            message: `Deseja liberar ${this.selectedParcelas.length} parcela(s) selecionada(s)?`,
            header: 'Confirmar Liberação em Lote',
            icon: 'pi pi-check-square',
            accept: () => {
                this.saving = true;
                const ids = this.selectedParcelas.map(p => p.id);

                this.comissaoService.liberarParcelasLote(ids).subscribe({
                    next: (result) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: `${result.value} parcela(s) liberada(s) com sucesso`
                        });
                        this.selectedParcelas = [];
                        this.loadData();
                        this.saving = false;
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao liberar parcelas em lote'
                        });
                        console.error(err);
                        this.saving = false;
                    }
                });
            }
        });
    }
}
