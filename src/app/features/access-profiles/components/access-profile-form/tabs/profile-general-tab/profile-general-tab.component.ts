import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
    selector: 'app-profile-general-tab',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        InputTextModule,
        InputNumberModule,
        CheckboxModule
    ],
    templateUrl: './profile-general-tab.component.html'
})
export class ProfileGeneralTabComponent {
    @Input() form!: FormGroup;
}
