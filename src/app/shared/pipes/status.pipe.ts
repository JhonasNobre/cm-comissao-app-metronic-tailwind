import { Injectable, Pipe, PipeTransform } from '@angular/core';
// import { TranslocoService } from '@jsverse/transloco';

@Injectable({
    providedIn: 'root'
})

@Pipe({
    name: 'status',
    standalone: true
})

export class StatusPipe implements PipeTransform {
    transform(value: any, args?: any): any {
        return value ? "Ativo" : "Inativo";
    }
}
