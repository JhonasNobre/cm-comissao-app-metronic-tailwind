import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Router } from '@angular/router';

import { VendaService } from '../services/venda.service';
import { VendaImportada, VendaFiltros } from '../models/venda.model';
import { ComissaoService } from '../../comissoes/services/comissao.service';
import { AuthService } from '../../../core/services/auth.service';
import { GenericPTableComponent } from '../../../shared/components/ui/generic-p-table/generic-p-table.component';
import { ColumnHeader } from '../../../shared/models/column-header.model';

@Component({
    selector: 'app-vendas-importadas-lista',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        DialogModule,
        ToastModule,
        GenericPTableComponent
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './vendas-importadas-lista.component.html'
})
export class VendasImportadasListaComponent implements OnInit {
    private vendaService = inject(VendaService);
    private comissaoService = inject(ComissaoService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private messageService = inject(MessageService);

    vendas: VendaImportada[] = [];
    totalRecords = 0;
    loading = false;

    columns: ColumnHeader<VendaImportada>[] = [];

    filtros: VendaFiltros = {
        pagina: 1,
        tamanhoPagina: 10,
        busca: '',
        apenasPendentes: true
    };

    // Dialog Gerar
    gerarVisible = false;
    vendaSelecionada: VendaImportada | null = null;
    gerando = false;

    get semEstruturaVinculada(): boolean {
        return !!this.vendaSelecionada && !this.vendaSelecionada.idEstruturaComissao;
    }

    ngOnInit() {
        this.initializeColumns();
    }

    initializeColumns() {
        this.columns = [
            { field: 'idVendaLegado', header: 'Contrato/ID' },
            { field: 'nomeCliente', header: 'Cliente', filter: true },
            { field: 'dataVenda', header: 'Data Venda', displayAs: 'date', pipeArgs: 'dd/MM/yyyy' },
            { field: 'valorTotalVenda', header: 'Valor', displayAs: 'currency' },
            { field: 'quemAprovouLegado', header: 'Aprovador (A)' },
            {
                field: 'statusDisplay',
                header: 'Status',
                displayAs: 'badge'
            }
        ];
    }

    onLazyLoad(event: any) {
        this.filtros.pagina = event.page + 1;
        this.filtros.tamanhoPagina = event.rows;
        if (event.filter !== undefined) {
            this.filtros.busca = event.filter;
        }
        this.loadVendas();
    }

    loadVendas() {
        this.loading = true;
        this.vendaService.getAll(this.filtros).subscribe({
            next: (data) => {
                this.vendas = data.items.map(v => {
                    let statusDisplay = 'Pendente';
                    let severity = 'warn';

                    if (v.statusImportacao === 2) {
                        statusDisplay = 'Processada';
                        severity = 'success';
                    } else if (v.statusImportacao === 3 || v.statusImportacao === 4) {
                        statusDisplay = 'Falha';
                        severity = 'danger';
                    } else if (v.statusImportacao === 1 && !v.nomeCliente) {
                        statusDisplay = 'Irregular';
                        severity = 'danger';
                    }

                    return {
                        ...v,
                        statusDisplay,
                        badgeSeverityMap: { [statusDisplay]: severity }
                    };
                });
                this.totalRecords = data.totalItems;
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar vendas' });
            }
        });
    }

    abrirGerar(venda: VendaImportada) {
        this.vendaSelecionada = venda;
        this.gerarVisible = true;
    }

    confirmarGeracao() {
        if (!this.vendaSelecionada) return;

        if (!this.vendaSelecionada.idEstruturaComissao) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Atenção',
                detail: 'Esta venda não possui uma estrutura de comissão vinculada. Use a opção "Vincular Estrutura" antes de gerar a comissão.'
            });
            return;
        }

        const currentUser = this.authService.currentUserValue;

        if (!currentUser) {
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Sessão inválida. Faça login novamente.' });
            return;
        }

        const userId = currentUser.id || currentUser.sub || currentUser.nameid || currentUser.Id;

        if (!userId) {
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Identificador do usuário não encontrado na sessão.' });
            return;
        }

        this.gerando = true;

        const command = {
            idVendaImportada: this.vendaSelecionada.id,
            usuarioId: userId
        };

        this.comissaoService.gerar(command).subscribe({
            next: (idComissao) => {
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Comissão gerada com sucesso!' });
                this.gerarVisible = false;

                setTimeout(() => {
                    const rawId = typeof idComissao === 'string' ? idComissao.replace(/"/g, '') : idComissao;
                    this.router.navigate(['/comissoes/detalhes', rawId]);
                }, 1000);
            },
            error: (err) => {
                console.error(err);
                this.gerando = false;
                const msg = err.error?.errors?.[0] || err.error?.errors?.mensagens?.[0] || 'Falha ao gerar comissão';
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: msg });
            }
        });
    }
}
