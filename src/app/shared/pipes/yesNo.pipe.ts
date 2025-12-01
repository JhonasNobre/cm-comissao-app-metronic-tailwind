import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Injectable({
    providedIn: 'root'
})

@Pipe({
    name: 'yesNo',
    standalone: true,
    pure: true
})
export class YesNoPipe implements PipeTransform {
    constructor(private translate: TranslocoService) { }

    transform(value: any): string {
        const key = value ? 'SHARED.COMMON.YES' : 'SHARED.COMMON.NO';
        return this.translate.translate(key);
    }
}
