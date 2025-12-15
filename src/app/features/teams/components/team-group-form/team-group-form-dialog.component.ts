import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ColorPickerModule } from 'primeng/colorpicker';
import { DividerModule } from 'primeng/divider';
import { BaseFormDialogComponent } from '../../../../shared/components/base/base-form/base-form-dialog.component';
import { TeamGroup } from '../../services/team-group.service';

@Component({
    selector: 'app-team-group-form-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        ColorPickerModule,
        DividerModule
    ],
    templateUrl: './team-group-form-dialog.component.html'
})
export class TeamGroupFormDialogComponent extends BaseFormDialogComponent<TeamGroup> {

    loading = false; // Necessário para o template

    protected override onInitDialog(data: any): void {
        if (data && data.id) {
            this.form.patchValue({
                id: data.id,
                nome: data.nome,
                descricao: data.descricao,
                cor: data.cor
            });
        }
    }

    save() {
        this.onSubmit();
    }

    close() {
        this.onCancel();
    }

    protected override newForm(): FormGroup {
        return this.formBuilder.group({
            id: [null],
            nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
            descricao: [''],
            cor: ['#3b82f6'] // Cor padrão (azul)
        });
    }

    protected override getFormValue(): TeamGroup {
        return this.form.getRawValue();
    }
}
