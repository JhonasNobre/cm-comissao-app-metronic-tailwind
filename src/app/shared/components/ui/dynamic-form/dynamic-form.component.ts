import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';

import { DialogModule } from 'primeng/dialog';
import { NotificationService } from '../../../../core/services/notification.service';
import { checkFormValidations, toFormGroup } from '../../../services/common-util.service';
import { DynamicFormQuestionComponent } from './dynamic-form-question.component';
import { InputFileDragComponent } from './input-file-drag/input-file-drag.component';
import { FormItemBase } from './models/form-item-base';

@Component({
    selector: 'app-dynamic-form',
    imports: [CommonModule, ReactiveFormsModule, ButtonModule, TranslocoModule, DynamicFormQuestionComponent, InputFileDragComponent, DialogModule],
    templateUrl: './dynamic-form.component.html'
})

export class DynamicFormComponent implements OnInit {
    protected notificationService = inject(NotificationService);
    protected config = inject(DynamicDialogConfig, { optional: true });

    form!: FormGroup;

    @Input() questions: FormItemBase[] | null = [];
    @Input() objectName = '';
    @Input() hasFileUpload = false;
    @Input() acceptType = '';
    @Input() maxFiles = 1;
    @Input() fileName?: string;
    @Input() userUpdate?: string;
    @Input() convertedDate?: string;

    @Output() formSubmit = new EventEmitter<any>();
    @Output() close = new EventEmitter<any>();

    files: File[] = [];

    ngOnInit(): void {
        this.initializeForm();
    }

    protected initializeForm(): void {
        const data = this.config?.data || {};
        this.questions = data.questions || this.questions || [];
        this.objectName = this.objectName || data.objectName || '';
        this.hasFileUpload = this.hasFileUpload || data.hasFileUpload || false;
        this.acceptType = this.acceptType || data.acceptType || '';
        this.maxFiles = this.maxFiles !== 1 ? this.maxFiles : (data.maxFiles ?? 1);
        this.fileName = this.fileName || data.fileName;
        this.userUpdate = this.userUpdate || data.userUpdate;
        this.convertedDate = this.convertedDate || data.convertedDate;

        this.form = toFormGroup(this.questions);
    }

    onFilesChange(files: File[]): void {
        this.files = files;
    }

    submitForm(value: { [key: string]: any }): void {
        let invalidControls = [];
        if (this.form.valid) {
            this.formSubmit.emit({ form: value, files: this.files });
        } else {
            invalidControls = checkFormValidations(this.form);
            this.notificationService.error('Por favor, corrija os erros no formulário.');
            return;
        }
    }

    onClose(){
        this.close.emit();
    }
}
