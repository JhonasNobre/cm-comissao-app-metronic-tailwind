import { Directive, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { checkFormValidations } from '../../../services/common-util.service';
import { BaseComponent } from '../base.component';

@Directive()
export abstract class BaseFormDialogComponent<T> extends BaseComponent implements OnInit {
    form!: FormGroup;

    // Injeções de dependência
    protected formBuilder = inject(FormBuilder);
    protected ref = inject(DynamicDialogRef);
    protected config = inject(DynamicDialogConfig);

    invalidControls: string[] = [];

    ngOnInit(): void {
        this.form = this.newForm();
        this.onInitDialog(this.config.data as T);
    }

    /**
     * Hook chamado após a criação do formulário.
     * A classe filha deve implementar esta lógica para popular o formulário.
     * @param data Os dados recebidos do DynamicDialogConfig.
     */
    protected abstract onInitDialog(data: T | null): void;

    /**
     * Monta um FormGroup com seus controles. Implementado pela classe filha.
     * @returns Um FormGroup.
     */
    protected abstract newForm(): FormGroup;

    /**
     * Constrói o objeto do tipo T a partir dos valores do FormGroup. Implementado pela classe filha.
     * @returns O objeto de modelo preenchido.
     */
    protected abstract getFormValue(): T;

    /**
     * Lida com a submissão do formulário.
     */
    onSubmit(): void {
        this.invalidControls = [];
        if (this.form.valid) {
            const formValue = this.getFormValue();
            this.ref.close(formValue);
        } else {
            this.invalidControls = checkFormValidations(this.form);
            this.showWarn(this.translate.translate('base-components.base-forms.validation-warning'));
        }
    }

    /**
     * Fecha o diálogo sem salvar.
     */
    onCancel(): void {
        this.ref.close(null);
    }
}
