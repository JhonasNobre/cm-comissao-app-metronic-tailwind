import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FormsModule } from '@angular/forms';

import { ComissaoService } from '../services/comissao.service';
import { Comissao, EStatusComissao, EStatusParcela } from '../models/comissao.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-comissao-detalhes',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        CardModule,
        TableModule,
        TagModule,
        DividerModule,
        ConfirmDialogModule,
        ToastModule,
        DialogModule,
        TextareaModule,
        TooltipModule,
        FormsModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './comissao-detalhes.component.html',
    styleUrl: './comissao-detalhes.component.scss'
})
export class ComissaoDetalhesComponent implements OnInit {
    private comissaoService = inject(ComissaoService);
    private authService = inject(AuthService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    comissao: Comissao | null = null;
    loading = false;

    // Controles de Rejeição
    rejeicaoVisible = false;
    motivoRejeicao = '';
    saving = false;

    // Enums
    EStatusComissao = EStatusComissao;
    EStatusParcela = EStatusParcela;

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.loadDetalhes(id);
            }
        });
    }

    loadDetalhes(id: string) {
        this.loading = true;
        this.comissaoService.getById(id).subscribe({
            next: (data) => {
                this.comissao = data;
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar detalhes da comissão' });
                this.loading = false;
            }
        });
    }

    getStatusSeverity(status: EStatusComissao): 'success' | 'info' | 'warn' | 'danger' | undefined {
        switch (status) {
            case EStatusComissao.Pendente: return 'warn';
            case EStatusComissao.Aprovada: return 'success';
            case EStatusComissao.Rejeitada: return 'danger';
            case EStatusComissao.Paga: return 'info';
            default: return undefined;
        }
    }

    getStatusLabel(status: EStatusComissao): string {
        switch (status) {
            case EStatusComissao.Pendente: return 'Pendente';
            case EStatusComissao.Aprovada: return 'Aprovada';
            case EStatusComissao.Rejeitada: return 'Rejeitada';
            case EStatusComissao.Paga: return 'Paga';
            default: return 'Desconhecido';
        }
    }

    getHeader() {
        if (!this.comissao) return '';
        return `Comissão - ${this.comissao.nomeEstrutura}`;
    }

    voltar() {
        this.router.navigate(['/comissoes/lista']);
    }

    aprovar() {
        if (!this.comissao) return;

        this.confirmationService.confirm({
            message: 'Tem certeza que deseja aprovar esta comissão?',
            header: 'Aprovação',
            icon: 'pi pi-check',
            accept: () => {
                this.saving = true;
                const currentUser = this.authService.currentUserValue;
                if (!currentUser) return;

                this.comissaoService.aprovar(this.comissao!.id, currentUser.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Comissão aprovada!' });
                        this.loadDetalhes(this.comissao!.id);
                        this.saving = false;
                    },
                    error: (err) => {
                        console.error(err);
                        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao aprovar' });
                        this.saving = false;
                    }
                });
            }
        });
    }

    rejeitar() {
        this.motivoRejeicao = '';
        this.rejeicaoVisible = true;
    }

    print() {
        window.print();
    }


    confirmarRejeicao() {
        if (!this.comissao || !this.motivoRejeicao) return;

        this.saving = true;
        const currentUser = this.authService.currentUserValue;
        if (!currentUser) return;

        this.comissaoService.rejeitar(this.comissao.id, currentUser.id, this.motivoRejeicao).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Comissão rejeitada!' });
                this.rejeicaoVisible = false;
                this.loadDetalhes(this.comissao!.id);
                this.saving = false;
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao rejeitar' });
                this.saving = false;
            }
        });
    }

    liberarParcela(parcela: any) {
        this.confirmationService.confirm({
            message: `Confirma a liberação manual da parcela ${parcela.numeroParcela}?`,
            header: 'Liberar Parcela',
            icon: 'pi pi-check-circle',
            accept: () => {
                const currentUser = this.authService.currentUserValue;
                if (!currentUser || !this.comissao) return;

                this.comissaoService.liberarParcelaManual(this.comissao.id, parcela.id, currentUser.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Parcela liberada!' });
                        this.loadDetalhes(this.comissao!.id);
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
