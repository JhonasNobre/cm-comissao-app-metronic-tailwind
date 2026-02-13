import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UauIntegrationService } from '../../services/uau-integration.service';
import { EmpresaSelectorService } from '../../../../core/services/empresa-selector.service';

// PrimeNG
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-uau-diagnostic',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ToastModule,
        ButtonModule
    ],
    providers: [MessageService],
    templateUrl: './uau-diagnostic.component.html'
})
export class UauDiagnosticComponent implements OnInit {
    empresaId: string = '';
    logs: string[] = [];
    isImporting: boolean = false;
    isTesting: boolean = false;

    constructor(
        private service: UauIntegrationService,
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
        _logger.debug(`[UAU-LAB] ${msg}`, data);
    }

    limparLogs() {
        this.logs = [];
    }

    testarConexao() {
        this.isTesting = true;
        this.log('Iniciando teste de conexão com UAU...');
        this.service.testarConexao().subscribe({
            next: () => {
                this.isTesting = false;
                this.log('Sucesso: Conexão com UAU estabelecida com sucesso!');
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Conexão estabelecida' });
            },
            error: (err) => {
                this.isTesting = false;
                this.log('Erro ao testar conexão UAU:', err);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha na conexão com UAU' });
            }
        });
    }

    importarEstruturas() {
        this.isImporting = true;
        this.log('Iniciando importação de estruturas de comissão do UAU...');
        this.service.importarEstrutura().subscribe({
            next: () => {
                this.isImporting = false;
                this.log('Sucesso: Importação de estruturas concluída.');
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Estruturas importadas' });
            },
            error: (err) => {
                this.isImporting = false;
                this.log('Erro ao importar estruturas UAU:', err);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha na importação de estruturas' });
            }
        });
    }
}

// Mock do logger para evitar erros de compilação se não houver um global
const _logger = {
    debug: (msg: string, data?: any) => console.log(msg, data)
};
