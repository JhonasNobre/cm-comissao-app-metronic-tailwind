import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
    standalone: true,
    selector: 'app-dialog',
    template: `
    <div class="error-dialog-content">
      <div [innerHtml]="config.data.message"></div>
    </div>
  `,
    styles: [`
    .error-dialog-content {
      padding: 1rem;
    }
    .error-dialog-content h2 {
      color: var(--red-500); /* Use a cor de erro do seu tema PrimeNG */
      margin-top: 0;
      margin-bottom: 1rem;
    }
    /* Estilos adicionais para melhorar a apresentação das mensagens */
    .error-dialog-content div[innerHtml] {
      max-height: 300px; /* Limita a altura para scroll */
      overflow-y: auto; /* Adiciona scroll se o conteúdo for grande */
      background-color: var(--red-50);
      border: 1px solid var(--red-200);
      padding: 10px;
      border-radius: 4px;
      font-size: 0.9em;
      line-height: 1.5;
    }
  `],
    imports: [CommonModule, ButtonModule]
})
export class DialogComponent implements OnInit {
    constructor(public ref: DynamicDialogRef, public config: DynamicDialogConfig) { }

    ngOnInit(): void {
        // Acessa os dados passados para o diálogo via config.data
        // config.data.title e config.data.message
    }
}
