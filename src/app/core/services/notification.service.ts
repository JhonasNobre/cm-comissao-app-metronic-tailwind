import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class NotificationService {
    constructor(private messageService: MessageService) { }

    success(detail: string, summary = 'Sucesso') {
        this.messageService.add({ severity: 'success', summary, detail, life: 5000 });
    }
    error(detail: string, summary = 'Erro') {
        this.messageService.add({ severity: 'error', summary, detail, life: 30000 });
    }
    info(detail: string, summary = 'Info') {
        this.messageService.add({ severity: 'info', summary, detail, life: 5000 });
    }
    warn(detail: string, summary = 'Aviso') {
        this.messageService.add({ severity: 'warn', summary, detail, life: 5000 });
    }
}
