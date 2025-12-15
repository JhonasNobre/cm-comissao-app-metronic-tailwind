import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AccordionModule } from 'primeng/accordion';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
    selector: 'app-profile-access-tab',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        AccordionModule,
        CheckboxModule
    ],
    templateUrl: './profile-access-tab.component.html'
})
export class ProfileAccessTabComponent implements OnChanges {
    @Input() form!: FormGroup;
    @Input() resources: any[] = [];
    @Input() permissionRows: any[] = [];
    @Output() permissionsChange = new EventEmitter<any[]>();

    activeIndices: number[] = [];

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['resources']) {
            this.initActiveIndices();
        }
    }

    private initActiveIndices(): void {
        // Abrir todos os acordeões por padrão
        this.activeIndices = this.resources.map((_, index) => index);
    }

    isOpen(index: number): boolean {
        return this.activeIndices.includes(index);
    }

    getPermissionRow(resourceId: string): any {
        return this.permissionRows.find(r => r.recursoId === resourceId);
    }

    onPermissionChange(): void {
        this.permissionsChange.emit(this.permissionRows);
    }
}
