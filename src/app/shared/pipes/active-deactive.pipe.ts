import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
@Injectable({
    providedIn: 'root'
})
@Pipe({
    name: 'activeDeactive',
    standalone: true
})

export class ActiveDeactivePipe implements PipeTransform {
    constructor(private translate: TranslocoService) { }

    transform(value: any, args?: any): any {
        const key = value ? "SHARED.COMMON.ACTIVE" : "SHARED.COMMON.INACTIVE";
        return this.translate.translate(key);
    }
}
