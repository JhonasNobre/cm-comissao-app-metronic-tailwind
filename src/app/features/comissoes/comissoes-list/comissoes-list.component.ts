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

    comissoes: Comissao[] = [];
    loading = false;
    totalRecords = 0;
    columns: ColumnHeader<Comissao>[] = [];

    filtros: ComissaoFiltros = {
        pagina: 1,
        tamanhoPagina: 10,
        idEmpresa: undefined
    };

    // Modal Rejeição
    rejeicaoVisible = false;
    motivoRejeicao = '';
    comissaoEmEdicao: Comissao | null = null;
    saving = false;

    ngOnInit() {
        this.initializeColumns();

        this.empresaSelectorService.currentEmpresa$.subscribe(empresa => {
            if (empresa) {
                this.filtros.idEmpresa = empresa.id;
                this.loadComissoes();
            } else {
                this.comissoes = [];
                this.totalRecords = 0;
            }
        });
    }

    private initializeColumns(): void {
        this.columns = [
            {
                field: 'nomeEstrutura',
                header: 'Estrutura',
                sortable: true
            },
            {
                field: 'valorBase',
                header: 'Base Cálculo',
                formatter: (v) => `R$ ${v?.toFixed(2) || '0.00'}`,
                sortable: true
            },
            {
                field: 'valorTotalComissao',
                header: 'Comissão Total',
                formatter: (v) => `R$ ${v?.toFixed(2) || '0.00'}`,
                sortable: true
            },
            {
                field: 'criadoEm',
                header: 'Data Geração',
                pipe: 'date',
                pipeArgs: 'dd/MM/yyyy HH:mm',
                sortable: true
            },
            {
                field: 'status',
                header: 'Status',
                displayAs: 'badge',
                badgeSeverityMap: {
                    'Pendente': 'warning',
                    'Aprovada': 'success',
                    'Rejeitada': 'danger',
                    'Paga': 'info'
                },
                formatter: (v) => {
                    // A API retorna string (ex: "Pendente"), então apenas retornamos o valor
                    if (typeof v === 'string') return v;

                    const labels: Record<number, string> = {
                        [EStatusComissao.Pendente]: 'Pendente',
                        [EStatusComissao.Aprovada]: 'Aprovada',
                        [EStatusComissao.Rejeitada]: 'Rejeitada',
                        [EStatusComissao.Paga]: 'Paga'
                    };
                    return labels[v] || 'Desconhecido';
                }
            }
        ];
    }

    onLazyLoad(event: { page: number; rows: number }) {
        this.filtros.pagina = event.page + 1;
        this.filtros.tamanhoPagina = event.rows;
        this.loadComissoes();
    }

    loadComissoes() {
        if (!this.filtros.idEmpresa) return;

        this.loading = true;
        this.comissaoService.getAll(this.filtros).subscribe({
            next: (result) => {
                this.comissoes = result.items;
                this.totalRecords = result.totalItems;
                this.loading = false;
            },
            error: (error) => {
                console.error('Erro ao carregar comissões:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Falha ao carregar comissões'
                });
                this.loading = false;
            }
        });
    }

    onAprovar(comissao: Comissao) {
        this.confirmationService.confirm({
            message: `Tem certeza que deseja aprovar a comissão de R$ ${comissao.valorTotalComissao}?`,
            header: 'Aprovar Comissão',
            icon: 'pi pi-check-circle',
            acceptLabel: 'Sim, Aprovar',
            rejectLabel: 'Cancelar',
            accept: () => {
                const currentUser = this.authService.currentUserValue;
                if (!currentUser) {
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Usuário não autenticado' });
                    return;
                }

                this.comissaoService.aprovar(comissao.id, currentUser.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Comissão aprovada!' });
                        this.loadComissoes();
                    },
                    error: (err) => {
                        console.error(err);
                        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao aprovar comissão' });
                    }
                });
            }
        });
    }

    onRejeitar(comissao: Comissao) {
        this.comissaoEmEdicao = comissao;
        this.motivoRejeicao = '';
        this.rejeicaoVisible = true;
    }

    confirmarRejeicao() {
        if (!this.comissaoEmEdicao || !this.motivoRejeicao) return;

        const currentUser = this.authService.currentUserValue;
        if (!currentUser) {
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Usuário não autenticado' });
            return;
        }

        this.saving = true;
        this.comissaoService.rejeitar(this.comissaoEmEdicao.id, currentUser.id, this.motivoRejeicao).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Comissão rejeitada!' });
                this.rejeicaoVisible = false;
                this.loadComissoes();
                this.saving = false;
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao rejeitar comissão' });
                this.saving = false;
            }
        });
    }

    isPendente(comissao: Comissao): boolean {
        // Aceita tanto número (1) quanto string vinda da API ("Pendente")
        return comissao.status == EStatusComissao.Pendente || comissao.status === 'Pendente' as any;
    }

    onRowSelect(comissao: Comissao) {
        this.router.navigate(['/comissoes/detalhes', comissao.id]);
    }
}
