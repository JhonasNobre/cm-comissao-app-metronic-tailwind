import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { Color } from '../models/common/enuns/color.enum';

const enumMap: Record<string, any> = {
    DocumentType,
    Color
};

@Injectable({
    providedIn: 'root'
})

@Pipe({
    name: 'enumLabel',
    standalone: true
})
export class EnumLabelPipe implements PipeTransform {
    constructor(private translate: TranslocoService) { }

    transform(value: number, enumType: string | any): string {
        if (value == null || value === undefined) return '';

        let enumObj = typeof enumType === 'string' ? enumMap[enumType] : enumType;

        if (!enumObj) return value.toString();

        const enumKey = enumObj[value];

        if (!enumKey) return value.toString();

        return this.translate.translate(enumKey);
    }
}
