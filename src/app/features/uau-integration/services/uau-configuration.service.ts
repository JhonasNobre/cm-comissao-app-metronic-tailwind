import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UauConfiguration, UauConfigurationResponse } from '../models/uau-configuration.model';

@Injectable({
    providedIn: 'root'
})
export class UauConfigurationService {
    private http = inject(HttpClient);
    private readonly API_URL = `${environment.apiUrl}/v1/integracoes/uau/configuracao`;

    getCredenciais(): Observable<UauConfigurationResponse> {
        return this.http.get<UauConfigurationResponse>(`${this.API_URL}/credenciais`);
    }

    atualizarCredenciais(config: UauConfiguration): Observable<void> {
        return this.http.put<void>(`${this.API_URL}/credenciais`, config);
    }
}
