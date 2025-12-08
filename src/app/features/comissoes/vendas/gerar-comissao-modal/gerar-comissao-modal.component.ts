import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

import { VendaImportada } from '../../models/venda-importada.model';
import { EstruturaComissaoService } from '../../services/estrutura-comissao.service';
import { ComissaoService } from '../../services/comissao.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-gerar-comissao-modal',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DialogModule,
        ButtonModule,
        SelectModule
    ],
    templateUrl: './gerar-comissao-modal.component.html',
    styleUrl: './gerar-comissao-modal.component.scss'
})
export class GerarComissaoModalComponent implements OnInit {
    private estruturaService = inject(EstruturaComissaoService);
    private comissaoService = inject(ComissaoService);
    private authService = inject(AuthService);
    private messageService = inject(MessageService);

    @Input() visible = false;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Input() venda: VendaImportada | null = null;
    @Output() onGerada = new EventEmitter<void>();

    estruturas: any[] = [];
    selectedEstrutura: string | null = null;
    loading = false;
    saving = false;

    ngOnInit() {
        this.loadEstruturas();
    }

    loadEstruturas() {
        this.loading = true;
        // Busca estruturas ativas
        this.estruturaService.getAll({ ativo: true, pagina: 1, tamanhoPagina: 100 }).subscribe({
            next: (result) => {
                this.estruturas = result.items.map(e => ({ label: e.nome, value: e.id }));
                this.loading = false;
            },
            error: () => this.loading = false
        });
    }

    close() {
        this.visible = false;
        this.visibleChange.emit(false);
        this.selectedEstrutura = null;
    }

    confirmar() {
        if (!this.venda || !this.selectedEstrutura) return;

        this.saving = true;
        const currentUser = this.authService.currentUserValue;

        if (!currentUser) {
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Usuário não autenticado' });
            this.saving = false;
            return;
        }

        const command = {
            idVendaImportada: this.venda.id,
            idEstruturaComissao: this.selectedEstrutura,
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
                console.error(err);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao gerar comissão.' });
                this.saving = false;
            }
        });
    }
}
