import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImobtechRemessaService } from '../../services/imobtech-remessa.service';
import { EmpresaSelectorService } from '../../../../core/services/empresa-selector.service';

// PrimeNG
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-imobtech-diagnostic',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ToastModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        TextareaModule
    ],
    providers: [MessageService],
    templateUrl: './imobtech-diagnostic.component.html',
    styles: [`
    .section-card { @apply bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6; }
    .label-text { @apply text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1; }
  `]
})
export class ImobtechDiagnosticComponent implements OnInit {
    empresaId: string = '';
    logs: string[] = [];

    // Inputs
    idsRemessa: string = '';
    idsParcela: string = '';
    cpfPix: string = '';
    idParcelaRateio: number | null = null;

    // Renegociação
    renegIdAntiga: number | null = null;
    renegIdNova: number | null = null;
    renegJson: string = '{\n  "novaDataVencimento": "2025-01-01",\n  "valorTotal": 100.00,\n  "beneficiarios": []\n}';

    constructor(
        private service: ImobtechRemessaService,
        private empresaService: EmpresaSelectorService,
        private messageService: MessageService
    ) { }

    ngOnInit() {
        this.empresaService.selectedEmpresaIds$.subscribe(ids => {
            this.empresaId = ids.length > 0 ? ids[0] : '';
            if (this.empresaId) this.log(`Empresa ID selecionada: ${this.empresaId}`);
        });
    }

    log(msg: string, data?: any) {
        const time = new Date().toLocaleTimeString();
        const formatted = data ? `${msg} ${JSON.stringify(data, null, 2)}` : msg;
        this.logs.unshift(`[${time}] ${formatted}`);
    }

    limparLogs() {
        this.logs = [];
    }

    // Ações
    testarCancelarRemessa() {
        if (!this.idsRemessa) return;
        const ids = this.idsRemessa.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
        this.log('Cancelando Remessas:', ids);
        this.service.cancelarRemessa(this.empresaId, ids).subscribe({
            next: (res) => {
                this.log('Sucesso Cancelar Remessa', res);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Remessas canceladas' });
            },
            error: (err) => {
                this.log('Erro Cancelar Remessa', err);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao cancelar remessas' });
            }
        });
    }

    testarCancelarParcelas() {
        if (!this.idsParcela) return;
        const ids = this.idsParcela.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
        this.log('Cancelando Parcelas:', ids);
        this.service.cancelarParcelas(this.empresaId, ids).subscribe({
            next: (res) => {
                this.log('Sucesso Cancelar Parcelas', res);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Parcelas canceladas' });
            },
            error: (err) => {
                this.log('Erro Cancelar Parcelas', err);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao cancelar parcelas' });
            }
        });
    }

    testarPix() {
        if (!this.cpfPix) return;
        this.log('Validando Pix:', this.cpfPix);
        this.service.validarPix(this.empresaId, this.cpfPix).subscribe({
            next: (res) => {
                this.log('Resultado Pix', res);
                const status = res.Valido ? 'success' : 'warn';
                const msg = res.Valido ? 'Chave Pix Válida' : 'Chave Pix Não Encontrada';
                this.messageService.add({ severity: status, summary: 'Validação Pix', detail: msg });
            },
            error: (err) => {
                this.log('Erro Pix', err);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao validar Pix' });
            }
        });
    }

    testarRateios() {
        if (!this.idParcelaRateio) return;
        this.log('Buscando Rateios:', this.idParcelaRateio);
        this.service.obterRateiosDiagnostico(this.empresaId, this.idParcelaRateio).subscribe({
            next: (res) => {
                this.log('Resultado Rateios', res);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Rateios obtidos' });
            },
            error: (err) => {
                this.log('Erro Rateios', err);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao buscar rateios' });
            }
        });
    }

    testarRenegociacao() {
        if (!this.renegIdAntiga || !this.renegIdNova) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha os IDs das parcelas' });
            return;
        }
        try {
            const body = JSON.parse(this.renegJson);
            this.log('Renegociando...', body);
            this.service.renegociar(this.empresaId, this.renegIdAntiga, this.renegIdNova, body).subscribe({
                next: (res) => {
                    this.log('Sucesso Renegociação', res);
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Renegociação concluída' });
                },
                error: (err) => {
                    this.log('Erro Renegociação', err);
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha na renegociação' });
                }
            });
        } catch (e) {
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'JSON Inválido' });
        }
    }
}
