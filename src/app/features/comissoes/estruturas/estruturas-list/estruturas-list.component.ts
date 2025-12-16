import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DialogService } from 'primeng/dynamicdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { EstruturaComissaoService } from '../../services/estrutura-comissao.service';
import { EstruturaComissao, EstruturaComissaoFiltros } from '../../models/estrutura-comissao.model';
import { TipoComissaoLabels, TipoComissao } from '../../models/enums';
import { EmpresaSelectorService } from '../../../../core/services/empresa-selector.service';
import { GenericPTableComponent } from '../../../../shared/components/ui/generic-p-table/generic-p-table.component';
import { ColumnHeader } from '../../../../shared/models/column-header.model';

@Component({
    selector: 'app-estruturas-list',
    standalone: true,
    imports: [
        CommonModule,
        GenericPTableComponent,
        ToastModule,
        ConfirmDialogModule
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
    estruturas: EstruturaComissao[] = []; // Generic component expects array, not signal of array for tableData
    loading = false;
    totalRecords = 0;

    // Columns
    columns: ColumnHeader<EstruturaComissao>[] = [];

    // Filtros
    filtros: EstruturaComissaoFiltros = {
        busca: '',
        ativo: undefined,
        pagina: 1,
        tamanhoPagina: 10,
        idEmpresa: undefined
    };

    ngOnInit() {
        this.initializeColumns();

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
                    if (item?.valorPercentual) return `${item.valorPercentual}`;
                    if (item?.valorFixoInicial) return `${item.valorFixoInicial}`;
                    return '25';
                }
            },
            {
                field: 'regraLiberacao',
                header: 'Tipo de Liberação',
                formatter: (v) => {
                    const labels: Record<number, string> = {
                        0: 'Diretamente',
                        1: 'Automática',
                        2: 'Manual'
                    };
                    return labels[v] || 'Automática';
                }
            },
            {
                field: 'tipoRateio',
                header: 'Prioridade',
                formatter: (v) => {
                    const labels: Record<number, string> = {
                        0: 'Linear',
                        1: 'Primeiro',
                        2: 'Último'
                    };
                    return labels[v] || 'Linear';
                }
            }
        ];
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
        this.estruturaService.getAll(this.filtros).subscribe({
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
}
