import { Injectable, Pipe, PipeTransform } from '@angular/core';
// import { TranslocoService } from '@jsverse/transloco';

@Injectable({
    providedIn: 'root'
})

@Pipe({
    name: 'yesNo',
    standalone: true,
    pure: true
})
export class YesNoPipe implements PipeTransform {
    transform(value: any): string {
        return value ? 'Sim' : 'Não';
    }
}
