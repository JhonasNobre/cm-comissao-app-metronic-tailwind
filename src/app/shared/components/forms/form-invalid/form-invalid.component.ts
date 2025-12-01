import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
@Component({
    selector: 'app-form-invalid',
    templateUrl: './form-invalid.component.html',
    standalone: true,
    imports: [CommonModule, TranslocoPipe],
})
export class FormInvalidComponent {
    @Input() invalidControle: string[] = [];
}
