import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

// PrimeNG
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';

import { Session } from '../../../models/common/session.model';
import { SessionService } from '../../../services/session.service';
import { FormFieldErrorComponent } from '../../forms/form-field-error/form-field-error.component';
import { FormItemBase } from './models/form-item-base';

@Component({
    selector: 'app-dynamic-form-question',
    imports: [
        CommonModule, FormsModule, ReactiveFormsModule, TranslocoModule, InputTextModule, DatePickerModule, SelectModule, MultiSelectModule,
        CheckboxModule, FormFieldErrorComponent, InputNumberModule],
    templateUrl: './dynamic-form-question.component.html'
})
export class DynamicFormQuestionComponent implements OnInit {
    @Input() question!: FormItemBase;
    @Input() form!: FormGroup;
    @Output() checkEvent = new EventEmitter<boolean>();

    session: Session | undefined;
    optCurrency = { prefix: '', thousands: '.', decimal: ',' };
    currencyCode = 'BRL';

    // Mapeamento de símbolos/códigos para ISO 4217
    private static currencyMap: Record<string, string> = {
        'S/.': 'PEN',   // Peru
        'R$': 'BRL',    // Brasil
        '$': 'ARS',     // Argentina (padrão para $)
        '£': 'FKP',     // Ilhas Malvinas
        'Bs': 'BOB',    // Bolívia
        '₲': 'PYG',     // Paraguai
        'CLP': 'CLP',   // Chile (caso venha o código)
        'ECS': 'USD',   // Equador
        'UYU': 'UYU',   // Uruguai (caso venha o código)
        // Adicionais para robustez
        'CL$': 'CLP',   // Chile (variação)
        'US$': 'USD',   // EUA (variação)
        'EC$': 'USD',   // Equador (variação)
        'USD': 'USD',   // EUA
    };

    constructor(private sessionService: SessionService, private cdr: ChangeDetectorRef) {}

    async ngOnInit(): Promise<void> {
        this.session = await this.sessionService.getSession();
        let rawCurrency = this.session?.countryCustom?.currencyCode;
        // Se vier símbolo, converte para código ISO
        this.currencyCode = DynamicFormQuestionComponent.currencyMap[rawCurrency ?? ''] || rawCurrency || 'BRL';
        if (this.session?.countryCustom?.currencyCode) {
            this.optCurrency.prefix = `${this.session.countryCustom.currencyCode} `;
        } else {
            this.optCurrency.prefix = '';
        }
        this.cdr.detectChanges();
    }

    get control() {
        return this.form.controls[this.question.key];
    }

    get isValid(): boolean {
        return this.control.valid || this.control.pristine;
    }

    onCheckboxChange(event: any) {
        this.checkEvent.emit(event.checked);
    }
}
