import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DialogService } from 'primeng/dynamicdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';

import { EstruturaComissaoService } from '../../services/estrutura-comissao.service';
import { EstruturaComissao, EstruturaComissaoFiltros } from '../../models/estrutura-comissao.model';
import { TipoComissaoLabels, TipoComissao, RegraLiberacao, TipoRateio } from '../../models/enums';
import { EmpresaSelectorService } from '../../../../core/services/empresa-selector.service';
import { GenericPTableComponent } from '../../../../shared/components/ui/generic-p-table/generic-p-table.component';
import { ColumnHeader } from '../../../../shared/models/column-header.model';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

interface SelectOption {
    label: string;
    value: any;
}

@Component({
    selector: 'app-estruturas-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        GenericPTableComponent,
        ToastModule,
        ConfirmDialogModule,
        SelectModule,
        TooltipModule
    ],
    providers: [ConfirmationService, MessageService, DialogService],
    templateUrl: './estruturas-list.component.html',
    styleUrl: './estruturas-list.component.scss'
})
export class EstruturasListComponent implements OnInit {
    private estruturaService = inject(EstruturaComissaoService);
    private confirmationService = inject(ConfirmationService);
    private messageService = inject(MessageService);
    private empresaSelectorService = inject(EmpresaSelectorService);
    private router = inject(Router);

    // State
    estruturas: EstruturaComissao[] = [];
    loading = false;
    totalRecords = 0;

    // Columns
    columns: ColumnHeader<EstruturaComissao>[] = [];

    // Filtros expandidos
    filtros: EstruturaComissaoFiltros & {
        idProduto?: string;
        idEscala?: string;
        idCidade?: string;
        idCargo?: string;
        idUsuario?: string;
        tipoLiberacao?: number;
    } = {
            busca: '',
            ativo: undefined,
            pagina: 1,
            tamanhoPagina: 10,
            idEmpresa: undefined
        };

    // Filter options
    produtoOptions: SelectOption[] = [];
    escalaOptions: SelectOption[] = [];
    cidadeOptions: SelectOption[] = [];
    cargoOptions: SelectOption[] = [];
    pessoaOptions: SelectOption[] = [];
    tipoLiberacaoOptions: SelectOption[] = [
        { label: 'Automático', value: 'automatico' },
        { label: 'Manual', value: 'manual' }
    ];
    statusOptions: SelectOption[] = [
        { label: 'Ativo', value: true },
        { label: 'Inativo', value: false }
    ];

    // Debounce for search
    private searchSubject = new Subject<string>();

    ngOnInit() {
        this.initializeColumns();
        this.initializeFilterOptions();
        this.setupSearchDebounce();

        // Observar mudanças na empresa selecionada
        this.empresaSelectorService.selectedEmpresaIds$.subscribe(ids => {
            if (ids.length > 0) {
                this.filtros.idEmpresa = ids[0];
                this.loadEstruturas();
            } else {
                this.estruturas = [];
                this.totalRecords = 0;
            }
        });
    }

    private initializeColumns(): void {
        this.columns = [
            {
                field: 'nome',
                header: 'Nome',
                sortable: true,
                filter: true
            },
            {
                field: 'niveis',
                header: 'Nº de Parcelas',
                formatter: (v: any[]) => `${v?.length || 0}`
            },
            {
                field: 'tipoComissao',
                header: 'Forma de Cálculo',
                formatter: (v) => TipoComissaoLabels[v as TipoComissao] || 'Desconhecido',
                sortable: true
            },
            {
                field: 'valorPercentual',
                header: 'Valor',
                formatter: (v, item) => {
                    if (item?.valorPercentual) return `${item.valorPercentual}%`;
                    if (item?.valorFixoInicial) return `R$ ${item.valorFixoInicial}`;
                    return '-';
                }
            },
            {
                field: 'regraLiberacao',
                header: 'Tipo de Liberação',
                formatter: (v) => {
                    const labels: Record<number, string> = {
                        [RegraLiberacao.Diretamente]: 'Direta',
                        [RegraLiberacao.Percentual]: 'Automática',
                        [RegraLiberacao.Parcela]: 'Manual'
                    };
                    return labels[v] || 'Automática';
                }
            },
            {
                field: 'tipoRateio',
                header: 'Prioridade',
                formatter: (v) => {
                    const labels: Record<number, string> = {
                        [TipoRateio.Linear]: 'Linear',
                        [TipoRateio.Prioritario]: 'Primeiro'
                    };
                    return labels[v] || 'Linear';
                }
            },
            {
                field: 'ativo',
                header: 'Status',
                formatter: (v: boolean) => v ? '✅ Ativo' : '❌ Inativo'
            }
        ];
    }

