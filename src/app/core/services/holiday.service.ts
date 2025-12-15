import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Holiday } from '../models/holiday.model';

@Injectable({
    providedIn: 'root'
})
export class HolidayService {
    private readonly apiUrl = `${environment.apiUrl}/v1/feriados`;

    constructor(private http: HttpClient) { }

    /**
     * Lista feriados filtrados por ano, tipo e/ou estado
     */
    listByFilters(params: {
        ano?: number;
        tipo?: 'Nacional' | 'Estadual' | 'Municipal';
        estadoUf?: string;
    }): Observable<Holiday[]> {
        let httpParams = new HttpParams();

        if (params.ano) {
            httpParams = httpParams.set('ano', params.ano.toString());
        }
        if (params.tipo) {
            httpParams = httpParams.set('tipo', params.tipo);
        }
        if (params.estadoUf) {
            httpParams = httpParams.set('estadoUf', params.estadoUf);
        }

        return this.http.get<Holiday[]>(this.apiUrl, { params: httpParams });
    }

    /**
     * Lista apenas feriados nacionais do ano atual
     */
    listNationalHolidays(): Observable<Holiday[]> {
        const currentYear = new Date().getFullYear();
        return this.listByFilters({ ano: currentYear, tipo: 'Nacional' });
    }

    /**
     * Lista feriados regionais (estaduais + municipais) para uma localização específica
     */
    listRegionalHolidays(estadoUf: string, municipioCodigoIbge?: string): Observable<Holiday[]> {
        const currentYear = new Date().getFullYear();
        return this.listByFilters({ ano: currentYear, estadoUf });
    }
}
