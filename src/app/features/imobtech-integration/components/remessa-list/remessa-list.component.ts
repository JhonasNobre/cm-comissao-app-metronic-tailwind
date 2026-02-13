import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ImobtechRemessaService } from '../../services/imobtech-remessa.service';
import { RemessaDto, ObterRemessaResponse } from '../../models/imobtech-remessa.model';
import { GenericPTableComponent } from '../../../../shared/components/ui/generic-p-table/generic-p-table.component';
import { ColumnHeader } from '../../../../shared/models/column-header.model';
import { CriarRemessaFormComponent } from '../criar-remessa-form/criar-remessa-form.component';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'app-remessa-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        GenericPTableComponent,
        DialogModule,
        ButtonModule,
        InputTextModule,
        TooltipModule,
        CriarRemessaFormComponent,
        ToastModule,
        ConfirmDialogComponent
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './remessa-list.component.html'
})
export class RemessaListComponent implements OnInit {
    private remessaService = inject(ImobtechRemessaService);
    private router = inject(Router);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    @ViewChild(CriarRemessaFormComponent) criarRemessaForm!: CriarRemessaFormComponent;

    remessas: RemessaDto[] = [];
    loading: boolean = true;
    columns: ColumnHeader<RemessaDto>[] = [];

    // Modal states
    detailVisible: boolean = false;
    createVisible: boolean = false;
    reprogramarVisible: boolean = false;
    selectedRemessa: ObterRemessaResponse | null = null;
    loadingDetails: boolean = false;

    // Reprogramar state
    idParcelaInput: number = 0;
    novaDataVencimento: string = '';
    reprogramandoLoading: boolean = false;

    ngOnInit(): void {
        this.initializeColumns();
        this.loadRemessas();
    }

    private initializeColumns(): void {
        this.columns = [
            { field: 'idVendaInterna', header: 'ID Venda', sortable: true },
            { field: 'imobtechRemessaId', header: 'Imobtech ID', sortable: true },
            {
                field: 'statusDescricao',
                header: 'Status',
                displayAs: 'badge',
                badgeSeverityMap: {
                    'Pendente': 'secondary',
                    'Processando': 'warning',
                    'Sucesso': 'success',
                    'Erro': 'danger',
                    'Cancelado': 'secondary'
                }
            },
            { field: 'dataEnvio', header: 'Data Envio', displayAs: 'date', pipe: 'date', pipeArgs: 'dd/MM/yyyy HH:mm' },
            { field: 'tentativasReprocessamento', header: 'Tentativas' }
        ];
    }

    private loadRemessas(): void {
        this.loading = true;
        this.remessaService.listarRemessas('', 1, 100).subscribe({
            next: (response) => {
                this.remessas = response.data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading remessas', err);
                this.loading = false;
            }
        });
    }

    onViewDetails(remessa: RemessaDto): void {
        console.log('Abrindo detalhes para a remessa:', remessa);
        this.loadingDetails = true;
        this.detailVisible = true;

        this.remessaService.obterRemessa(remessa.id).subscribe({
            next: (details) => {
                this.selectedRemessa = details;
                this.loadingDetails = false;
            },
            error: (err) => {
                console.error('Erro ao carregar detalhes:', err);
                this.loadingDetails = false;
                this.detailVisible = false;
            }
        });
    }

    onAdd(): void {
        this.criarRemessaForm.abrir();
    }

    closeDetailModal(): void {
        this.detailVisible = false;
        this.selectedRemessa = null;
    }

    closeCreateModal(): void {
        this.createVisible = false;
    }

    getStatusSeverity(status: string): string {
        const severityMap: { [key: string]: string } = {
            'Pendente': 'secondary',
            'Processando': 'warning',
            'Sucesso': 'success',
            'Erro': 'danger',
            'Cancelado': 'secondary'
        };
        return severityMap[status] || 'secondary';
    }

