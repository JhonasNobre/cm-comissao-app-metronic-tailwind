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
import { VendaImportada, VendaFiltros } from '../models/venda.model';
import { ComissaoService } from '../../comissoes/services/comissao.service';
import { EstruturaComissaoService } from '../../comissoes/services/estrutura-comissao.service';
import { EstruturaComissao } from '../../comissoes/models/estrutura-comissao.model';
import { AuthService } from '../../../core/services/auth.service';
// Import crucial do componente standalone
import { GenericPTableComponent } from '../../../shared/components/ui/generic-p-table/generic-p-table.component';
import { ColumnHeader } from '../../../shared/models/column-header.model';

@Component({
    selector: 'app-vendas-lista',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        DialogModule,
        SelectModule,
        ToastModule,
        GenericPTableComponent // Deve estar aqui
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './vendas-lista.component.html'
})
export class VendasListaComponent implements OnInit {
    private vendaService = inject(VendaService);
    private comissaoService = inject(ComissaoService);
    private estruturaService = inject(EstruturaComissaoService);
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
    estruturas: EstruturaComissao[] = [];
    estruturaSelecionada: EstruturaComissao | null = null;
    gerando = false;

    ngOnInit() {
        this.initializeColumns();
        this.loadEstruturas();
    }

    initializeColumns() {
        this.columns = [
            { field: 'idVendaLegado', header: 'Contrato/ID' },
            { field: 'nomeCliente', header: 'Cliente', filter: true },
            { field: 'dataVenda', header: 'Data Venda', displayAs: 'date', pipeArgs: 'dd/MM/yyyy' },
            { field: 'valorTotalVenda', header: 'Valor', displayAs: 'currency' }
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
                this.vendas = data.items;
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

    loadEstruturas() {
        this.estruturaService.getAll({ pagina: 1, tamanhoPagina: 100, ativo: true }).subscribe({
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

        // --- LOG PARA DEBUG SE DER ERRO NOVAMENTE ---
        console.log('CurrentUser Claims:', currentUser);

        if (!currentUser) {
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Sessão inválida. Faça login novamente.' });
            return;
        }

        // Tenta obter o ID de várias fontes possíveis
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

                // Tratamento de erro mais amigável
                const msg = err.error?.errors?.mensagens?.[0] || 'Falha ao gerar comissão';
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: msg });
            }
        });
    }
}
