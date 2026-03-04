import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { MessageService } from 'primeng/api';
import { ComissaoService } from '../services/comissao.service';
import { EStatusParcela, ParcelaComissaoGridDto } from '../models/comissao.model';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { ImobtechRemessaService } from '../../imobtech-integration/services/imobtech-remessa.service';
import { ObterRemessaResponse, StatusRemessaImobtech } from '../../imobtech-integration/models/imobtech-remessa.model';

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
    ToastModule,
    MenuModule
  ],
  providers: [MessageService],
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

  // Seleção em massa
  selectedParcelas: ParcelaComissaoGridDto[] = [];

  // Menu de ações — instância única fora da tabela
  menuItens: MenuItem[] = [];

  // Modals
  parcelaSelecionada?: ParcelaComissaoGridDto;
  displayLiberacaoDialog = false;
  displayLiberacaoMassaDialog = false;
  displayBloqueioDialog = false;
  displayCancelamentoDialog = false;

  // Remessa Imobtech
  displayRemessaDialog = false;
  loadingRemessa = false;
  remessa: ObterRemessaResponse | null = null;
  StatusRemessaImobtech = StatusRemessaImobtech;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private imobtechRemessaService = inject(ImobtechRemessaService);

  constructor(
    private comissaoService: ComissaoService,
    private messageService: MessageService,
  ) {
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
      error: () => {
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

  // ─── Helpers de Status (API retorna string via JsonStringEnumConverter) ──────

  /** Normaliza statusParcela para o nome da enum, independente de vir como
   *  número (ex: 1) ou string (ex: "Pendente") da API. */
  private parseStatus(status: any): string {
    if (typeof status === 'string') return status;
    return EStatusParcela[status as number] ?? '';
  }

  isPendente(status: any): boolean {
    return this.parseStatus(status) === 'Pendente';
  }

  // ─── Menu de Ações ────────────────────────────────────────────────────────────

  /** Chamado pelo botão "..." de cada linha — monta o menu e o abre */
  abrirMenu(event: Event, parcela: ParcelaComissaoGridDto, menu: any) {
    const status = this.parseStatus(parcela.statusParcela);
    const bloqueada = status === 'Bloqueada';
    const encerrada = status === 'Paga' || status === 'Cancelada';

    this.menuItens = [
      {
        label: 'Ver detalhes',
        icon: 'pi pi-eye',
        command: () => this.verDetalhes(parcela)
      },
      {
        label: 'Ver remessa',
        icon: 'pi pi-send',
        disabled: status === 'Pendente',
        command: () => this.verRemessa(parcela)
      },
      {
        label: 'Bloquear Comissão',
        icon: 'pi pi-lock',
        disabled: bloqueada || encerrada,
        command: () => this.abrirBloqueio(parcela)
      },
      {
        label: 'Liberar Comissão',
        icon: 'pi pi-unlock',
        disabled: encerrada,
        command: () => this.abrirLiberacao(parcela)
      },
      {
        label: 'Cancelar Comissão',
        icon: 'pi pi-ban',
        styleClass: 'text-red-500',
        disabled: encerrada,
        command: () => this.abrirCancelamento(parcela)
      }
    ];

    menu.toggle(event);
  }

  verDetalhes(parcela: ParcelaComissaoGridDto) {
    this.router.navigate(['/comissoes/detalhes', parcela.idComissao]);
  }

  // ─── Remessa Imobtech ─────────────────────────────────────────────────────────

  verRemessa(parcela: ParcelaComissaoGridDto) {
    this.displayRemessaDialog = true;
    this.loadingRemessa = true;
    this.remessa = null;

    this.imobtechRemessaService.obterRemessaPorParcelaId(parcela.id).subscribe({
      next: (res) => {
        this.remessa = res ?? null;
        this.loadingRemessa = false;
      },
      error: () => {
        this.remessa = null;
        this.loadingRemessa = false;
      }
    });
  }

  getRemessaStatusLabel(status: StatusRemessaImobtech): string {
    switch (status) {
      case StatusRemessaImobtech.Pendente: return 'Pendente';
      case StatusRemessaImobtech.PendenteProcessamento: return 'Aguardando Processamento';
      case StatusRemessaImobtech.Processado: return 'Processado';
      case StatusRemessaImobtech.Erro: return 'Erro';
      case StatusRemessaImobtech.Cancelado: return 'Cancelado';
      default: return 'Desconhecido';
    }
  }

  getRemessaStatusSeverity(status: StatusRemessaImobtech): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case StatusRemessaImobtech.Processado: return 'success';
      case StatusRemessaImobtech.PendenteProcessamento: return 'info';
      case StatusRemessaImobtech.Pendente: return 'warn';
      case StatusRemessaImobtech.Erro: return 'danger';
      case StatusRemessaImobtech.Cancelado: return 'secondary';
      default: return 'secondary';
    }
  }

  // ─── Liberação Individual ─────────────────────────────────────────────────────

  abrirLiberacao(parcela: ParcelaComissaoGridDto) {
    this.parcelaSelecionada = parcela;
    this.displayLiberacaoDialog = true;
  }

  confirmarLiberacao() {
    if (!this.parcelaSelecionada) return;
    this.comissaoService.liberarComissaoImobtech(
      this.parcelaSelecionada.idComissao,
      { idParcela: this.parcelaSelecionada.id, clienteQuitouAntecipado: false }
    ).subscribe({
      next: (res) => {
        const severity = res.status === 'ENVIADO_IMOBTECH' ? 'success' : (res.status === 'ERRO_ENVIO' ? 'warn' : 'info');
        this.messageService.add({
          severity,
          summary: res.status === 'ENVIADO_IMOBTECH' ? 'Sucesso' : 'Atenção',
          detail: res.mensagem,
          life: 6000
        });
        this.displayLiberacaoDialog = false;
        this.dt.reset();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao liberar comissão e enviar à Imobtech.' })
    });
  }

  // ─── Liberação em Massa ───────────────────────────────────────────────────────

  liberarSelecionadas() {
    if (!this.selectedParcelas.length) return;
    this.displayLiberacaoMassaDialog = true;
  }

  confirmarLiberacaoMassa() {
    // Iterar por parcela individual, enviando idParcela em cada chamada
    // para que o backend valide apenas o beneficiário daquela parcela
    const total = this.selectedParcelas.length;
    let completed = 0;
    let errors = 0;

    this.selectedParcelas.forEach(parcela => {
      this.comissaoService.liberarComissaoImobtech(parcela.idComissao, {
        idParcela: parcela.id,
        clienteQuitouAntecipado: false
      }).subscribe({
        next: (res) => {
          completed++;
          const severity = res.status === 'ENVIADO_IMOBTECH' ? 'success' : (res.status === 'ERRO_ENVIO' ? 'warn' : 'info');
          this.messageService.add({
            severity,
            summary: res.status === 'ENVIADO_IMOBTECH' ? 'Sucesso' : 'Atenção',
            detail: res.mensagem,
            life: 6000
          });
          if (completed + errors === total) {
            this.displayLiberacaoMassaDialog = false;
            this.selectedParcelas = [];
            this.dt.reset();
          }
        },
        error: () => {
          errors++;
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: `Erro ao liberar parcela ${parcela.id.substring(0, 8)}...` });
          if (completed + errors === total) {
            this.displayLiberacaoMassaDialog = false;
            this.selectedParcelas = [];
            this.dt.reset();
          }
        }
      });
    });
  }

  // ─── Bloqueio ─────────────────────────────────────────────────────────────────

  abrirBloqueio(parcela: ParcelaComissaoGridDto) {
    this.parcelaSelecionada = parcela;
    this.displayBloqueioDialog = true;
  }

  confirmarBloqueio() {
    if (!this.parcelaSelecionada) return;
    this.comissaoService.bloquearParcela(this.parcelaSelecionada.id, this.parcelaSelecionada.idComissao, '').subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'A comissão foi bloqueada.' });
        this.displayBloqueioDialog = false;
        this.dt.reset();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao bloquear comissão.' })
    });
  }

  // ─── Cancelamento ─────────────────────────────────────────────────────────────

  abrirCancelamento(parcela: ParcelaComissaoGridDto) {
    this.parcelaSelecionada = parcela;
    this.displayCancelamentoDialog = true;
  }

  confirmarCancelamento() {
    if (!this.parcelaSelecionada) return;
    this.comissaoService.cancelarComissao(this.parcelaSelecionada.idComissao, '', 'current-user-id').subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'A comissão foi cancelada.' });
        this.displayCancelamentoDialog = false;
        this.dt.reset();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao cancelar comissão.' })
    });
  }

  // ─── Helpers de Status ────────────────────────────────────────────────────────

  getStatusSeverity(status: any): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    switch (this.parseStatus(status)) {
      case 'Pendente': return 'secondary';
      case 'Liberada': return 'success';   // Verde
      case 'Paga': return 'success';
      case 'Cancelada': return 'warn';      // Amarelo
      case 'Bloqueada': return 'danger';    // Vermelho
      default: return 'secondary';
    }
  }

  getStatusLabel(status: any): string {
    switch (this.parseStatus(status)) {
      case 'Pendente': return 'Pendente';
      case 'Liberada': return 'Liberado';
      case 'Paga': return 'Pago';
      case 'Cancelada': return 'Cancelado';
      case 'Bloqueada': return 'Bloqueado';
      default: return 'Pendente';
    }
  }
}