    reprocessar(remessaId: string): void {
        this.confirmationService.confirm({
            message: 'Deseja realmente reprocessar esta remessa?',
            header: 'Confirmar Reprocessamento',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.loading = true;
                this.remessaService.reprocessarRemessa(remessaId).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Remessa enfileirada para reprocessamento com sucesso!' });
                        this.closeDetailModal();
                        this.loadRemessas(); // Recarrega a lista
                        this.loading = false;
                    },
                    error: (err) => {
                        console.error('Erro ao reprocessar:', err);
                        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao reprocessar: ' + (err.error?.message || err.message) });
                        this.loading = false;
                    }
                });
            }
        });
    }

    abrirReprogramar(): void {
        this.reprogramarVisible = true;
        this.idParcelaInput = 0;
        this.novaDataVencimento = '';
    }

    fecharReprogramar(): void {
        this.reprogramarVisible = false;
        this.idParcelaInput = 0;
        this.novaDataVencimento = '';
    }

    confirmarReprogramar(): void {
        if (!this.idParcelaInput || !this.novaDataVencimento) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha todos os campos' });
            return;
        }

        this.confirmationService.confirm({
            message: `Reprogramar vencimento da parcela ${this.idParcelaInput} para ${this.novaDataVencimento}?`,
            header: 'Confirmar Reprogramação',
            icon: 'pi pi-calendar',
            accept: () => {
                this.reprogramandoLoading = true;
                this.remessaService.reprogramarVencimento({
                    idParcelaInterna: this.idParcelaInput,
                    novaDataVencimento: this.novaDataVencimento
                }).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Vencimento reprogramado com sucesso!' });
                        this.fecharReprogramar();
                        this.reprogramandoLoading = false;
                    },
                    error: (err) => {
                        console.error('Erro ao reprogramar:', err);
                        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao reprogramar: ' + (err.error?.message || err.message) });
                        this.reprogramandoLoading = false;
                    }
                });
            }
        });
    }

    excluir(remessa: RemessaDto): void {
        this.confirmationService.confirm({
            message: `Tem certeza que deseja excluir esta remessa (Venda #${remessa.idVendaInterna})? Esta ação não pode ser desfeita.`,
            header: 'Confirmar Exclusão',
            icon: 'pi pi-trash',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.loading = true;
                this.remessaService.excluirRemessa(remessa.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Remessa excluída com sucesso!' });
                        this.loadRemessas();
                    },
                    error: (err) => {
                        console.error('Erro ao excluir:', err);
                        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir: ' + (err.error?.message || err.message) });
                        this.loading = false;
                    }
                });
            }
        });
    }

    cancelar(remessa: RemessaDto): void {
        this.confirmationService.confirm({
            message: `Tem certeza que deseja CANCELAR esta remessa na Imobtech (ID ${remessa.imobtechRemessaId})? O pagamento será estornado/cancelado.`,
            header: 'Confirmar Cancelamento',
            icon: 'pi pi-ban',
            acceptButtonStyleClass: 'p-button-warning',
            accept: () => {
                this.loading = true;
                // TODO: Pegar o ID da empresa do contexto ou do usuário logado
                // Por enquanto, vamos assumir que o backend resolve ou passamos um fixo se necessário, 
                // mas o ideal é o backend pegar do token. O endpoint pede empresaId na query string.
                // Vamos tentar pegar do próprio objeto remessa se TIVESSE empresaId, mas o DTO não tem.
                // Vamos passar um valor dummy ou pegar do auth service se disponível. 
                // Assumindo que o usuário está no contexto da empresa correta.

                // HACK: Para teste rápido, vamos tentar sem o parametro ou ver se o backend pega do token.
                // O endpoint pede `[FromQuery] Guid empresaId`.
                // Vamos pegar o primeiro ID de empresa disponível ou do localstorage se houver.
                const empresaId = localStorage.getItem('empresaId') || 'd62f29d2-72a2-4281-9081-8b9cad0e1f20'; // ID de teste

                this.remessaService.cancelarRemessa(remessa.id, empresaId).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Cancelamento solicitado com sucesso!' });
                        this.loadRemessas();
                    },
                    error: (err) => {
                        console.error('Erro ao cancelar:', err);
                        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao cancelar: ' + (err.error?.message || err.message) });
                        this.loading = false;
                    }
                });
            }
        });
    }

    testarRateios(): void {
        if (!this.selectedRemessa || !this.selectedRemessa.idVendaInterna) return;

        // No momento usamos o ID da venda interna como surrogate para o ID da parcela se não houver um mapeamento direto
        // O ideal é a remessa ter os IDs das parcelas. 
        // Vamos usar o endpoint de diagnóstico para logar os rateios por enquanto.
        this.loadingDetails = true;
        const empresaId = localStorage.getItem('empresaId') || 'd62f29d2-72a2-4281-9081-8b9cad0e1f20';

        this.remessaService.obterRateiosDiagnostico(empresaId, this.selectedRemessa.idVendaInterna).subscribe({
            next: (res) => {
                console.log('Rateios da Remessa:', res);
                this.messageService.add({
                    severity: 'info',
                    summary: 'Rateios (Log)',
                    detail: 'Extrato de rateios enviado para o console do navegador.'
                });
                this.loadingDetails = false;
            },
            error: (err) => {
                console.error('Erro ao buscar rateios:', err);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao buscar rateios' });
                this.loadingDetails = false;
            }
        });
    }
}