    private initializeFilterOptions(): void {
        // TODO: Carregar opções dos endpoints quando disponíveis
        // Por enquanto, vazio para mostrar "Mostrar tudo"
        this.produtoOptions = [];
        this.escalaOptions = [];
        this.cidadeOptions = [];
        this.cargoOptions = [];
        this.pessoaOptions = [];
    }

    private setupSearchDebounce(): void {
        this.searchSubject.pipe(
            debounceTime(400),
            distinctUntilChanged()
        ).subscribe(() => {
            this.filtros.pagina = 1;
            this.loadEstruturas();
        });
    }

    onFilterChange(): void {
        this.filtros.pagina = 1;
        this.loadEstruturas();
    }

    onSearchChange(): void {
        this.searchSubject.next(this.filtros.busca || '');
    }

    onLazyLoad(event: { page: number; rows: number; filter: string }) {
        this.filtros.pagina = event.page + 1;
        this.filtros.tamanhoPagina = event.rows;
        this.filtros.busca = event.filter;
        this.loadEstruturas();
    }

    loadEstruturas() {
        if (!this.filtros.idEmpresa) return;

        this.loading = true;
        this.estruturaService.getByEmpresa(this.filtros.idEmpresa, this.filtros).subscribe({
            next: (result) => {
                this.estruturas = result.items;
                this.totalRecords = result.totalItems;
                this.loading = false;
            },
            error: (_error: unknown) => {
                console.error('Erro ao carregar estruturas:', _error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar estruturas de comissão'
                });
                this.loading = false;
            }
        });
    }

    onAdd() {
        this.router.navigate(['/comissoes/estruturas/nova']);
    }

    onEdit(estrutura: EstruturaComissao) {
        this.router.navigate(['/comissoes/estruturas/editar', estrutura.id]);
    }

    onDelete(estrutura: EstruturaComissao) {
        this.confirmationService.confirm({
            message: `Deseja realmente excluir a estrutura "${estrutura.nome}"?`,
            header: 'Confirmar Exclusão',
            icon: 'pi pi-trash',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.estruturaService.delete(estrutura.id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Estrutura excluída com sucesso'
                        });
                        this.loadEstruturas();
                    },
                    error: (_error: unknown) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao excluir estrutura'
                        });
                    }
                });
            }
        });
    }

    onToggleStatus(estrutura: EstruturaComissao) {
        const action = estrutura.ativo ? 'desativar' : 'ativar';
        const actionLabel = estrutura.ativo ? 'Desativar' : 'Ativar';

        this.confirmationService.confirm({
            message: `Deseja ${action} a estrutura "${estrutura.nome}"?`,
            header: `Confirmar ${actionLabel}`,
            icon: estrutura.ativo ? 'pi pi-times-circle' : 'pi pi-check-circle',
            acceptButtonStyleClass: estrutura.ativo ? 'p-button-warning' : 'p-button-success',
            accept: () => {
                const observable = estrutura.ativo
                    ? this.estruturaService.desativar(estrutura.id)
                    : this.estruturaService.ativar(estrutura.id);

                observable.subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: `Estrutura ${estrutura.ativo ? 'desativada' : 'ativada'} com sucesso`
                        });
                        this.loadEstruturas();
                    },
                    error: (_error: unknown) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: `Erro ao ${action} estrutura`
                        });
                    }
                });
            }
        });
    }

    /**
     * Envia estrutura de comissão para o sistema UAU
     */
    onEnviarParaUau(estrutura: EstruturaComissao) {
        this.confirmationService.confirm({
            message: `Deseja enviar a estrutura "${estrutura.nome}" para o sistema UAU?`,
            header: 'Enviar para UAU',
            icon: 'pi pi-cloud-upload',
            acceptButtonStyleClass: 'p-button-info',
            accept: () => {
                this.loading = true;
                this.estruturaService.enviarParaUau(estrutura.id).subscribe({
                    next: (result) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Enviado!',
                            detail: `Estrutura sincronizada com UAU. Código: ${result?.codigoUau || 'N/A'}`
                        });
                        this.loading = false;
                    },
                    error: (_error: unknown) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao enviar estrutura para o UAU'
                        });
                        this.loading = false;
                    }
                });
            }
        });
    }
}
