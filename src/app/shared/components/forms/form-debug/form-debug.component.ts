import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
    selector: 'app-form-debug',
    templateUrl: './form-debug.component.html',
    standalone: true,
    imports: [CommonModule, TranslocoPipe],
})
export class FormDebugComponent {
    @Input() form!: FormGroup;
}
