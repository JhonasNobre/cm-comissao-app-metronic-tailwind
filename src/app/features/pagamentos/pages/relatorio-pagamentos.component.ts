import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PagamentosService, EstatisticasPagamentosResponse, RelatorioMensalResponse, ResumoBeneficiarioResponse } from '../services/pagamentos.service';
import { AuthService } from '../../../core/services/auth.service';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-relatorio-pagamentos',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, DatePipe, CurrencyPipe],
    templateUrl: './relatorio-pagamentos.component.html',
    styleUrl: './relatorio-pagamentos.component.scss'
})
export class RelatorioPagamentosComponent implements OnInit {
    private pagamentosService = inject(PagamentosService);
    private authService = inject(AuthService);

    // Signals
    loading = signal(false);
    loadingBeneficiario = signal(false);
    empresaId = signal<string>('');

    // Dados
    estatisticas = signal<EstatisticasPagamentosResponse | null>(null);
    relatorioMensal = signal<RelatorioMensalResponse | null>(null);
    resumoBeneficiario = signal<ResumoBeneficiarioResponse | null>(null);

    // Filtros
    mesSelecionado = new Date().getMonth() + 1;
    anoSelecionado = new Date().getFullYear();
    documentoBusca = '';

    // Tabs
    tabAtiva = signal<'dashboard' | 'mensal' | 'beneficiario'>('dashboard');

    // Computed
    meses = [
        { valor: 1, nome: 'Janeiro' },
        { valor: 2, nome: 'Fevereiro' },
        { valor: 3, nome: 'Março' },
        { valor: 4, nome: 'Abril' },
        { valor: 5, nome: 'Maio' },
        { valor: 6, nome: 'Junho' },
        { valor: 7, nome: 'Julho' },
        { valor: 8, nome: 'Agosto' },
        { valor: 9, nome: 'Setembro' },
        { valor: 10, nome: 'Outubro' },
        { valor: 11, nome: 'Novembro' },
        { valor: 12, nome: 'Dezembro' }
    ];

    anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    ngOnInit(): void {
        // Obter empresa do usuário logado
        const user = this.authService.currentUserValue;
        if (user?.empresaId) {
            this.empresaId.set(user.empresaId);
            this.carregarEstatisticas();
        }
    }

    selecionarTab(tab: 'dashboard' | 'mensal' | 'beneficiario'): void {
        this.tabAtiva.set(tab);
        if (tab === 'dashboard' && !this.estatisticas()) {
            this.carregarEstatisticas();
        }
    }

    carregarEstatisticas(): void {
        if (!this.empresaId()) return;

        this.loading.set(true);
        this.pagamentosService.obterEstatisticas(this.empresaId())
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (data) => this.estatisticas.set(data),
                error: (err) => console.error('Erro ao carregar estatísticas', err)
            });
    }

    carregarRelatorioMensal(): void {
        if (!this.empresaId()) return;

        this.loading.set(true);
        this.pagamentosService.obterRelatorioMensal(
            this.empresaId(),
            this.mesSelecionado,
            this.anoSelecionado
        )
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (data) => this.relatorioMensal.set(data),
                error: (err) => console.error('Erro ao carregar relatório', err)
            });
    }

    buscarBeneficiario(): void {
        if (!this.documentoBusca || !this.empresaId()) return;

        // Limpar formatação
        const docLimpo = this.documentoBusca.replace(/\D/g, '');
        if (docLimpo.length < 11) {
            alert('Informe um CPF ou CNPJ válido');
            return;
        }

        this.loadingBeneficiario.set(true);
        this.pagamentosService.obterResumoBeneficiario(docLimpo, this.empresaId())
            .pipe(finalize(() => this.loadingBeneficiario.set(false)))
            .subscribe({
                next: (data) => this.resumoBeneficiario.set(data),
                error: (err) => {
                    console.error('Erro ao buscar beneficiário', err);
                    this.resumoBeneficiario.set(null);
                }
            });
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
            'Pendente': 'badge-warning',
            'Concluida': 'badge-success',
            'Erro': 'badge-danger',
            'Cancelada': 'badge-secondary'
        };
        return classes[status] || 'badge-info';
    }
}
