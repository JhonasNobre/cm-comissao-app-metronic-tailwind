import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DynamicFormComponent } from './dynamic-form.component';

@Component({
    selector: 'app-dynamic-form-dialog',
    standalone: true,
    imports: [CommonModule, DialogModule, DynamicFormComponent],
    template: `
    <app-dynamic-form
      [questions]="config.data.questions"
      [objectName]="config.data.objectName"
      [hasFileUpload]="config.data.hasFileUpload"
      [acceptType]="config.data.acceptType"
      [maxFiles]="config.data.maxFiles"
      [fileName]="config.data.fileName"
      [userUpdate]="config.data.userUpdate"
      [convertedDate]="config.data.convertedDate"
      (formSubmit)="dialogRef.close($event)"
      (close)="dialogRef.close(null)"
    ></app-dynamic-form>
  `
})

export class DynamicFormDialogComponent {
    constructor(public dialogRef: DynamicDialogRef, public config: DynamicDialogConfig) {
    }
}
