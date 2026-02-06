import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { OrigemPagamentoService } from '../services/origem-pagamento.service';
import { OrigemPagamento } from '../models/origem-pagamento.model';

@Component({
    selector: 'app-origem-pagamento-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        InputTextModule,
        TextareaModule,
        CheckboxModule,
        ButtonModule
    ],
    templateUrl: './origem-pagamento-form.component.html'
})
export class OrigemPagamentoFormComponent implements OnChanges {
    private fb = inject(FormBuilder);
    private service = inject(OrigemPagamentoService);

    @Input() origem: OrigemPagamento | null = null;
    @Input() idEmpresa = '';

    @Output() save = new EventEmitter<boolean>();
    @Output() cancel = new EventEmitter<void>();

    form: FormGroup;
    saving = false;

    constructor() {
        this.form = this.fb.group({
            nome: ['', [Validators.required, Validators.maxLength(255)]],
            descricao: ['', [Validators.maxLength(1000)]],
            isDefault: [false]
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['origem'] && this.origem) {
            this.form.patchValue({
                nome: this.origem.nome,
                descricao: this.origem.descricao,
                isDefault: this.origem.isDefault
            });
        } else if (changes['origem'] && !this.origem) {
            this.form.reset({ isDefault: false });
        }
    }

    onSubmit() {
        if (this.form.invalid) return;

        this.saving = true;
        const formValue = this.form.value;

        if (this.origem) {
            // Update
            this.service.update(this.origem.id, formValue).subscribe({
                next: () => {
                    this.saving = false;
                    this.save.emit(true);
                },
                error: (err) => {
                    console.error(err);
                    this.saving = false;
                    // Error handling should be done by parent or here if needed
                }
            });
        } else {
            // Create
            const createRequest = {
                ...formValue,
                idEmpresa: this.idEmpresa
            };

            this.service.create(createRequest).subscribe({
                next: () => {
                    this.saving = false;
                    this.save.emit(true);
                },
                error: (err) => {
                    console.error(err);
                    this.saving = false;
                }
            });
        }
    }

    onCancel() {
        this.cancel.emit();
    }
}
