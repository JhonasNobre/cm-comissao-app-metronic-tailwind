import { Directive, inject, OnInit } from '@angular/core';
import { Observable, of, throwError, firstValueFrom } from 'rxjs';

// Models
import { BaseModel, BaseEntity } from '../../../models/base-model';

// Services
import { DialogService } from 'primeng/dynamicdialog';
import { AppConfirmationService } from '../../../services/confirmation.service';
import { BaseComponent } from '../base.component';
import { DynamicFormDialogComponent } from '../../ui/dynamic-form/dynamic-dialog.component';
import { FormItemBase } from '../../ui/dynamic-form/models/form-item-base';

@Directive()
export abstract class BaseListComponent<T extends BaseEntity> extends BaseComponent implements OnInit {
    protected dialogService = inject(DialogService);
    protected confirmationService = inject(AppConfirmationService);

    protected abstract storageKey: string;
    currentSearchParams: any = {};

    itens: T[] = [];

    /**
     * NOVA PROPRIEDADE: Controla se a busca de dados deve ser executada
     * automaticamente na inicialização do componente. O padrão é 'true'.
     */
    protected loadDataOnInitialization = true;

    ngOnInit(): void {
        if (this.loadDataOnInitialization) {
            this.load();
        }
    }

    // Tornar load() assíncrono para aguardar beforeInitialLoad
    async load(): Promise<void> {
        // Permite que subclasses modifiquem 'search' antes do 'load' inicial, se necessário
        await Promise.resolve(this.beforeInitialLoad()); // Aguarda a conclusão de beforeInitialLoad
        this.list(this.currentSearchParams);
    }

    /**
     * Hook para subclasses realizarem ações assíncronas antes do load inicial.
     * Pode ser assíncrono (retornar Promise<void>) ou síncrono (retornar void).
     */
    protected beforeInitialLoad(): Promise<void> | void { }

    list(params: any): void {
        this.loadData(params).subscribe({
            next: (res) => {
                this.itens = res;
            },
            error: (error) => {
                this.showError(this.translate.translate('error.error_load_data'));
                console.error(error);
            }
        });
    }

    /** Retorna um Observable<T[]> com todos os itens; implementado pela classe filha */
    protected abstract loadData(params: any): Observable<T[]>;

    handleSearch(params: any): void {
        const cleanedParams: any = {};

        // Percorre todas as chaves dos parâmetros recebidos
        for (const key in params) {
            // Verifica se a propriedade realmente pertence ao objeto
            if (Object.prototype.hasOwnProperty.call(params, key)) {
                const value = params[key];

                // Adiciona ao novo objeto APENAS se o valor não for nulo, indefinido ou uma string vazia
                if (value !== null && value !== undefined && value !== '') {
                    cleanedParams[key] = value;
                }
            }
        }

        // Agora usamos os parâmetros já limpos
        this.currentSearchParams = cleanedParams;
        this.list(cleanedParams);
    }

    openDialog(object?: T) {
        const ref = this.dialogService.open(DynamicFormDialogComponent, {
            data: {
                questions: this.getFormItems(object),
                hasFileUpload: false
            },
            header: object?.id ? this.translate.translate('general.singular.edit') + ' ' + this.getObjectName(object) : this.translate.translate('general.singular.new'),
            closable: true,
            modal: true,
            draggable: true,
            resizable: true,
            contentStyle: { overflow: 'auto' },
            style: {
                width: '500px',
                maxWidth: '99vw',
                maxHeight: '99vh'
            }
        });

        if (ref) {
            ref.onClose.subscribe((result: { form: T; files: any[] }) => {
                if (result && result.form) {
                    this.handleSave(result.form, object?.id);
                }
            });
        }
    }

    protected handleSave(formData: T, id?: string | number) {
        const operation$: Observable<any> = id
            ? this.onEdit(formData, id)
            : this.onAdd(formData);

        operation$.subscribe({
            next: () => {
                this.showSuccess(this.translate.translate('SHARED.COMMON.BASE_LIST.OPERATION_SUCCESS'));
                this.load();
            },
            error: (error: any) => {
                this.showError(this.translate.translate('SHARED.COMMON.BASE_LIST.OPERATION_ERROR'));
                console.error(error);
            }
        });
    }

    protected getFormItems(object?: T): FormItemBase[] {
        return [];
    }

    protected onAdd(object: T): Observable<any> {
        console.warn('onAdd não implementado na classe filha.');
        this.showError(this.translate.translate('base-components.base-list.add-not-supported'));
        return of(null);
    }

    protected onEdit(object: T, id: string | number): Observable<any> {
        console.warn('onEdit não implementado na classe filha.');
        this.showError(this.translate.translate('base-components.base-list.edit-not-supported'));
        return of(null);
    }

    protected getObjectName(object?: T): string | undefined {
        return this.translate.translate('base-components.base-list.default-item-name');
    }

    async onRemover(object: T): Promise<void> {
        const itemName = this.getObjectName(object) ?? 'item';
        const translatedMessage = await firstValueFrom(
            this.translate.selectTranslate('base-components.base-list.sure-delete-item', { item: itemName })
        );

        const confirmed = await this.confirmationService.confirmDelete({
            message: translatedMessage
        });

        if (!confirmed) return;

        this.onDelete(object?.id).subscribe({
            next: () => {
                this.showSuccess(this.translate.translate('base-components.base-list.operation-success'));
                this.load();
            },
            error: (error) => {
                this.showError(this.translate.translate('base-components.base-list.error-remove-item'));
                console.error(error);
            }
        });
    }

    protected onDelete(id: string | number): Observable<void> {
        const errorMessage = this.translate.translate('base-components.base-list.delete-not-supported');
        console.warn(errorMessage);
        this.showError(errorMessage);

        return throwError(() => new Error(errorMessage));
    }
}
