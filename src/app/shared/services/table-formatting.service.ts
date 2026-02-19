import { Injectable } from '@angular/core';
import { EnumLabelPipe } from '../pipes/enum-label.pipe';
import { StatusPipe } from '../pipes/status.pipe';
import { YesNoPipe } from '../pipes/yesNo.pipe';
import { BaseEntity } from '../models/base-model';
import { ColumnHeader } from '../models/column-header.model';


@Injectable({
    providedIn: 'root'
})
export class TableFormattingService {
    constructor(
        // private translate: TranslocoService,
        private yesNoPipe: YesNoPipe,
        // private zipCodePipe: ZipCodeFormatPipe,
        // private currencyFormatPipe: CurrencyFormatPipe,
        // private dateFormatPipe: DateFormatPipe,
        // private dateTimeFormatPipe: DateTimeFormatPipe,
        // private documentPipe: DocumentFormatPipe,
        // private personDocumentPipe: PersonDocumentFormatPipe,
        private statusPipe: StatusPipe,
        private enumLabelPipe: EnumLabelPipe,
        // private lookupPipe: LookupPipe
    ) { }

    public formatCell<T extends BaseEntity>(item: T, column: ColumnHeader<T>): string {
        const raw = item[column.field as keyof T];
        if (raw == null) return '';

        let formatted: string = '';

        if (column.formatter) {
            try {
                return column.formatter(raw, item);
            } catch (error) {
                console.error('Erro no formatter personalizado:', error);
                return String(raw);
            }
        }

        switch (column.pipe) {
            // case 'currencyFormat': {
            //     if (typeof raw !== 'number' || isNaN(raw)) throw new Error(`Valor inválido para 'currencyFormat'. Esperava um número, recebeu: ${raw}`);
            //     formatted = this.currencyFormatPipe.transform(raw, countryCustom) ?? '';
            //     break;
            // }
            case 'dateFormat':
            case 'dateTimeFormat': {
                const dateVal = typeof raw === 'string' ? new Date(raw) : (raw as unknown as Date);
                if (isNaN(dateVal.getTime())) throw new Error(`Valor de data inválido fornecido: ${raw}`);

                // Formatação manual simples se o pipe não estiver injetado/disponível
                const day = String(dateVal.getDate()).padStart(2, '0');
                const month = String(dateVal.getMonth() + 1).padStart(2, '0');
                const year = dateVal.getFullYear();

                if (column.pipe === 'dateFormat') {
                    return `${day}/${month}/${year}`;
                }

                const hours = String(dateVal.getHours()).padStart(2, '0');
                const minutes = String(dateVal.getMinutes()).padStart(2, '0');
                return `${day}/${month}/${year} ${hours}:${minutes}`;
            }
            case 'zipCodeFormat':
            case 'documentFormat':
            // case 'personDocumentFormat': {
            //     if (typeof raw !== 'string') throw new Error(`Valor inválido para formatação de documento/CEP. Esperava uma string, recebeu: ${typeof raw}`);
            //     if (column.pipe === 'zipCodeFormat') formatted = this.zipCodePipe.transform(raw, countryCustom) ?? '';
            //     else if (column.pipe === 'documentFormat') formatted = this.documentPipe.transform(raw, countryCustom) ?? '';
            //     else formatted = this.personDocumentPipe.transform(raw, countryCustom, !!column.pipeArgs) ?? '';
            //     break;
            // }
            case 'enumLabel': {
                const enumName = column.enumType;
                if (typeof raw !== 'number' || typeof enumName !== 'string') throw new Error(`Tipos inválidos para 'enumLabel'. Valor: ${raw}, Enum: ${enumName}`);
                formatted = this.enumLabelPipe.transform(raw, enumName) ?? '';
                break;
            }
            case 'yesNo':
            case 'status': {
                if (typeof raw !== 'boolean') throw new Error(`Valor inválido para formatação booleana. Esperava um booleano, recebeu: ${typeof raw}`);
                const pipe = column.pipe === 'yesNo' ? this.yesNoPipe : this.statusPipe;
                formatted = pipe.transform(raw);
                break;
            }
            case 'companyName': {
                if (raw && typeof raw === 'object' && (raw as any).name) {
                    formatted = (raw as any).name;
                } else if (typeof raw === 'string') {
                    formatted = raw;
                } else {
                    formatted = '';
                }
                break;
            }
            case 'lookup': {
                const lookupType = column.lookupType;

                if (!lookupType) {
                    return String(raw);
                }

                //formatted = this.lookupPipe.transform(raw as any as number, lookupType);
                break;
            }
            default:
                formatted = String(raw);
                break;
        }

        // if (column.hasTranslate && formatted) {
        //     return this.translate.translate(formatted);
        // }

        return formatted;
    }
}
