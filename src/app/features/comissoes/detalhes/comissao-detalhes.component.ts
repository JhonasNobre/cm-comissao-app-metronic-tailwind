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

    // View Model para Detalhes da Venda
    detalhesDisplay = {
        produto: 'Carregando...',
        imovel: 'Carregando...',
        equipe: 'Carregando...',
        cliente: 'Carregando...',
        corretor: 'Carregando...',
        cidade: 'Carregando...',
        valorVenda: 0,
        valorRecebido: 'Indisponível',
        taxaRecebida: 'Indisponível'
    };

    // Dados de Pagamento (Cliente -> Incorporadora)
    parcelasPagamento: any[] = [];

    // Dados de Comissão (Incorporadora -> Corretor)
    parcelasComissaoDisplay: any[] = [];
    selectedParcelasComissao: any[] = [];

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
                console.log('Comissão carregada:', this.comissao);
                console.log('Documentos recebidos:', this.comissao.documentos);

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
            imovel: this.venda?.imovel || 'Não informado',
            equipe: 'Não informado',
            cliente: this.venda?.nomeCliente || 'Não informado',
            corretor: nomeCorretor,
            cidade: 'Não informado',
            valorVenda: this.comissao.valorVenda,
            valorRecebido: 'Indisponível',
            taxaRecebida: 'Indisponível'
        };

        if (this.comissao.parcelas) {
            this.parcelasComissaoDisplay = this.comissao.parcelas.map(p => {
                const hoje = new Date();
                const vencimento = p.dataVencimento ? new Date(p.dataVencimento) : null;

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
                    cargo: "Corretor (a)",
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

    getStatusLabel(status: EStatusComissao): string {
        switch (status) {
            case EStatusComissao.Pendente: return 'Pendente';
            case EStatusComissao.Aprovada: return 'Aprovada';
            case EStatusComissao.Rejeitada: return 'Rejeitada';
            case EStatusComissao.Paga: return 'Paga';
            default: return 'Desconhecido';
        }
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

    liberarComissoesEmMassa() {
        if (this.selectedParcelasComissao.length === 0) return;

        this.confirmationService.confirm({
            message: `Deseja liberar as ${this.selectedParcelasComissao.length} comissões selecionadas?`,
            header: 'Liberação em Massa',
            icon: 'pi pi-check-circle',
            accept: () => {
                const currentUser = this.authService.currentUserValue;
                if (!currentUser) return;

                const ids = this.selectedParcelasComissao.map(p => p.id);
                this.saving = true;

                this.comissaoService.liberarParcelasEmMassa(ids, currentUser.id).subscribe({
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

        const idResponsavel = currentUser.id || '00000000-0000-0000-0000-000000000000';

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

        console.log('Documentos organizados:', this.docsPorCategoria);
    }

    aprovarDocumento(doc: ComissaoDocumento) {
        console.log('Botão de aprovar clicado para documento:', doc);
        if (!this.comissao) {
            console.error('Comissão não carregada');
            return;
        }

        console.log('Chamando confirmationService.confirm');
        this.confirmationService.confirm({
            message: 'Tem certeza que deseja aprovar este documento?',
            header: 'Confirmar Aprovação',
            icon: 'pi pi-check',
            accept: () => {
                console.log('Confirmação aceita, chamando serviço de aprovação');
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
}
