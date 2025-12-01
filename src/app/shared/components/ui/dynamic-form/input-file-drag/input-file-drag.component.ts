import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { FileRemoveEvent, FileSelectEvent, FileUploadHandlerEvent, FileUploadModule } from 'primeng/fileupload';

@Component({
    selector: 'app-input-file-drag',
    templateUrl: './input-file-drag.component.html',
    standalone: true,
    imports: [CommonModule, FileUploadModule, TranslocoModule, ButtonModule]
})
export class InputFileDragComponent {
    @Input() disabled: boolean = false;
    @Input() acceptType = "application/pdf, image/png, image/jpeg, .xlsx, .xls";
    @Input() maxFiles = 1;

    @Output() inputFile: EventEmitter<File[]> = new EventEmitter<File[]>();

    files: File[] = [];

    constructor() { }

    onFileSelect(event: FileSelectEvent): void {
        const newFiles = event.files;
        this.files.push(...newFiles);
        if (this.maxFiles > 0 && this.files.length > this.maxFiles) {
            this.files = this.files.slice(-this.maxFiles); // Mantém apenas os últimos arquivos até o limite
        }
        this.emitValue();
    }

    onFileRemove(event: FileRemoveEvent): void {
        this.files = this.files.filter(f => f.name !== event.file.name || f.size !== event.file.size);
        this.emitValue();
    }

    onFilesClear(): void {
        this.files = [];
        this.emitValue();
    }

    private emitValue(): void {
        this.inputFile.emit(this.files);
    }

    // Método privado para centralizar a lógica de atualização e emissão
    private updateFiles(files: File[]): void {
        this.files = [...files]; // Cria uma nova referência para a array para garantir a detecção de mudanças
        this.inputFile.emit(this.files);
    }

    onUploadHandler(event: FileUploadHandlerEvent): void {
        // Nenhuma lógica é necessária aqui. A presença deste método atende ao contrato
        // do (uploadHandler) e previne o upload automático.
        // O upload real será feito pelo componente pai.
    }
}
