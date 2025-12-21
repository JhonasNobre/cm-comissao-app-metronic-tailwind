import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ImobtechConfiguration, ImobtechConfigurationResponse } from '../models/imobtech-configuration.model';

@Injectable({
    providedIn: 'root'
})
export class ImobtechConfigurationService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    getConfiguracao(): Observable<ImobtechConfigurationResponse> {
        return this.http.get<ImobtechConfigurationResponse>(`${this.apiUrl}/v1/imobtech/configuration`);
    }

    atualizarConfiguracao(request: ImobtechConfiguration): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/v1/imobtech/configuration`, request);
    }
}
