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
import { TabsModule } from 'primeng/tabs';
import { BadgeModule } from 'primeng/badge';
import { AccordionModule } from 'primeng/accordion';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FormsModule } from '@angular/forms';

import { ComissaoService } from '../services/comissao.service';
import { Comissao, ComissaoDocumento, EStatusComissao, EStatusParcela } from '../models/comissao.model';
import { AuthService } from '../../../core/services/auth.service';
import { VendaService } from '../../vendas/services/venda.service';
import { VendaImportada } from '../../vendas/models/venda.model';
import { BonificacaoCalculadaService } from '../../bonificacao/bonificacao-calculada/services/bonificacao-calculada.service';
import { BonificacaoCalculada, BonificacaoParcela, ETipoBonificacao, EStatusBonificacao, EStatusParcelaBonificacao } from '../../bonificacao/bonificacao-calculada/models/bonificacao-calculada.model';

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
        TabsModule,
        BadgeModule,
        AccordionModule,
        FormsModule
    ],
    styleUrl: './comissao-detalhes.component.scss',
    templateUrl: './comissao-detalhes.component.html'
})
export class ComissaoDetalhesComponent implements OnInit {
    private comissaoService = inject(ComissaoService);
    private vendaService = inject(VendaService);
    private authService = inject(AuthService);
    private bonificacaoService = inject(BonificacaoCalculadaService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    comissao: Comissao | null = null;
    venda: VendaImportada | null = null;
    loading = false;

    // Controles de Documentos
    documentoDialogVisible = false;
    fileToUpload: File | null = null;
    categoriaSelecionada: number = 1;

    categoriasDocumento = [
        { label: 'Imobiliária', value: 1 },
        { label: 'Clientes', value: 2 },
        { label: 'Corretores', value: 3 },
        { label: 'Outros', value: 0 }
    ];

    // Documentos organizados
    docsPorCategoria: { [key: number]: ComissaoDocumento[] } = {};

    activeTab: string = '0';
    // Controles de Rejeição
    rejeicaoVisible = false;
    motivoRejeicao = '';
    saving = false;

    // Enums
    EStatusComissao = EStatusComissao;
    EStatusParcela = EStatusParcela;
    ETipoBonificacao = ETipoBonificacao;
    EStatusBonificacao = EStatusBonificacao;
    EStatusParcelaBonificacao = EStatusParcelaBonificacao;

    // Bonificações
    bonificacoes: BonificacaoCalculada[] = [];
    loadingBonificacoes = false;
    expandedBonificacoes: { [id: string]: boolean } = {};

    // View Model para Detalhes da Venda
    detalhesDisplay = {
        produto: '',
        imovel: '',
        equipe: '',
        cliente: '',
        corretor: '',
        cidade: '',
        valorVenda: 0,
        valorRecebido: 'R$ 0,00',
        taxaRecebida: '0%'
    };

    // Dados de Pagamento (Cliente -> Incorporadora)
    parcelasPagamento: any[] = [];

    // Dados de Comissão (Incorporadora -> Corretor)
    parcelasComissaoDisplay: any[] = [];
    selectedParcelasComissao: any[] = [];
    totalPercentualParticipantes: number = 0;

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

                // Normalização de Enums
                if (isNaN(Number(this.comissao.status))) {
                    this.comissao.status = (EStatusComissao as any)[this.comissao.status as any];
                }

                if (this.comissao.parcelas) {
                    this.comissao.parcelas.forEach(p => {
                        if (isNaN(Number(p.status))) {
                            p.status = (EStatusParcela as any)[p.status as any];
                        }
                    });
                }

                // Organiza documentos
                this.organizarDocumentos();

                this.prepareDisplayData();

                // Carregar Bonificações da Venda
                this.loadBonificacoes(this.comissao.idVendaImportada);

                // Carregar Venda Associada
                if (this.comissao.idVendaImportada) {
                    this.loadVenda(this.comissao.idVendaImportada);
                } else {
                    this.loading = false;
                }
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar detalhes' });
                this.loading = false;
            }
        });
    }

    loadVenda(id: string) {
        this.vendaService.getById(id).subscribe({
            next: (data) => {
                this.venda = data;

                if (data.parcelasPagamento) {
                    this.parcelasPagamento = data.parcelasPagamento.map((p: any) => ({
                        id: p.nossoNumero || p.id,
                        cliente: data.nomeCliente,
                        valor: p.valor || 0,
                        produto: data.codigoProdutoLegado || 'N/A',
                        imovel: data.imovel || 'N/A',
                        status: p.status || 'Aguardando',
                        dataVencimento: p.dataVencimento
                    }));
                } else {
                    this.parcelasPagamento = [];
                }

                this.prepareDisplayData();
                this.loading = false;
            },
            error: (err) => {
                console.error('Erro ao carregar venda', err);
                this.loading = false;
                this.prepareDisplayData();
            }
        });
    }

    private prepareDisplayData() {
        if (!this.comissao) return;

        const corretorItem = this.comissao.itens?.find(i =>
            i.papelVenda === 1 ||
            i.nomeNivel?.toLowerCase().includes('corretor') ||
            i.nomeNivel?.toLowerCase().includes('vendedor')
        );

        let nomeCorretor = 'Não informado';
        // itemComissao não tem nomeUsuario, mas pode ter em versões estendidas. Se não tiver, usamos ID.
        if (corretorItem) {
            nomeCorretor = (corretorItem as any).nomeUsuario || `ID: ${corretorItem.idUsuario?.substring(0, 8)}...`;
        }

        this.detalhesDisplay = {
            produto: (this.comissao as any).produto || this.comissao.nomeEstrutura || 'Não informado',
            imovel: this.comissao.imovel || (this.venda as any)?.imovel || 'Não informado',
            equipe: this.comissao.equipe || 'Não informado',
            cliente: this.comissao.nomeCliente || (this.venda as any)?.nomeCliente || 'Não informado',
            corretor: nomeCorretor !== 'Não informado' ? nomeCorretor : (this.comissao.corretor || 'Não informado'),
            cidade: this.comissao.cidade || 'Não informado',
            valorVenda: this.comissao.valorVenda,
            valorRecebido: this.comissao.valorComissaoRecebido
                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(this.comissao.valorComissaoRecebido)
                : 'R$ 0,00',
            taxaRecebida: this.comissao.taxaComissaoRecebida
                ? `${this.comissao.taxaComissaoRecebida}%`
                : '0%'
        };

        // Calcula total de percentuais
        // Calcula total de percentuais dos participantes
        this.totalPercentualParticipantes = this.comissao.itens?.reduce((acc, item) => acc + (item.percentualAplicado || 0), 0) || 0;

        if (this.comissao.parcelas) {
            this.parcelasComissaoDisplay = this.comissao.parcelas.map(p => {
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0); // Zerar horas para comparar apenas datas
                const vencimento = p.dataVencimento ? new Date(p.dataVencimento) : null;
                if (vencimento) vencimento.setHours(0, 0, 0, 0);

                let statusPagamento = 'A receber';
                if (p.dataPagamento) {
                    statusPagamento = 'Recebido';
                } else if (vencimento && vencimento < hoje) {
                    statusPagamento = 'Atrasado';
                }

                let statusParcelaLabel = 'Outro';
                switch (p.status) {
                    case 1: statusParcelaLabel = 'Pendente'; break;
                    case 2: statusParcelaLabel = 'Liberado'; break;
                    case 3: statusParcelaLabel = 'Pago'; break;
                    case 4: statusParcelaLabel = 'Cancelado'; break;
                    case 5: statusParcelaLabel = 'Bloqueado'; break;
                }

                return {
                    ...p,
                    codigoVenda: this.venda?.codigoProdutoLegado || this.comissao?.idVendaImportada || 'N/A',
                    produto: this.detalhesDisplay.produto,
                    imovel: this.detalhesDisplay.imovel,
                    nome: (p as any).nomeUsuario || "Nome não encontrado",
                    cargo: (p as any).nomeNivel || 'N/A',
                    statusPagamento: statusPagamento,
                    statusParcelaLabel: statusParcelaLabel
                };
            });
        }
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

    /** Extrai o valor numérico de um campo que pode ser number ou Moeda ({valor: N}) */
    getMoneyValue(val: number | { valor: number } | null | undefined): number {
        if (val == null) return 0;
        if (typeof val === 'number') return val;
        if (typeof val === 'object' && 'valor' in val) return val.valor;
        return 0;
    }

    getStatusLabel(status: EStatusComissao | string): string {
        const s = typeof status === 'string' ? status : '';
        switch (status) {
            case EStatusComissao.Pendente: return 'Pendente';
            case EStatusComissao.Aprovada: return 'Aprovada';
            case EStatusComissao.Rejeitada: return 'Rejeitada';
            case EStatusComissao.Paga: return 'Paga';
            default:
                if (s === 'Pendente') return 'Pendente';
                if (s === 'Aprovada') return 'Aprovada';
                if (s === 'Rejeitada') return 'Rejeitada';
                if (s === 'Paga') return 'Paga';
                return 'Desconhecido';
        }
    }

    /** Helpers para o template (Bonificações) */
    isBonifParcelaPendente(parcela: BonificacaoParcela): boolean {
        return parcela.status === EStatusParcelaBonificacao.Pendente || parcela.status === 'Pendente';
    }

    canLiberarParcela(parcela: BonificacaoParcela): boolean {
        if (!this.comissao) return false;
        const statusStr = String(this.comissao.status);
        const isAprovada = this.comissao.status === EStatusComissao.Aprovada || statusStr === 'Aprovada' || statusStr === '3';
        return this.isBonifParcelaPendente(parcela) && isAprovada;
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

                const userId = currentUser.id || currentUser.sub || currentUser.nameid || currentUser.Id;
                if (!userId) {
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'ID do usuário não encontrado na sessão.' });
                    this.saving = false;
                    return;
                }

                this.comissaoService.aprovar(this.comissao!.id, userId).subscribe({
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

    confirmarRejeicao() {
        if (!this.comissao || !this.motivoRejeicao) return;

        this.saving = true;
        const currentUser = this.authService.currentUserValue;
        if (!currentUser) return;

        const userId = currentUser.id || currentUser.sub || currentUser.nameid || currentUser.Id;
        if (!userId) {
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'ID do usuário não encontrado na sessão.' });
            this.saving = false;
            return;
        }

        this.comissaoService.rejeitar(this.comissao.id, userId, this.motivoRejeicao).subscribe({
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

    print() {
        window.print();
    }

    liberarParcela(parcela: any) {
        this.confirmationService.confirm({
            message: `Confirma a liberação manual da parcela ${parcela.numeroParcela}?`,
            header: 'Liberar Parcela',
            icon: 'pi pi-check-circle',
            accept: () => {
                const currentUser = this.authService.currentUserValue;
                if (!currentUser || !this.comissao) return;

                const userId = currentUser.id || currentUser.sub || currentUser.nameid || currentUser.Id;
                if (!userId) return;

                this.comissaoService.liberarParcelaManual(this.comissao.id, parcela.id, userId).subscribe({
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

    liberarComissoesEmMassa() {
        if (this.selectedParcelasComissao.length === 0) return;

        this.confirmationService.confirm({
            message: `Deseja liberar as ${this.selectedParcelasComissao.length} comissões selecionadas?`,
            header: 'Liberação em Massa',
            icon: 'pi pi-check-circle',
            accept: () => {
                const currentUser = this.authService.currentUserValue;
                if (!currentUser) return;

                const userId = currentUser.id || currentUser.sub || currentUser.nameid || currentUser.Id;
                if (!userId) return;

                const ids = this.selectedParcelasComissao.map(p => p.id);
                this.saving = true;

                this.comissaoService.liberarParcelasEmMassa(ids, userId).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Comissões liberadas com sucesso!' });
                        this.selectedParcelasComissao = [];
                        if (this.comissao) this.loadDetalhes(this.comissao.id);
                        this.saving = false;
                    },
                    error: (err) => {
                        console.error(err);
                        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao liberar em massa' });
                        this.saving = false;
                    }
                });
            }
        });
    }

    // --- Documentos ---
    showUploadDialog() {
        this.documentoDialogVisible = true;
        this.fileToUpload = null;
        this.categoriaSelecionada = 1;
    }

    onFileSelect(event: any) {
        if (event.target.files && event.target.files.length > 0) {
            this.fileToUpload = event.target.files[0];
        }
    }

    salvarDocumento() {
        if (!this.fileToUpload || !this.comissao) return;

        const currentUser = this.authService.currentUserValue;
        if (!currentUser) return;

        const idResponsavel = currentUser.id || currentUser.sub || currentUser.nameid || currentUser.Id || '00000000-0000-0000-0000-000000000000';

        this.saving = true;
        this.comissaoService.uploadDocumento(
            this.comissao.id,
            this.fileToUpload,
            idResponsavel,
            this.categoriaSelecionada
        ).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Documento enviado!' });
                this.documentoDialogVisible = false;
                this.loadDetalhes(this.comissao!.id);
                this.saving = false;
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro no upload' });
                this.saving = false;
            }
        });
    }

    getDocumentosPorCategoria(categoria: number): ComissaoDocumento[] {
        return this.docsPorCategoria[categoria] || [];
    }

    organizarDocumentos() {
        this.docsPorCategoria = {
            0: [], // Outros
            1: [], // Imobiliária
            2: [], // Clientes
            3: []  // Corretores
        };

        if (!this.comissao?.documentos) return;

        this.comissao.documentos.forEach(doc => {
            const d = doc as any;
            // A API pode retornar como número (1) ou string ("Imobiliaria") devido ao JsonStringEnumConverter
            const docCat = d.categoria !== undefined ? d.categoria : (d.Categoria !== undefined ? d.Categoria : null);

            let numericCat = -1;

            if (typeof docCat === 'number') {
                numericCat = docCat;
            } else if (typeof docCat === 'string') {
                const lowerCat = docCat.toLowerCase();
                if (lowerCat === 'imobiliaria') numericCat = 1;
                else if (lowerCat === 'clientes') numericCat = 2;
                else if (lowerCat === 'corretores') numericCat = 3;
                else if (lowerCat === 'outros') numericCat = 0;
            }

            // Normaliza objeto do documento
            const dNormalizado: ComissaoDocumento = {
                id: d.id || d.Id,
                idComissao: d.idComissao || d.IdComissao || this.comissao?.id,
                nome: d.nome || d.Nome,
                extensao: d.extensao || d.Extensao || d.tipo || d.Tipo || '',
                tamanhoBytes: d.tamanhoBytes || d.TamanhoBytes || d.tamanho || d.Tamanho || 0,
                categoria: numericCat !== -1 ? numericCat : 0,
                dataEnvio: d.dataEnvio || d.DataEnvio || d.data || d.Data || new Date(),
                idUsuarioEnvio: d.idUsuarioEnvio || d.IdUsuarioEnvio || d.usuarioEnvioId || d.UsuarioEnvioId || '00000000-0000-0000-0000-000000000000',
                nomeUsuarioEnvio: d.nomeUsuarioEnvio || d.NomeUsuarioEnvio || 'Não informado',
                aprovado: d.aprovado ?? d.Aprovado ?? false,
                dataAprovacao: d.dataAprovacao || d.DataAprovacao,
                idUsuarioAprovacao: d.idUsuarioAprovacao || d.IdUsuarioAprovacao
            };

            // Adiciona na categoria correta
            const targetCat = (numericCat === 1 || numericCat === 2 || numericCat === 3) ? numericCat : 0;

            if (!this.docsPorCategoria[targetCat]) {
                this.docsPorCategoria[targetCat] = [];
            }
            this.docsPorCategoria[targetCat].push(dNormalizado);
        });
    }

    aprovarDocumento(doc: ComissaoDocumento) {
        if (!this.comissao) {
            console.error('Comissão não carregada');
            return;
        }
        this.confirmationService.confirm({
            message: 'Tem certeza que deseja aprovar este documento?',
            header: 'Confirmar Aprovação',
            icon: 'pi pi-check',
            accept: () => {
                this.comissaoService.aprovarDocumento(this.comissao!.id, doc.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Documento aprovado!' });
                        this.loadDetalhes(this.comissao!.id);
                    },
                    error: (err) => {
                        console.error(err);
                        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao aprovar' });
                    }
                });
            }
        });
    }

    reprovarDocumento(doc: ComissaoDocumento) {
        if (!this.comissao) return;

        this.confirmationService.confirm({
            message: 'Tem certeza que deseja reprovar este documento?',
            header: 'Confirmar Reprovação',
            icon: 'pi pi-times',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.comissaoService.reprovarDocumento(this.comissao!.id, doc.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Documento reprovado!' });
                        this.loadDetalhes(this.comissao!.id);
                    },
                    error: (err) => {
                        console.error(err);
                        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao reprovar' });
                    }
                });
            }
        });
    }

    // --- Bonificações ---

    loadBonificacoes(idVenda: string) {
        if (!idVenda) return;
        this.loadingBonificacoes = true;
        this.bonificacaoService.getByVenda(idVenda).subscribe({
            next: (data) => {
                this.bonificacoes = data || [];
                this.loadingBonificacoes = false;
            },
            error: (err) => {
                console.error('Erro ao carregar bonificações', err);
                this.loadingBonificacoes = false;
            }
        });
    }

    getTipoBonificacaoLabel(tipo: ETipoBonificacao | string): string {
        const t = typeof tipo === 'string' ? tipo : '';
        switch (tipo) {
            case ETipoBonificacao.PorParcelamento: return 'Por Parcelamento';
            case ETipoBonificacao.Livre: return 'Livre';
            case ETipoBonificacao.PorMeta: return 'Por Meta';
            default:
                if (t === 'PorParcelamento') return 'Por Parcelamento';
                if (t === 'Livre') return 'Livre';
                if (t === 'PorMeta') return 'Por Meta';
                return 'Desconhecido';
        }
    }

    getStatusBonificacaoLabel(status: EStatusBonificacao | string): string {
        const s = typeof status === 'string' ? status : '';
        switch (status) {
            case EStatusBonificacao.Pendente: return 'Pendente';
            case EStatusBonificacao.PartialmenteLiberada: return 'Parcialmente Liberada';
            case EStatusBonificacao.Liberada: return 'Liberada';
            case EStatusBonificacao.Paga: return 'Paga';
            case EStatusBonificacao.Cancelada: return 'Cancelada';
            default:
                if (s === 'Pendente') return 'Pendente';
                if (s === 'PartialmenteLiberada' || s === 'ParcialmenteLiberada') return 'Parcialmente Liberada';
                if (s === 'Liberada') return 'Liberada';
                if (s === 'Paga') return 'Paga';
                if (s === 'Cancelada') return 'Cancelada';
                return 'Desconhecido';
        }
    }

    getStatusBonificacaoSeverity(status: EStatusBonificacao | string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        const s = typeof status === 'string' ? status : '';
        switch (status) {
            case EStatusBonificacao.Pendente: return 'warn';
            case EStatusBonificacao.PartialmenteLiberada: return 'info';
            case EStatusBonificacao.Liberada: return 'success';
            case EStatusBonificacao.Paga: return 'success';
            case EStatusBonificacao.Cancelada: return 'danger';
            default:
                if (s === 'Pendente') return 'warn';
                if (s === 'PartialmenteLiberada' || s === 'ParcialmenteLiberada') return 'info';
                if (s === 'Liberada') return 'success';
                if (s === 'Paga') return 'success';
                if (s === 'Cancelada') return 'danger';
                return 'secondary';
        }
    }

    getStatusParcelaBonificacaoSeverity(status: EStatusParcelaBonificacao | string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        const s = typeof status === 'string' ? status : '';
        switch (status) {
            case EStatusParcelaBonificacao.Pendente: return 'warn';
            case EStatusParcelaBonificacao.Liberada: return 'info';
            case EStatusParcelaBonificacao.Paga: return 'success';
            case EStatusParcelaBonificacao.Cancelada: return 'danger';
            default:
                if (s === 'Pendente') return 'warn';
                if (s === 'Liberada') return 'info';
                if (s === 'Paga') return 'success';
                if (s === 'Cancelada') return 'danger';
                return 'secondary';
        }
    }

    getStatusParcelaBonificacaoLabel(status: EStatusParcelaBonificacao | string): string {
        const s = typeof status === 'string' ? status : '';
        switch (status) {
            case EStatusParcelaBonificacao.Pendente: return 'Pendente';
            case EStatusParcelaBonificacao.Liberada: return 'Liberada';
            case EStatusParcelaBonificacao.Paga: return 'Paga';
            case EStatusParcelaBonificacao.Cancelada: return 'Cancelada';
            default:
                if (s === 'Pendente') return 'Pendente';
                if (s === 'Liberada') return 'Liberada';
                if (s === 'Paga') return 'Paga';
                if (s === 'Cancelada') return 'Cancelada';
                return 'Desconhecido';
        }
    }

    liberarParcelaBonificacao(bonif: BonificacaoCalculada, parcela: BonificacaoParcela) {
        this.confirmationService.confirm({
            message: `Confirma a liberação manual da parcela ${parcela.numeroParcela} de bonificação?`,
            header: 'Liberar Parcela de Bonificação',
            icon: 'pi pi-check-circle',
            accept: () => {
                this.bonificacaoService.liberarParcela(bonif.id, parcela.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Parcela de bonificação liberada!' });
                        this.loadBonificacoes(this.comissao!.idVendaImportada);
                    },
                    error: (err) => {
                        console.error(err);
                        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao liberar parcela de bonificação' });
                    }
                });
            }
        });
    }
}
