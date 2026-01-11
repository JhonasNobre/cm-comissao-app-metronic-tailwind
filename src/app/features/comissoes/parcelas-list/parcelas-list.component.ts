import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ComissaoService } from '../services/comissao.service';
import { EStatusParcela, ParcelaComissaoGridDto } from '../models/comissao.model';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-parcelas-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DatePickerModule,
    SelectModule,
    TagModule,
    TooltipModule,
    DialogModule,
    TextareaModule,
    ToastModule,
    ConfirmDialogModule,
    MenuModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './parcelas-list.component.html',
  styleUrl: './parcelas-list.component.scss'
})
export class ParcelasListComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  parcelas: ParcelaComissaoGridDto[] = [];
  totalRecords = 0;
  loading = false;

  // Filtros
  filtroDataInicio?: Date;
  filtroDataFim?: Date;
  filtroTermo: string = '';
  termoBuscaUpdate = new Subject<string>();

  filtroStatusParcela?: EStatusParcela;
  statusParcelaOptions = [
    { label: 'Pendente', value: EStatusParcela.Pendente },
    { label: 'Liberada', value: EStatusParcela.Liberada },
    { label: 'Paga', value: EStatusParcela.Paga },
    { label: 'Cancelada', value: EStatusParcela.Cancelada },
    { label: 'Bloqueada', value: EStatusParcela.Bloqueada }
  ];

  filtroStatusPagamento?: string;
  statusPagamentoOptions = [
    { label: 'Atrasado', value: 'Atrasado' },
    { label: 'Recebido', value: 'Recebido' },
    { label: 'A receber', value: 'A receber' }
  ];

  // Ações
  displayBloqueioDialog = false;
  motivoBloqueio = '';
  parcelaSelecionada?: ParcelaComissaoGridDto;

  displayCancelamentoDialog = false;
  motivoCancelamento = '';

  selectedParcelas: ParcelaComissaoGridDto[] = [];

  private route = inject(ActivatedRoute);

  constructor(
    private comissaoService: ComissaoService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    // Debounce busca
    this.termoBuscaUpdate.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.dt.reset();
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['dataInicio']) {
        this.filtroDataInicio = new Date(params['dataInicio']);
      }
      if (params['dataFim']) {
        this.filtroDataFim = new Date(params['dataFim']);
      }

      // Se tiver filtros na URL, a tabela vai carregar automaticamente via lazyLoad?
      // O lazyLoad é disparado pelo p-table na inicialização.
      // Apenas garantimos que os filtros estejam preenchidos antes disso.
    });
  }

  loadParcelas(event: any) {
    this.loading = true;
    const page = (event.first / event.rows) + 1;
    const size = event.rows;

    const filtros: any = {
      pagina: page,
      tamanhoPagina: size,
      termoBusca: this.filtroTermo,
      statusParcela: this.filtroStatusParcela,
      statusPagamento: this.filtroStatusPagamento,
      dataInicio: this.filtroDataInicio?.toISOString(),
      dataFim: this.filtroDataFim?.toISOString()
    };

    this.comissaoService.getParcelasPaginado(filtros).subscribe({
      next: (res) => {
        this.parcelas = res.items;
        this.totalRecords = res.totalItems;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar parcelas' });
      }
    });
  }

  onFilterChange() {
    this.dt.reset();
  }

  onTermoBuscaChange(valor: string) {
    this.termoBuscaUpdate.next(valor);
  }

  // Ações Menu
  getActions(parcela: ParcelaComissaoGridDto): MenuItem[] {
    const actions: MenuItem[] = [];

    // Bloquear
    if (parcela.statusParcela !== EStatusParcela.Bloqueada &&
      parcela.statusParcela !== EStatusParcela.Paga &&
      parcela.statusParcela !== EStatusParcela.Cancelada) {
      actions.push({
        label: 'Bloquear Parcela',
        icon: 'pi pi-lock',
        styleClass: 'text-red-500',
        command: () => this.abrirBloqueio(parcela)
      });
    }

    // Desbloquear
    if (parcela.statusParcela === EStatusParcela.Bloqueada) {
      actions.push({
        label: 'Desbloquear Parcela',
        icon: 'pi pi-unlock',
        styleClass: 'text-green-500',
        command: () => this.desbloquear(parcela)
      });
    }

    // Cancelar
    actions.push({
      label: 'Cancelar Comissão',
      icon: 'pi pi-ban',
      command: () => this.abrirCancelamento(parcela)
    });

    return actions;
  }

  // Bloqueio
  abrirBloqueio(parcela: ParcelaComissaoGridDto) {
    this.parcelaSelecionada = parcela;
    this.motivoBloqueio = '';
    this.displayBloqueioDialog = true;
  }

  confirmarBloqueio() {
    if (!this.parcelaSelecionada || !this.motivoBloqueio) return;

    this.comissaoService.bloquearParcela(this.parcelaSelecionada.id, this.parcelaSelecionada.idComissao, this.motivoBloqueio).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Parcela bloqueada com sucesso' });
        this.displayBloqueioDialog = false;
        this.dt.reset(); // Recarrega
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao bloquear parcela' });
      }
    });
  }

  // Desbloqueio
  desbloquear(parcela: ParcelaComissaoGridDto) {
    this.confirmationService.confirm({
      message: 'Tem certeza que deseja desbloquear esta parcela?',
      header: 'Confirmar Desbloqueio',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.comissaoService.desbloquearParcela(parcela.id, parcela.idComissao).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Parcela desbloqueada com sucesso' });
            this.dt.reset();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao desbloquear parcela' })
        });
      }
    });
  }

  // Liberação em Massa
  liberarSelecionadas() {
    if (!this.selectedParcelas.length) return;

    const ids = this.selectedParcelas.map(p => p.id);

    this.confirmationService.confirm({
      message: `Tem certeza que deseja liberar ${ids.length} parcelas selecionadas?`,
      header: 'Confirmar Liberação em Massa',
      icon: 'pi pi-check-circle',
      accept: () => {
        this.comissaoService.liberarParcelasEmMassa(ids, 'current-user-id').subscribe({ // TODO: Get User ID from AuthService
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Parcelas liberadas com sucesso' });
            this.selectedParcelas = [];
            this.dt.reset();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao liberar parcelas' })
        });
      }
    });
  }

  // Cancelar Comissão
  abrirCancelamento(parcela: ParcelaComissaoGridDto) {
    this.parcelaSelecionada = parcela;
    this.motivoCancelamento = '';
    this.displayCancelamentoDialog = true;
  }

  confirmarCancelamento() {
    if (!this.parcelaSelecionada || !this.motivoCancelamento) return;

    this.confirmationService.confirm({
      message: 'Isso cancelará TODA a comissão vinculada a esta parcela. Deseja continuar?',
      header: 'ATENÇÃO: Cancelar Comissão',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.comissaoService.cancelarComissao(this.parcelaSelecionada!.idComissao, this.motivoCancelamento, 'current-user-id').subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Comissão cancelada com sucesso' });
            this.displayCancelamentoDialog = false;
            this.dt.reset();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao cancelar comissão' })
        });
      }
    });
  }

  getStatusSeverity(status: EStatusParcela): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    switch (status) {
      case EStatusParcela.Pendente: return 'warn';
      case EStatusParcela.Liberada: return 'info';
      case EStatusParcela.Paga: return 'success';
      case EStatusParcela.Cancelada: return 'danger';
      case EStatusParcela.Bloqueada: return 'danger';
      default: return 'secondary';
    }
  }

  getStatusLabel(status: EStatusParcela): string {
    switch (status) {
      case EStatusParcela.Pendente: return 'Pendente';
      case EStatusParcela.Liberada: return 'Liberada';
      case EStatusParcela.Paga: return 'Paga';
      case EStatusParcela.Cancelada: return 'Cancelada';
      case EStatusParcela.Bloqueada: return 'Bloqueada';
      default: return 'Desconhecido';
    }
  }
}
