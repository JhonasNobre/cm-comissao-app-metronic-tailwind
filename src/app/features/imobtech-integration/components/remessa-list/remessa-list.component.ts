import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ImobtechRemessaService } from '../../services/imobtech-remessa.service';
import { RemessaDto, ObterRemessaResponse } from '../../models/imobtech-remessa.model';
import { GenericPTableComponent } from '../../../../shared/components/ui/generic-p-table/generic-p-table.component';
import { ColumnHeader } from '../../../../shared/models/column-header.model';
import { CriarRemessaFormComponent } from '../criar-remessa-form/criar-remessa-form.component';

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
        CriarRemessaFormComponent
    ],
    templateUrl: './remessa-list.component.html'
})
export class RemessaListComponent implements OnInit {
    private remessaService = inject(ImobtechRemessaService);
    private router = inject(Router);

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
        if (!confirm('Deseja realmente reprocessar esta remessa?')) {
            return;
        }

        this.loading = true;
        this.remessaService.reprocessarRemessa(remessaId).subscribe({
            next: () => {
                alert('Remessa enfileirada para reprocessamento com sucesso!');
                this.closeDetailModal();
                this.loadRemessas(); // Recarrega a lista
                this.loading = false;
            },
            error: (err) => {
                console.error('Erro ao reprocessar:', err);
                alert('Erro ao reprocessar: ' + (err.error?.message || err.message));
                this.loading = false;
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
            alert('Preencha todos os campos');
            return;
        }

        if (!confirm(`Reprogramar vencimento da parcela ${this.idParcelaInput} para ${this.novaDataVencimento}?`)) {
            return;
        }

        this.reprogramandoLoading = true;
        this.remessaService.reprogramarVencimento({
            idParcelaInterna: this.idParcelaInput,
            novaDataVencimento: this.novaDataVencimento
        }).subscribe({
            next: () => {
                alert('Vencimento reprogramado com sucesso!');
                this.fecharReprogramar();
                this.reprogramandoLoading = false;
            },
            error: (err) => {
                console.error('Erro ao reprogramar:', err);
                alert('Erro ao reprogramar: ' + (err.error?.message || err.message));
                this.reprogramandoLoading = false;
            }
        });
    }
}
