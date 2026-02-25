import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

import { EmpresaSelectorService } from '../../../../core/services/empresa-selector.service';
import { BonificacaoCalculadaService } from '../services/bonificacao-calculada.service';
import {
    BonificacaoCalculada,
    BonificacaoParcela,
    BonificacaoFiltros,
    ETipoBonificacao,
    EStatusBonificacao,
    EStatusParcelaBonificacao
} from '../models/bonificacao-calculada.model';

@Component({
    selector: 'app-bonificacao-calculada-lista',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        TableModule,
        TagModule,
        SelectModule,
        ToastModule,
        ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './bonificacao-calculada-lista.component.html'
})
export class BonificacaoCalculadaListaComponent implements OnInit {
    private empresaSelectorService = inject(EmpresaSelectorService);
    private bonificacaoService = inject(BonificacaoCalculadaService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    bonificacoes: BonificacaoCalculada[] = [];
    totalRecords = 0;
    loading = false;

    filtros: BonificacaoFiltros = {
        pagina: 1,
        tamanhoPagina: 20
    };

    // Enums expostos ao template
    ETipoBonificacao = ETipoBonificacao;
    EStatusBonificacao = EStatusBonificacao;
    EStatusParcelaBonificacao = EStatusParcelaBonificacao;

    // Opções de filtro
    meses = [
        { label: 'Janeiro', value: 1 }, { label: 'Fevereiro', value: 2 },
        { label: 'Março', value: 3 }, { label: 'Abril', value: 4 },
        { label: 'Maio', value: 5 }, { label: 'Junho', value: 6 },
        { label: 'Julho', value: 7 }, { label: 'Agosto', value: 8 },
        { label: 'Setembro', value: 9 }, { label: 'Outubro', value: 10 },
        { label: 'Novembro', value: 11 }, { label: 'Dezembro', value: 12 }
    ];

    anos: { label: string; value: number }[] = [];

    tiposOpcoes = [
        { label: 'Todos os tipos', value: undefined },
        { label: 'Por Parcelamento', value: ETipoBonificacao.PorParcelamento },
        { label: 'Livre', value: ETipoBonificacao.Livre },
        { label: 'Por Meta', value: ETipoBonificacao.PorMeta }
    ];

    statusOpcoes = [
        { label: 'Todos os status', value: undefined },
        { label: 'Pendente', value: EStatusBonificacao.Pendente },
        { label: 'Parcialmente Liberada', value: EStatusBonificacao.PartialmenteLiberada },
        { label: 'Liberada', value: EStatusBonificacao.Liberada },
        { label: 'Paga', value: EStatusBonificacao.Paga },
        { label: 'Cancelada', value: EStatusBonificacao.Cancelada }
    ];

    ngOnInit() {
        // Pré-popular anos (últimos 5 anos + próximo)
        const anoAtual = new Date().getFullYear();
        for (let a = anoAtual + 1; a >= anoAtual - 4; a--) {
            this.anos.push({ label: a.toString(), value: a });
        }

        // Inicializar com mês e ano atuais
        this.filtros.mes = new Date().getMonth() + 1;
        this.filtros.ano = anoAtual;

        this.empresaSelectorService.selectedEmpresaIds$.subscribe(ids => {
            const idEmpresa = ids.length > 0 ? ids[0] : undefined;
            this.filtros.idEmpresa = idEmpresa;
            this.bonificacoes = [];
            if (idEmpresa) {
                this.loadBonificacoes();
            }
        });
    }

    loadBonificacoes() {
        if (!this.filtros.idEmpresa) {
            console.warn('loadBonificacoes abortado: idEmpresa indefinido.');
            return;
        }

        this.loading = true;
        this.filtros.pagina = 1;

        this.bonificacaoService.listar(this.filtros).subscribe({
            next: (res) => {
                this.bonificacoes = res.items;
                this.totalRecords = res.totalItems;
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar bonificações' });
                this.loading = false;
            }
        });
    }

    onFiltroChange() {
        this.loadBonificacoes();
    }

    // Labels e severities
    getTipoBonificacaoLabel(tipo: ETipoBonificacao): string {
        switch (tipo) {
            case ETipoBonificacao.PorParcelamento: return 'Por Parcelamento';
            case ETipoBonificacao.Livre: return 'Livre';
            case ETipoBonificacao.PorMeta: return 'Por Meta';
            default: return 'Desconhecido';
        }
    }

    getTipoBonificacaoSeverity(tipo: ETipoBonificacao): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        switch (tipo) {
            case ETipoBonificacao.PorParcelamento: return 'info';
            case ETipoBonificacao.Livre: return 'success';
            case ETipoBonificacao.PorMeta: return 'warn';
            default: return 'secondary';
        }
    }

    getStatusBonificacaoLabel(status: EStatusBonificacao): string {
        switch (status) {
            case EStatusBonificacao.Pendente: return 'Pendente';
            case EStatusBonificacao.PartialmenteLiberada: return 'Parcialmente Liberada';
            case EStatusBonificacao.Liberada: return 'Liberada';
            case EStatusBonificacao.Paga: return 'Paga';
            case EStatusBonificacao.Cancelada: return 'Cancelada';
            default: return 'Desconhecido';
        }
    }

    getStatusBonificacaoSeverity(status: EStatusBonificacao): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        switch (status) {
            case EStatusBonificacao.Pendente: return 'warn';
            case EStatusBonificacao.PartialmenteLiberada: return 'info';
            case EStatusBonificacao.Liberada: return 'success';
            case EStatusBonificacao.Paga: return 'success';
            case EStatusBonificacao.Cancelada: return 'danger';
            default: return 'secondary';
        }
    }

    getStatusParcelaBonificacaoLabel(status: EStatusParcelaBonificacao): string {
        switch (status) {
            case EStatusParcelaBonificacao.Pendente: return 'Pendente';
            case EStatusParcelaBonificacao.Liberada: return 'Liberada';
            case EStatusParcelaBonificacao.Paga: return 'Paga';
            case EStatusParcelaBonificacao.Cancelada: return 'Cancelada';
            default: return 'Desconhecido';
        }
    }

    getStatusParcelaBonificacaoSeverity(status: EStatusParcelaBonificacao): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        switch (status) {
            case EStatusParcelaBonificacao.Pendente: return 'warn';
            case EStatusParcelaBonificacao.Liberada: return 'info';
            case EStatusParcelaBonificacao.Paga: return 'success';
            case EStatusParcelaBonificacao.Cancelada: return 'danger';
            default: return 'secondary';
        }
    }

    getNomeBeneficiario(bonif: BonificacaoCalculada, parcela: BonificacaoParcela): string {
        return bonif.itens?.find(i => i.idUsuario === parcela.idUsuario)?.nomeBeneficiario || '—';
    }

    liberarParcela(bonif: BonificacaoCalculada, parcela: BonificacaoParcela) {
        this.confirmationService.confirm({
            message: `Confirma a liberação da parcela ${parcela.numeroParcela} de bonificação para ${this.getNomeBeneficiario(bonif, parcela)}?`,
            header: 'Liberar Parcela de Bonificação',
            icon: 'pi pi-check-circle',
            accept: () => {
                this.bonificacaoService.liberarParcela(bonif.id, parcela.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Parcela de bonificação liberada!' });
                        this.loadBonificacoes();
                    },
                    error: (err) => {
                        console.error(err);
                        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao liberar parcela' });
                    }
                });
            }
        });
    }
}
