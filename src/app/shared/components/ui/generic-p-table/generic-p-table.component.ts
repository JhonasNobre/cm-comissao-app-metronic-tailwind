import { CommonModule } from '@angular/common';
import { Component, ContentChild, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { Table, TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { debounceTime, Subject, tap } from 'rxjs';
import { NotificationService } from '../../../../core/services/notification.service';
import { BaseEntity } from '../../../models/base-model';
import { NoRecordsFoundComponent } from '../../forms/no-records-found/no-records-found.component';
import { ColumnHeader } from '../../../models/column-header.model';
import { TableFormattingService } from '../../../services/table-formatting.service';
// import { PermissionStoreService } from '../../../services/permission-store.service';

@Component({
    selector: 'app-generic-p-table',
    templateUrl: './generic-p-table.component.html',
    standalone: true,
    imports: [CommonModule, FormsModule,
        TableModule, TooltipModule, InputTextModule, ButtonModule,
        NoRecordsFoundComponent, AvatarModule, AvatarGroupModule, BadgeModule, MultiSelectModule, FloatLabelModule],
    encapsulation: ViewEncapsulation.None,
    styles: [`
        /* Table Header Background */
        .p-datatable .p-datatable-thead > tr > th,
        .kt-table.kt-table-border thead tr th {
            background-color: #F9FAFB !important;
            border-right: 1px solid #EFF2F5 !important;
        }
        
        /* Remove vertical border from last header cell */
        .p-datatable .p-datatable-thead > tr > th:last-child,
        .kt-table.kt-table-border thead tr th:last-child {
            border-right: none !important;
        }
        
        /* Table Body Cell Borders */
        .kt-table tbody td {
            border-right: 1px solid #EFF2F5 !important;
        }
        
        /* Remove vertical border from last body cell */
        .kt-table tbody td:last-child {
            border-right: none !important;
        }
        
        /* Force padding on first column */
        .kt-table th:first-child,
        .kt-table td:first-child {
            padding-left: 1.25rem !important;
        }
       
        /* Current Page Report (Showing X to Y of Z) */
        .p-datatable .p-paginator .p-paginator-current,
        .p-paginator .p-paginator-current {
            font-size: 0.875rem !important;
            margin-right: auto !important;
            order: -1 !important;
        }
    `]
})

export class GenericPTableComponent<T extends BaseEntity> implements OnInit, OnChanges {
    @ContentChild('customActions') customActionsTemplate: TemplateRef<any> | undefined;

    @ViewChild('dt') dt: Table | undefined;

    @Input() tableData: T[] = [];
    @Input() totalRecords = 0;
    @Input() rows = 10;
    @Input() serverSidePagination = false;

    @Input() columnDefinition: ColumnHeader<T>[] = [];
    @Input() optionsColumns: ColumnHeader<T>[] = [];

    @Input() tableName = '';
    @Input() titleBtnCreate = 'general.singular.new';
    @Input() hasBtnCreate = false;
    @Input() displayCreateAction = false;

    // --- Propriedades para Seleção de Colunas ---
    visibleColumns: ColumnHeader<T>[] = [];
    optionalColumnOptions: ColumnHeader<T>[] = [];
    selectedColumns: ColumnHeader<T>[] = [];

    @Input() stripedRows = true;

    /**
     * Recebe uma função para aplicar classes CSS dinamicamente a uma linha.
     * A função recebe o dado da linha e deve retornar uma string com as classes.
     */
    @Input() rowStyleClass?: (rowData: T) => string;

    /**
     * Propriedades para seleção
     */
    /** Habilita a exibição da coluna de seleção (checkboxes). */
    @Input() enableSelection = false;

    /** Recebe uma função para determinar se uma linha pode ser selecionada. */
    @Input() isRowSelectable?: (event: { data: T }) => boolean;

    // --- LÓGICA DE SELEÇÃO ATUALIZADA PARA TWO-WAY BINDING ---

    /** 1. Recebe a seleção do componente pai. */
    @Input() selection: T[] = [];

    /** 2. Emite as mudanças de volta para o pai. O sufixo 'Change' é crucial. */
    @Output() selectionChange = new EventEmitter<T[]>();

    // O getter/setter e a propriedade _selectedItems não são mais necessários.

    /**
     * 3. Método interno para propagar a mudança do p-table para o componente pai.
     */
    onInternalSelectionChange(currentSelection: T[]): void {
        this.selection = currentSelection; // Atualiza o estado interno
        this.selectionChange.emit(this.selection); // Emite para o pai
    }

    /**
     * Pode ser booleano (todos) ou função (por linha)
     */
    @Input() displayDetailAction: boolean | ((item: any) => boolean) = false;
    @Input() displayEditAction = false;
    @Input() displayDeleteAction = false;
    @Input() disableDeleteCondition?: (item: any) => boolean;

    @Output() genericEvent = new EventEmitter<T>();
    @Output() detail = new EventEmitter<T>();
    @Output() add = new EventEmitter<void>();
    @Output() edit = new EventEmitter<T>();
    @Output() delete = new EventEmitter<T>();

    @Output() readonly changeColumns = new EventEmitter<ColumnHeader<T>[]>();
    @Output() readonly lazyLoad = new EventEmitter<{ page: number; rows: number; filter: string }>();

    filteredTableData: T[] = [];
    filter = '';
    rowsPerPageOptions = [10, 25, 50, 100];

    private imageFields = ['image', 'photo', 'flag', 'photoData'];
    private filterSubject = new Subject<string>();

    private hasFormattingErrorOccurred = false;

    // private permissionStore = inject(PermissionStoreService);

    constructor(
        private notificationService: NotificationService, private formattingService: TableFormattingService) {
        this.filterSubject.pipe(
            debounceTime(300), // A lógica de debounce continua perfeita
            tap(filterValue => {
                if (this.serverSidePagination) {
                    this.lazyLoad.emit({ page: 0, rows: this.rows, filter: filterValue });
                } else {
                    this.filterGlobalWithFormatters(filterValue);
                }
            })
        ).subscribe();
    }

    /**
     * Verifica se o botão "Novo" deve ser desabilitado
     * 
     * PERFIS:
     * - Support: desabilita tudo (prioridade máxima)
     * - Requery: habilita Novo, Enviar para Análise e Reabrir
     * - Approval: habilita tudo
     */
    get isCreateButtonDisabled(): boolean {
        return false;
        // --- VERIFICAÇÕES DE PERMISSÃO ---
        // const isSupportProfile = this.permissionStore.hasPermissionByLabel('support');
        // const isApprovalProfile = this.permissionStore.hasPermissionByLabel('approvalButton');
        // const isRequeryProfile = this.permissionStore.hasPermissionByLabel('requeryButton');

        // // --- POLÍTICA DE SEGURANÇA: SEM PERMISSÕES = TUDO BLOQUEADO ---
        // const hasAnyPermission = isApprovalProfile || isSupportProfile || isRequeryProfile;
        // const noPermissionsBlock = !hasAnyPermission; // Se não tem nenhuma permissão, bloqueia tudo

        // // --- RESULTADO ---
        // // Support desabilita tudo, outros perfis habilitam o botão Novo
        // return noPermissionsBlock || isSupportProfile;
    }

    public get displayActionsColumn(): boolean {
        return (
            !!this.displayDetailAction ||
            this.displayEditAction ||
            this.displayDeleteAction
        );
    }

    ngOnInit(): void {
        // this.sessionService.getSession().then(sess => {
        //     this.countryCustom = sess?.countryCustom;
        // });
        const state = JSON.parse(sessionStorage.getItem('state-' + this.tableName) || '{}');
        this.filter = state.filters?.global?.value || '';

        // Inicializar dados filtrados
        this.filteredTableData = [...this.tableData];
    }

    ngOnChanges(changes: SimpleChanges): void {
        // Verifica se a definição de colunas foi passada ou alterada
        if (changes['columnDefinition']) {
            this.initializeColumns();
        }

        if (changes['tableData']) {
            this.hasFormattingErrorOccurred = false;

            // Atualizar dados filtrados quando tableData mudar
            if (!this.serverSidePagination) {
                this.filteredTableData = [...this.tableData];
                // Reaplicar filtro se existir
                if (this.filter) {
                    this.filterGlobalWithFormatters(this.filter);
                }
            }
        }
    }

    private readonly maxSelectedLabels = 3;
    /**
     * Prepara as listas de colunas obrigatórias, opcionais e visíveis.
     */
    private initializeColumns(): void {
        if (!this.columnDefinition) {
            this.visibleColumns = [];
            return;
        }

        // 1. Filtra as colunas que são opcionais.
        const optionalColumns = this.columnDefinition.filter(col => col.optional);

        // 2. A lista de opções para o dropdown é simplesmente a lista de colunas opcionais.
        //    O 'header' contém a CHAVE de tradução (ex: 'features...name').
        this.optionalColumnOptions = optionalColumns;

        // 3. Define as colunas que vêm selecionadas por padrão.
        this.selectedColumns = this.columnDefinition.filter(col => col.optional && col.defaultSelected);

        // 4. Calcula as colunas que serão visíveis na tabela.
        this.updateVisibleColumns();
    }

    /**
     * Getter que transforma o array de colunas selecionadas em uma string para exibição,
     * respeitando o limite de 'maxSelectedLabels'.
     */
    /**
     * Getter que transforma o array de colunas selecionadas em uma string para exibição,
     * respeitando o limite de 'maxSelectedLabels'.
     */
    public get selectedColumnsLabel(): string {
        if (!this.selectedColumns || this.selectedColumns.length === 0) {
            return ''; // Retorna vazio para o placeholder aparecer
        }

        const count = this.selectedColumns.length;

        // Se a quantidade de itens selecionados for maior que o limite...
        if (count > this.maxSelectedLabels) {
            // Retorna uma mensagem como "4 colunas selecionadas"
            return `${count} colunas selecionadas`;
        }

        // Se for menor ou igual ao limite, mostra os nomes separados por vírgula
        return this.selectedColumns
            .map(col => col.header)
            .join(', ');
    }

    onColumnSelectionChange(): void {
        this.updateVisibleColumns();
    }

    private updateVisibleColumns(): void {
        const mandatoryColumns = this.columnDefinition.filter(col => !col.optional);
        this.visibleColumns = [...mandatoryColumns, ...this.selectedColumns]
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    isImageField(field: string): boolean {
        return this.imageFields.includes(field);
    }

    getImageSrc(field: string, rowData: any): string {
        // Caso especial para a nossa foto em Base64
        if (field === 'photoData') {
            if (rowData.photoData) {
                return `data:${rowData.photoContentType}; base64, ${rowData.photoData} `;
            }
            // Retorna um avatar padrão se não houver foto
            return './images/default-avatar.png';
        }

        // Lógica existente para outros tipos de imagem (como URLs)
        const rawValue = rowData[field];
        return rawValue || './images/default-avatar.png';
    }

    public getFormattedValue(item: T, column: ColumnHeader<T>): string {
        try {
            return this.formattingService.formatCell(item, column);
        } catch (error) {
            console.error('Erro retornado pelo serviço de formatação:', error);

            if (!this.hasFormattingErrorOccurred) {
                this.notificationService.error(
                    'Erro de formatação',
                    'Ocorreu um erro ao formatar os dados da tabela.'
                ); this.hasFormattingErrorOccurred = true;
            }

            const raw = item[column.field as keyof T];
            return raw != null ? String(raw) : '';
        }
    }

    getPrioritySeverity(priority: number | string): 'info' | 'success' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        switch (priority) {
            case 1:
                return 'success';
            case 2:
                return 'info';
            case 3:
                return 'warn';
            case 4:
                return 'danger';
            default:
                return 'secondary';
        }
    }

    onLazyLoad(event: any) {
        if (this.serverSidePagination) {
            this.lazyLoad.emit({
                page: event.first / event.rows,
                rows: event.rows,
                filter: this.filter,
            });
        }
    }

    onGlobalFilter(table: Table, event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.filterGlobalWithFormatters(filterValue);
    }

    private filterGlobalWithFormatters(filterValue: string): void {
        if (!filterValue.trim()) {
            this.filteredTableData = [...this.tableData];
            return;
        }

        const lowerFilter = filterValue.toLowerCase();

        this.filteredTableData = this.tableData.filter(item => {
            return this.columnDefinition.some(column => {
                // Para colunas com formatter personalizado, usar o valor formatado
                if (column.formatter) {
                    try {
                        const formattedValue = column.formatter(item[column.field as keyof T], item);
                        return formattedValue.toLowerCase().includes(lowerFilter);
                    } catch (error) {
                        console.error('Erro no formatter durante busca:', error);
                        return false;
                    }
                }

                // Para colunas normais, usar o valor original
                const rawValue = item[column.field as keyof T];
                if (rawValue != null) {
                    return String(rawValue).toLowerCase().includes(lowerFilter);
                }

                return false;
            });
        });
    }

    onFilterChange(value: string) {
        this.filter = value;
        this.filterSubject.next(value);

        // Aplicar filtro personalizado para colunas com formatter
        if (!this.serverSidePagination) {
            this.filterGlobalWithFormatters(value);
        }
    }

    changeColumnHeaders(cols: ColumnHeader<T>[]) {
        this.changeColumns.emit(cols);
    }

    onGenericEvent(object: T): void {
        if (object) {
            this.genericEvent.emit(object);
        }
    }

    onDetail(object: T): void {
        if (object) {
            this.detail.emit(object);
        }
    }

    onAdd(): void {
        // Verifica se o botão está desabilitado
        if (this.isCreateButtonDisabled) {
            return; // Não executa se o botão estiver desabilitado
        }
        this.add.emit();
    }

    onEdit(object: T): void {
        if (object) {
            this.edit.emit(object);
        }
    }

    onDelete(object: T): void {
        if (object) {
            this.delete.emit(object);
        }
    }

    trackByField(_index: number, col: ColumnHeader<T>) {
        return col.field;
    }

    canShowDeleteButton(item: any): boolean {
        if (!this.displayDeleteAction) {
            return false;
        }

        if (this.disableDeleteCondition) {
            return !this.disableDeleteCondition(item);
        }

        return true;
    }

    isDetailActionVisible(item: any): boolean {
        if (typeof this.displayDetailAction === 'function') {
            return this.displayDetailAction(item);
        }
        return !!this.displayDetailAction;
    }

    /**
     * NOVO MÉTODO PÚBLICO: Limpa a seleção e o estado salvo da tabela.
     * Este método poderá ser chamado pelo componente pai.
     */
    public clearSelectionAndState(): void {
        this.selection = []; // Limpa a propriedade da seleção
        this.selectionChange.emit([]); // Notifica o pai sobre a limpeza

        if (this.dt) {
            this.dt.clearState(); // Comanda a p-table a limpar seu estado do Session Storage
            // Opcional: this.dt.reset() para limpar também filtros e ordenação
        }
    }

    /**
     * Checkbox Methods (Metronic Manual Checkboxes)
     */
    isSelected(rowData: T): boolean {
        return this.selection.some(item => item['id'] === rowData['id']);
    }

    onHeaderCheckboxToggle(event: any): void {
        const checked = event.target.checked;
        if (checked) {
            // Select all visible rows
            const visibleData = this.serverSidePagination ? this.tableData : this.filteredTableData;
            this.selection = [...visibleData];
        } else {
            // Deselect all
            this.selection = [];
        }
        this.selectionChange.emit(this.selection);
    }

    onRowCheckboxToggle(rowData: T, event: any): void {
        const checked = event.target.checked;
        if (checked) {
            // Add to selection
            this.selection = [...this.selection, rowData];
        } else {
            // Remove from selection
            this.selection = this.selection.filter(item => item['id'] !== rowData['id']);
        }
        this.selectionChange.emit(this.selection);
    }

}

