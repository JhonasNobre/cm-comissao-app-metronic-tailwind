import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from '../../../shared/services/base/base.service';
import { State } from '../models/state.model';
import { City } from '../models/city.model';

@Injectable({
    providedIn: 'root'
})
export class StateService extends BaseService {

    constructor(http: HttpClient) {
        super(http, '/v1/localizacao');
    }

    list(): Observable<State[]> {
        return this.http.get<State[]>(`${this.baseUrl}/estados`);
    }

    listCities(stateId: string): Observable<City[]> {
        return this.http.get<City[]>(`${this.baseUrl}/estados/${stateId}/municipios`);
    }

    importExcel(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('arquivo', file);
        return this.http.post(`${this.baseUrl}/importar`, formData);
    }
}
