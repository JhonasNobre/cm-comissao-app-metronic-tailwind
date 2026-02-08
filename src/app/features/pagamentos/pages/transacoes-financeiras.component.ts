import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PagamentosService, TransacaoFinanceiraResponse } from '../services/pagamentos.service';
import { AuthService } from '../../../core/services/auth.service';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-transacoes-financeiras',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, DatePipe, CurrencyPipe],
    templateUrl: './transacoes-financeiras.component.html',
    styleUrl: './transacoes-financeiras.component.scss'
})
export class TransacoesFinanceirasComponent implements OnInit {
    private pagamentosService = inject(PagamentosService);
    private authService = inject(AuthService);

    // Signals
    loading = signal(false);
    empresaId = signal<string>('');
    transacoes = signal<TransacaoFinanceiraResponse[]>([]);

    // Paginação
    pagina = 1;
    tamanhoPagina = 20;
    totalItens = 0;

    // Filtros
    documentoFiltro = '';
    statusFiltro = '';

    ngOnInit(): void {
        const user = this.authService.currentUserValue;
        if (user?.empresaId) {
            this.empresaId.set(user.empresaId);
            this.carregarTransacoes();
        }
    }

    carregarTransacoes(): void {
        if (!this.empresaId()) return;

        this.loading.set(true);
        this.pagamentosService.listarTransacoes(this.empresaId(), this.pagina, this.tamanhoPagina)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (data) => {
                    this.transacoes.set(data.itens || []);
                    this.totalItens = data.total || 0;
                },
                error: (err) => console.error('Erro ao carregar transações', err)
            });
    }

    buscarPorDocumento(): void {
        if (!this.documentoFiltro || !this.empresaId()) return;

        const docLimpo = this.documentoFiltro.replace(/\D/g, '');
        this.loading.set(true);
        this.pagamentosService.listarTransacoesBeneficiario(docLimpo, this.empresaId())
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (data) => this.transacoes.set(data || []),
                error: (err) => console.error('Erro ao buscar transações', err)
            });
    }

    limparFiltros(): void {
        this.documentoFiltro = '';
        this.statusFiltro = '';
        this.pagina = 1;
        this.carregarTransacoes();
    }

    proximaPagina(): void {
        if (this.pagina * this.tamanhoPagina < this.totalItens) {
            this.pagina++;
            this.carregarTransacoes();
        }
    }

    paginaAnterior(): void {
        if (this.pagina > 1) {
            this.pagina--;
            this.carregarTransacoes();
        }
    }

    formatarDocumento(doc: string): string {
        if (!doc) return '';
        if (doc.length === 11) {
            return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (doc.length === 14) {
            return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
        return doc;
    }

    getStatusClass(status: string): string {
        const classes: Record<string, string> = {
            'Pendente': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            'Processando': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'Concluida': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            'Erro': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            'Cancelada': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
        };
        return classes[status] || 'bg-gray-100 text-gray-600';
    }
}
