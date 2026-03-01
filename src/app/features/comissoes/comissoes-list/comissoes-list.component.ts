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
import { BadgeModule } from 'primeng/badge';
import { SelectModule } from 'primeng/select';

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
        TableModule,
        BadgeModule,
        SelectModule
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
        termoBusca: '',
        statusComissao: undefined as number | undefined
    };

    // Opções do filtro de status
    statusComissaoOptions = [
        { label: 'Pendente', value: undefined },
        { label: 'Aprovada', value: 2 },
        { label: 'Rejeitada', value: 3 },
        { label: 'Paga', value: 4 },
        { label: 'Todas', value: -1 }
    ];

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

    menuItems: any[] = [];

    ngOnInit() {
        this.initializeColumns();
        this.initializeMenuItems();

        this.empresaSelectorService.selectedEmpresaIds$.subscribe(ids => {
            const idEmpresa = ids.length > 0 ? ids[0] : undefined;
            this.filtrosPendentes.idEmpresa = idEmpresa;
            this.filtrosHistorico.idEmpresa = idEmpresa;

            // Limpamos os dados imediatamente ao trocar de empresa
            this.pendentes = [];
            this.historico = [];

            // Não chamamos loadData() aqui. 
            // Como a empresa é um filtro essencial, o componente p-table (via lazyLoad)
            // ou o estado inicial dos filtros já deve disparar a primeira carga.
            // Se o idEmpresa for undefined, as funções loadX já possuem guardas.
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

    onStatusComissaoChange() {
        this.filtrosPendentes.pagina = 1;
        this.loadPendentes();
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
                }
            },
            { field: 'produto', header: 'Produto', sortable: true },
            { field: 'imovel', header: 'Imóvel', sortable: true },
            { field: 'nome', header: 'Nome', sortable: true },
            { field: 'cargo', header: 'Cargo', sortable: true },
            {
                field: 'valor',
                header: 'Valor',
                formatter: (v) => `R$ ${v?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}`,
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
                header: 'Status da Parcela',
                displayAs: 'badge',
                badgeSeverityMap: {
                    'Pendente': 'warning',
                    'Atrasado': 'danger',
                    'Bloqueada': 'danger',
                    'Bloqueado': 'danger',
                    'Liberada': 'primary',
                    'Liberado': 'primary',
                    'Paga': 'success'
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

    private initializeMenuItems(): void {
        this.menuItems = [
            {
                label: 'Bloquear Comissão',
                icon: 'pi pi-lock',
                command: () => this.onBloquearParcela(this.parcelaEmAcao)
            },
            {
                label: 'Liberar Comissão',
                icon: 'pi pi-unlock',
                command: () => this.onLiberarParcela(this.parcelaEmAcao)
            },
            {
                label: 'Cancelar Comissão',
                icon: 'pi pi-times',
                command: () => this.onCancelarParcela(this.parcelaEmAcao),
                styleClass: 'text-red-500'
            }
        ];
    }

    loadPendentes() {
        if (!this.filtrosPendentes.idEmpresa) {
            console.warn('LoadPendentes abortado: idEmpresa indefinido. Aguardando seleção...');
            this.messageService.add({
                severity: 'warn',
                summary: 'Atenção',
                detail: 'Nenhuma empresa selecionada para carregar comissões.'
            });
            return;
        }

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
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao buscar comissões' });
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

    onDetail(event: any) {
        if (event.idComissao) {
            this.router.navigate(['/comissoes/detalhes', event.idComissao]);
        } else if (event.periodo) {
            // Histórico: Navegar para lista de parcelas filtrada pelo mês
            const dataInicio = new Date(event.periodo);
            const ano = dataInicio.getFullYear();
            const mes = dataInicio.getMonth();
            const dataFim = new Date(ano, mes + 1, 0); // Último dia do mês

            this.router.navigate(['/comissoes/parcelas'], {
                queryParams: {
                    dataInicio: dataInicio.toISOString(),
                    dataFim: dataFim.toISOString()
                }
            });
        } else if (event.id) {
            // Fallback se idComissao não existir (ex: Historico pode ser a comissão em si)
            this.router.navigate(['/comissoes/detalhes', event.id]);
        }
    }

    // Action methods
    // Action methods
    onBloquearParcela(parcela: any) {
        this.confirmationService.confirm({
            message: `Deseja realmente bloquear a parcela ${parcela.numeroParcela}?`,
            header: 'Confirmar Bloqueio',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.saving = true;
                this.comissaoService.bloquearParcela(parcela.id, parcela.idComissao, this.motivoBloqueio).subscribe({
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
                    error: (err: any) => {
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
            message: `Deseja liberar a parcela ${parcela.numeroParcela} e enviar à Imobtech?`,
            header: 'Confirmar Liberação',
            icon: 'pi pi-check-circle',
            accept: () => {
                this.saving = true;
                this.comissaoService.liberarComissaoImobtech(parcela.idComissao, {
                    clienteQuitouAntecipado: false
                }).subscribe({
                    next: (res) => {
                        const severity = res.status === 'ENVIADO_IMOBTECH' ? 'success' : (res.status === 'ERRO_ENVIO' ? 'warn' : 'info');
                        this.messageService.add({
                            severity,
                            summary: res.status === 'ENVIADO_IMOBTECH' ? 'Sucesso' : 'Atenção',
                            detail: res.mensagem,
                            life: 6000
                        });
                        this.loadData();
                        this.saving = false;
                    },
                    error: (err: any) => {
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
            message: 'Isso cancelará TODA a comissão desta parcela. Digite o motivo:',
            header: 'Cancelar Comissão',
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
                this.comissaoService.cancelarComissao(parcela.idComissao, this.motivoCancelamento, 'current-user').subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Comissão cancelada com sucesso'
                        });
                        this.motivoCancelamento = '';
                        this.parcelaEmAcao = null;
                        this.loadData();
                        this.saving = false;
                    },
                    error: (err: any) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao cancelar comissão'
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
            message: `Deseja liberar ${this.selectedParcelas.length} parcela(s) selecionada(s) e enviar à Imobtech?`,
            header: 'Confirmar Liberação em Lote',
            icon: 'pi pi-check-square',
            accept: () => {
                this.saving = true;
                const comissaoIds = [...new Set(this.selectedParcelas.map(p => p.idComissao))];
                let completed = 0;
                let errors = 0;

                comissaoIds.forEach(idComissao => {
                    this.comissaoService.liberarComissaoImobtech(idComissao, {
                        clienteQuitouAntecipado: false
                    }).subscribe({
                        next: (res: any) => {
                            completed++;
                            const severity = res.status === 'ENVIADO_IMOBTECH' ? 'success' : (res.status === 'ERRO_ENVIO' ? 'warn' : 'info');
                            this.messageService.add({
                                severity,
                                summary: res.status === 'ENVIADO_IMOBTECH' ? 'Sucesso' : 'Atenção',
                                detail: res.mensagem,
                                life: 6000
                            });
                            if (completed + errors === comissaoIds.length) {
                                this.selectedParcelas = [];
                                this.loadData();
                                this.saving = false;
                            }
                        },
                        error: (err: any) => {
                            errors++;
                            console.error(err);
                            if (completed + errors === comissaoIds.length) {
                                this.selectedParcelas = [];
                                this.loadData();
                                this.saving = false;
                            }
                        }
                    });
                });
            }
        });
    }

    onExportarRelatorio() {
        // Usa os filtros da aba ativa (Histórico ou Pendentes)
        // Como o endpoint é unificado, podemos apenas passar os filtros atuais + idEmpresa
        const filtros = this.activeTab === 'historico' ? this.filtrosHistorico : this.filtrosPendentes;

        if (!filtros.idEmpresa) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Atenção',
                detail: 'Selecione uma empresa para exportar.'
            });
            return;
        }

        this.loading = true;
        this.comissaoService.exportar(filtros as any).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `relatorio_comissoes_${new Date().getTime()}.csv`;
                link.click();
                window.URL.revokeObjectURL(url);
                this.loading = false;
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Relatório exportado com sucesso' });
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao exportar relatório' });
            }
        });
    }
}
