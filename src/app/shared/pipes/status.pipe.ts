import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Injectable({
    providedIn: 'root'
})

@Pipe({
    name: 'status',
    standalone: true
})

export class StatusPipe implements PipeTransform {
    constructor(private translate: TranslocoService) { }

    transform(value: any, args?: any): any {
        const key = value ? "general.singular.active" : "general.singular.inactive";
        return this.translate.translate(key);
    }
}
