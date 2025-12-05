import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BaseService } from '../../../shared/services/base/base.service';
import { Holiday, HolidayType } from '../models/holiday.model';
import { CreateHolidayRequest, UpdateHolidayRequest } from '../models/holiday-request.dto';

@Injectable({
    providedIn: 'root'
})
export class HolidayService extends BaseService {

    constructor(http: HttpClient) {
        super(http, '/v1/feriados');
    }

    list(params?: { ano?: number; tipo?: string; estadoUf?: string }): Observable<Holiday[]> {
        const httpParams = this.buildHttpParams(params);
        return this.http.get<any[]>(`${this.baseUrl}`, { params: httpParams }).pipe(
            map(holidays => holidays.map(this.mapResponseToModel))
        );
    }

    get(id: string): Observable<Holiday> {
        return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
            map(this.mapResponseToModel)
        );
    }

    create(holiday: Holiday): Observable<string> {
        const request: CreateHolidayRequest = this.mapModelToCreateRequest(holiday);
        return this.http.post<string>(`${this.baseUrl}`, request);
    }

    update(holiday: Holiday, id: string): Observable<boolean> {
        const request: UpdateHolidayRequest = this.mapModelToUpdateRequest(holiday);
        return this.http.put<void>(`${this.baseUrl}/${id}`, request).pipe(map(() => true));
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    /**
     * Maps backend response (Portuguese) to frontend model (English)
     */
    private mapResponseToModel(response: any): Holiday {
        return {
            id: response.id,
            name: response.nome,
            date: new Date(Number(response.data.split('-')[0]), Number(response.data.split('-')[1]) - 1, Number(response.data.split('-')[2])),
            type: HolidayService.mapTipoToHolidayType(response.tipo),
            stateCode: response.estadoUF,
            city: response.municipio
        } as Holiday;
    }

    /**
     * Maps tipo string from backend to HolidayType enum
     */
    private static mapTipoToHolidayType(tipo: string): HolidayType {
        switch (tipo?.toLowerCase()) {
            case 'nacional': return HolidayType.NATIONAL;
            case 'estadual': return HolidayType.STATE;
            case 'municipal': return HolidayType.MUNICIPAL;
            default: return HolidayType.NATIONAL;
        }
    }

    /**
     * Maps HolidayType enum to backend tipo number
     */
    private static mapHolidayTypeToTipo(type: HolidayType): number {
        switch (type) {
            case HolidayType.NATIONAL: return 1;
            case HolidayType.STATE: return 2;
            case HolidayType.MUNICIPAL: return 3;
            default: return 1;
        }
    }

    /**
     * Maps frontend model (English) to backend create request (Portuguese)
     */
    private mapModelToCreateRequest(holiday: Holiday): CreateHolidayRequest {
        let dateValue = holiday.date;

        // Garantir que é um objeto Date válido
        if (!(dateValue instanceof Date)) {
            dateValue = new Date(dateValue);
        }

        // Se data inválida, usar data atual ou lançar erro amigável
        if (isNaN(dateValue.getTime())) {
            console.error('Invalid date provided:', holiday.date);
            dateValue = new Date(); // Fallback seguro
        }

        return {
            nome: holiday.name,
            data: dateValue.toISOString().split('T')[0],
            tipo: HolidayService.mapHolidayTypeToTipo(holiday.type),
            estadoUF: holiday.stateCode,
            municipio: holiday.city
        };
    }

    /**
     * Maps frontend model (English) to backend update request (Portuguese)
     */
    private mapModelToUpdateRequest(holiday: Holiday): UpdateHolidayRequest {
        let dateValue = holiday.date;

        // Garantir que é um objeto Date válido
        if (!(dateValue instanceof Date)) {
            dateValue = new Date(dateValue);
        }

        // Se data inválida, usar data atual ou lançar erro amigável
        if (isNaN(dateValue.getTime())) {
            console.error('Invalid date provided:', holiday.date);
            dateValue = new Date(); // Fallback seguro
        }

        return {
            nome: holiday.name,
            data: dateValue.toISOString().split('T')[0],
            tipo: HolidayService.mapHolidayTypeToTipo(holiday.type),
            estadoUF: holiday.stateCode,
            municipio: holiday.city
        };
    }
}
