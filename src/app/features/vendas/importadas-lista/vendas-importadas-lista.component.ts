import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Router } from '@angular/router';

import { VendaService } from '../services/venda.service';
import { EmpresaSelectorService } from '../../../core/services/empresa-selector.service';
import { VendaImportada, VendaFiltros } from '../models/venda.model';
import { ComissaoService } from '../../comissoes/services/comissao.service';
import { EstruturaComissaoService } from '../../comissoes/services/estrutura-comissao.service';
import { EstruturaComissao } from '../../comissoes/models/estrutura-comissao.model';
import { AuthService } from '../../../core/services/auth.service';
import { GenericPTableComponent } from '../../../shared/components/ui/generic-p-table/generic-p-table.component';
import { ColumnHeader } from '../../../shared/models/column-header.model';

@Component({
    selector: 'app-vendas-importadas-lista',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        DialogModule,
        SelectModule,
        ToastModule,
        GenericPTableComponent
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './vendas-importadas-lista.component.html'
})
export class VendasImportadasListaComponent implements OnInit {
    private vendaService = inject(VendaService);
    private comissaoService = inject(ComissaoService);
    private estruturaService = inject(EstruturaComissaoService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private messageService = inject(MessageService);
    private empresaSelectorService = inject(EmpresaSelectorService);

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
    estruturas: EstruturaComissao[] = [];
    estruturaSelecionada: EstruturaComissao | null = null;
    gerando = false;

    ngOnInit() {
        this.initializeColumns();

        this.empresaSelectorService.selectedEmpresaIds$.subscribe(ids => {
            if (ids.length > 0) {
                this.loadEstruturas(ids[0]);
            } else {
                this.estruturas = [];
            }
        });
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

    loadEstruturas(idEmpresa: string) {
        this.estruturaService.getByEmpresa(idEmpresa, { pagina: 1, tamanhoPagina: 100, ativo: true }).subscribe({
            next: (data) => {
                this.estruturas = data.items;
            }
        });
    }

    abrirGerar(venda: VendaImportada) {
        this.vendaSelecionada = venda;
        this.estruturaSelecionada = null; // Reset
        this.gerarVisible = true;
    }

    confirmarGeracao() {
        if (!this.vendaSelecionada || !this.estruturaSelecionada) return;

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
            idEstruturaComissao: this.estruturaSelecionada.id,
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
                const msg = err.error?.errors?.mensagens?.[0] || 'Falha ao gerar comissão';
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: msg });
            }
        });
    }
}
