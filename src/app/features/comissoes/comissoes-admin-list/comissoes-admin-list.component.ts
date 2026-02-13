import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

import { GenericPTableComponent } from '../../../shared/components/ui/generic-p-table/generic-p-table.component';
import { ComissaoService } from '../services/comissao.service';
import { EmpresaSelectorService } from '../../../core/services/empresa-selector.service';
import { AuthService } from '../../../core/services/auth.service';
import { ColumnHeader } from '../../../shared/models/column-header.model';

@Component({
    selector: 'app-comissoes-admin-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        GenericPTableComponent,
        ToastModule,
        ConfirmDialogModule,
        ButtonModule,
        InputTextModule,
        MenuModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './comissoes-admin-list.component.html',
    styleUrl: './comissoes-admin-list.component.scss'
})
export class ComissoesAdminListComponent implements OnInit {
    private comissaoService = inject(ComissaoService);
    private empresaSelectorService = inject(EmpresaSelectorService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private authService = inject(AuthService);
    private router = inject(Router);

    // Data
    comissoes: any[] = [];
    comissoesFiltered: any[] = [];
    selectedItems: any[] = [];
    totalRecords = 0;
    loading = false;

    // Filtros
    filtros = {
        // Backend filters
        pagina: 1,
        tamanhoPagina: 10,
        idEmpresa: undefined as string | undefined,
        termoBusca: '',
        // Frontend filters (client-side)
        produto: null as string | null,
        cargo: null as string | null,
        statusParcela: null as string | null
    };

    // Opções para dropdowns
    produtosOptions: any[] = [];
    cargosOptions: any[] = [];
    statusOptions = [
        { label: 'Pendente', value: 'Pendente' },
        { label: 'Liberado', value: 'Liberado' },
        { label: 'Pagar', value: 'Pagar' },
        { label: 'Paga', value: 'Paga' },
        { label: 'Cancelada', value: 'Cancelada' }
    ];

    // Colunas da tabela
    columns: ColumnHeader<any>[] = [
        { field: 'numeroParcela', header: 'Nº da Parcela', sortable: true },
        { field: 'produto', header: 'Produto', sortable: true },
        { field: 'imovel', header: 'Imóvel', sortable: true },
        { field: 'nome', header: 'Nome', sortable: true },
        { field: 'cargo', header: 'Cargo', sortable: true },
        {
            field: 'valor',
            header: 'Valor',
            formatter: (v) => `R$ ${v?.toFixed(2) || '0.00'}`,
            sortable: true
        },
        {
            field: 'dataPrevista',
            header: 'Data Prevista',
            pipe: 'date',
            pipeArgs: 'dd/MM/yyyy',
            sortable: true
        },
        {
            field: 'status',
            header: 'Status da Parcela',
            displayAs: 'badge',
            badgeSeverityMap: {
                'Pendente': 'warning',
                'Bloqueado': 'danger',
                'Liberado': 'success',
                'Pagar': 'info'
            }
        }
    ];

    ngOnInit() {
        this.empresaSelectorService.selectedEmpresaIds$.subscribe(ids => {

            const idEmpresa = ids.length > 0 ? ids[0] : undefined;
            this.filtros.idEmpresa = idEmpresa;

            if (idEmpresa) {

                this.loadComissoes();
            } else {

                this.comissoes = [];
                this.comissoesFiltered = [];
            }
        });
    }

    loadComissoes() {

        this.loading = true;
        this.comissaoService.getPendentes(this.filtros).subscribe({
            next: (res) => {

                this.comissoes = res.items;
                this.totalRecords = res.totalItems;
                this.buildDropdownOptions();
                this.applyLocalFilters();
                this.loading = false;
            },
            error: (err) => {

                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar comissões'
                });
                this.loading = false;
            }
        });
    }

    buildDropdownOptions() {
        // Produtos únicos
        const produtosUnicos = [...new Set(this.comissoes.map(c => c.produto))].filter(p => p);
        this.produtosOptions = [
            { label: 'Mostrar tudo', value: null },
            ...produtosUnicos.map(p => ({ label: p, value: p }))
        ];

        // Cargos únicos
        const cargosUnicos = [...new Set(this.comissoes.map(c => c.cargo))].filter(c => c);
        this.cargosOptions = [
            { label: 'Mostrar tudo', value: null },
            ...cargosUnicos.map(c => ({ label: c, value: c }))
        ];
    }

    applyLocalFilters() {
        let filtered = [...this.comissoes];

        if (this.filtros.produto) {
            filtered = filtered.filter(c => c.produto === this.filtros.produto);
        }
        if (this.filtros.cargo) {
            filtered = filtered.filter(c => c.cargo === this.filtros.cargo);
        }
        if (this.filtros.statusParcela) {
            filtered = filtered.filter(c => c.status === this.filtros.statusParcela);
        }

        this.comissoesFiltered = filtered;
    }

    onFilterChange() {
        this.applyLocalFilters();
    }

    onSearchChange() {
        // Recarrega do backend com novo termo de busca
        this.loadComissoes();
    }

    // Ações do menu
    getMenuItems(item: any): MenuItem[] {
        return [
            {
                label: 'Ver detalhes',
                icon: 'pi pi-eye',
                command: () => this.onVerDetalhes(item)
            },
            { separator: true },
            {
                label: 'Liberar Comissão',
                icon: 'pi pi-check',
                command: () => this.onLiberarComissao(item)
            },
            {
                label: 'Rejeitar Comissão',
                icon: 'pi pi-times',
                command: () => this.onRejeitarComissao(item)
            }
        ];
    }

    onVerDetalhes(item: any) {
        this.router.navigate(['/comissoes', item.idComissao]);
    }

    onLiberarComissao(item: any) {
        this.confirmationService.confirm({
            message: `Confirma a liberação da parcela ${item.numeroParcela} no valor de R$ ${item.valor?.toFixed(2)}?`,
            header: 'Liberar Comissão',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const usuarioId = this.authService.getUserInfo()?.sub;
                if (!usuarioId) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erro',
                        detail: 'Usuário não autenticado'
                    });
                    return;
                }
                this.comissaoService.liberarParcelaManual(item.idComissao, item.id, usuarioId).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Parcela liberada com sucesso'
                        });
                        this.loadComissoes();
                    },
                    error: (err) => {
                        console.error(err);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao liberar parcela'
                        });
                    }
                });
            }
        });
    }

    onRejeitarComissao(item: any) {
        // TODO: Implementar modal para coletar motivo
        this.messageService.add({
            severity: 'info',
            summary: 'Em desenvolvimento',
            detail: 'Funcionalidade de rejeição será implementada em breve'
        });
    }

    onLiberarSelecionadas() {
        if (this.selectedItems.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Atenção',
                detail: 'Selecione ao menos uma parcela'
            });
            return;
        }

        this.confirmationService.confirm({
            message: `Confirma a liberação de ${this.selectedItems.length} parcela(s) selecionada(s)?`,
            header: 'Liberar Comissões em Massa',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const usuarioId = this.authService.getUserInfo()?.sub;
                if (!usuarioId) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erro',
                        detail: 'Usuário não autenticado'
                    });
                    return;
                }

                let liberadasCount = 0;
                let errosCount = 0;

                this.selectedItems.forEach((item, index) => {
                    this.comissaoService.liberarParcelaManual(item.idComissao, item.id, usuarioId).subscribe({
                        next: () => {
                            liberadasCount++;
                            if (index === this.selectedItems.length - 1) {
                                this.finalizarLiberacaoEmMassa(liberadasCount, errosCount);
                            }
                        },
                        error: (err) => {
                            console.error(err);
                            errosCount++;
                            if (index === this.selectedItems.length - 1) {
                                this.finalizarLiberacaoEmMassa(liberadasCount, errosCount);
                            }
                        }
                    });
                });
            }
        });
    }

    private finalizarLiberacaoEmMassa(sucesso: number, erros: number) {
        if (erros === 0) {
            this.messageService.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: `${sucesso} parcela(s) liberada(s) com sucesso`
            });
        } else {
            this.messageService.add({
                severity: 'warn',
                summary: 'Concluído com erros',
                detail: `${sucesso} liberada(s), ${erros} com erro`
            });
        }
        this.selectedItems = [];
        this.loadComissoes();
    }
}
