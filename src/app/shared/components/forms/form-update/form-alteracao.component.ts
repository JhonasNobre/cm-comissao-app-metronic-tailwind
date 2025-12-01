import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
@Component({
    selector: 'app-form-alteracao',
    templateUrl: './form-alteracao.component.html',
    standalone: true,
    imports: [CommonModule],
})
export class FormAlteracaoComponent {
    @Input() form!: FormGroup;

    constructor() { }
}
