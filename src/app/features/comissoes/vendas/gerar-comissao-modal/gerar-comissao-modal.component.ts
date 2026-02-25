import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

import { VendaImportada } from '../../models/venda-importada.model';
import { ComissaoService } from '../../services/comissao.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-gerar-comissao-modal',
    standalone: true,
    imports: [
        CommonModule,
        DialogModule,
        ButtonModule
    ],
    templateUrl: './gerar-comissao-modal.component.html',
    styleUrl: './gerar-comissao-modal.component.scss'
})
export class GerarComissaoModalComponent {
    private comissaoService = inject(ComissaoService);
    private authService = inject(AuthService);
    private messageService = inject(MessageService);

    @Input() visible = false;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Input() venda: VendaImportada | null = null;
    @Output() onGerada = new EventEmitter<void>();

    saving = false;

    get semEstruturaVinculada(): boolean {
        return !!this.venda && !this.venda.idEstruturaComissao;
    }

    close() {
        this.visible = false;
        this.visibleChange.emit(false);
    }

    confirmar() {
        if (!this.venda) return;

        if (!this.venda.idEstruturaComissao) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Atenção',
                detail: 'Esta venda não possui uma estrutura de comissão vinculada. Use a opção "Vincular Estrutura" antes de gerar a comissão.'
            });
            return;
        }

        this.saving = true;
        const currentUser = this.authService.currentUserValue;

        if (!currentUser) {
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Usuário não autenticado' });
            this.saving = false;
            return;
        }

        const command = {
            idVendaImportada: this.venda.id,
            usuarioId: currentUser.id
        };

        this.comissaoService.gerar(command).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Comissão gerada com sucesso!' });
                this.onGerada.emit();
                this.close();
                this.saving = false;
            },
            error: (err) => {
                const mensagem = err?.error?.errors?.[0] || 'Erro ao gerar comissão.';
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: mensagem });
                this.saving = false;
            }
        });
    }
}
