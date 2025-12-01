import { Component } from '@angular/core';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
    standalone: true,
    selector: 'app-confirm-dialog',
    imports: [ConfirmDialogModule],
    template: `
    <p-confirmDialog
      [style]="{ width: '450px' }"
      [appendTo]="'body'"
      acceptButtonStyleClass="p-button-danger"
      rejectButtonStyleClass="p-button-secondary"
      acceptIcon="pi pi-check"
      rejectIcon="pi pi-times"
    ></p-confirmDialog>
  `
})
export class ConfirmDialogComponent { }
