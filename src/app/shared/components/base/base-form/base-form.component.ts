import { Directive, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { BaseComponent } from '../base.component';
import { checkFormValidations } from '../../../services/common-util.service';

/**
 * Estrutura de dados que o hook 'onDialogReady' receberá.
 * Mantendo o nome 'DialogReadyData' por compatibilidade ou renomeando para 'FormReadyData'?
 * Vamos renomear para FormReadyData para fazer sentido.
 */
export interface FormReadyData<T> {
    entity?: T; // Presente apenas no modo de edição
    dependencies?: any;
}

@Directive()
export abstract class BaseFormComponent<T extends { [key: string]: any; }> extends BaseComponent implements OnInit, OnDestroy {
    form!: FormGroup;
    isLoading = false;
    invalidControls: string[] = [];

    // --- Injeções de Dependência ---
    protected formBuilder = inject(FormBuilder);
    protected route = inject(ActivatedRoute);

    // --- Propriedades de Estado ---
    protected entity: T | undefined;
    protected destroy$ = new Subject<void>();
    protected isEditMode = false;
    protected entityId: string | null = null;

    /**
     * O ngOnInit agora orquestra o carregamento dos dados para o formulário.
     */
    ngOnInit(): void {
        this.form = this.newForm();

        // Tenta pegar o ID da rota
        this.entityId = this.route.snapshot.paramMap.get('id');
        this.isEditMode = !!this.entityId;

        const dependencies$ = this.loadDependencies() || of(null);

        this.isLoading = true;

        if (this.isEditMode && this.entityId) {
            // --- MODO EDIÇÃO ---
            const entity$ = this.loadEntityForEdit(this.entityId);
            forkJoin({ entity: entity$, dependencies: dependencies$ }).subscribe({
                next: ({ entity, dependencies }) => {
                    this.entity = entity;
                    this.onFormReady({ entity, dependencies });
                    this.isLoading = false;
                },
                error: (err) => {
                    console.error('Erro ao carregar dados', err);
                    this.showError('Erro ao carregar dados do formulário');
                    this.isLoading = false;
                    this.onCancel(); // Volta para a lista em caso de erro fatal
                }
            });
        } else {
            // --- MODO CRIAÇÃO ---
            dependencies$.subscribe({
                next: (dependencies) => {
                    this.onFormReady({ dependencies });
                    this.isLoading = false;
                },
                error: (err) => {
                    console.error('Erro ao carregar dependências', err);
                    this.isLoading = false;
                }
            });
        }
    }

    /**
     * O ciclo de vida ngOnDestroy agora é gerenciado pela classe base.
     */
    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // --- MÉTODOS ABSTRATOS (O que a classe filha DEVE implementar) ---
    protected abstract newForm(): FormGroup;
    protected abstract getFormValue(): T;
    protected abstract loadEntityForEdit(id: any): Observable<T>;
    protected abstract onFormReady(data: FormReadyData<T>): void;
    protected abstract onSave(data: T): void; // Método abstrato para salvar

    // --- MÉTODOS OPCIONAIS (A classe filha PODE implementar) ---
    protected loadDependencies(): Observable<any> | null {
        return null;
    }

    // --- MÉTODOS CONCRETOS (Lógica de formulário) ---
    onSubmit(): void {
        this.invalidControls = [];

        if (this.form.valid) {
            const formValue = this.getFormValue();
            this.onSave(formValue);
        } else {
            console.warn('BaseFormComponent - form inválido');
            this.invalidControls = checkFormValidations(this.form);
            this.showWarn(this.translate.translate('base-components.base-forms.validation-warning'));
            console.warn('Controles inválidos:', this.invalidControls);
        }
    }

    onCancel(): void {
        // Navega para a rota pai (lista) por padrão
        this.router.navigate(['..'], { relativeTo: this.route });
    }
}
