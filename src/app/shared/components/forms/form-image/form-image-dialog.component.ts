import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common'; // Importante para diretivas como *ngIf, *ngFor, etc.

// Imports da PrimeNG
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-form-image-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FileUploadModule,
    ButtonModule
  ],
  templateUrl: './form-image-dialog.component.html',
})
export class FormImageDialogComponent {
  @ViewChild('fileUpload') fileUploadComponent!: FileUpload;
  @Output() fileUpload = new EventEmitter<any>();

  constructor(public dialogRef: DynamicDialogRef, private messageService: MessageService) {}

   onCustomUpload(event: any): void {

        const file = event.files[0];

        if (file.size > 5000000) {
            const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
            // Exibir mensagem manualmente
            this.messageService.add({
            severity: 'error',
            summary: `Tamanho da imagem (${sizeInMB} MB), é maior do que o permitido`,
            detail: 'O tamanho máximo permitido é de 5MB.'
            });
            return;
        }

        if (event.files && event.files.length > 0) {
        // Passa o arquivo diretamente ao fechar o dialog
        this.closeDialog({ success: true, file: event.files[0] });
        } else {
        this.closeDialog({ success: false });
        }
  }

  startUpload(): void {  }


  closeDialog(data: any): void {
    this.dialogRef.close(data);
  }
}
