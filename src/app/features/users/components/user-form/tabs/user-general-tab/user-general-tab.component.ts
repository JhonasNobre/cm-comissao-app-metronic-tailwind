import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-user-general-tab',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        InputTextModule,
        InputMaskModule,
        PasswordModule,
        SelectModule,
        MultiSelectModule,
        ButtonModule
    ],
    templateUrl: './user-general-tab.component.html'
})
export class UserGeneralTabComponent {
    @Input() form!: FormGroup;
    @Input() teams: any[] = [];
    @Input() isManager: boolean = false;
    @Input() isEditMode: boolean = false;
    @Input() accessProfiles: any[] = [];
    @Input() userRoleOptions: any[] = [];
    @Input() keycloakRoleOptions: any[] = [];

    getRoleLabel(value: string): string {
        const role = this.keycloakRoleOptions.find(r => r.value === value);
        return role ? role.label : value;
    }
}
