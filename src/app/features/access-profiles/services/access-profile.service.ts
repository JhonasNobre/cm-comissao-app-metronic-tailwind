import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BaseService } from '../../../shared/services/base/base.service';
import { AccessProfile } from '../models/access-profile.model';

import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AccessProfileService extends BaseService {

    constructor(http: HttpClient) {
        super(http, '/v1/perfis-acesso');
    }

    list(params?: any): Observable<AccessProfile[]> {
        const httpParams = this.buildHttpParams(params);
        return this.http.get<AccessProfile[]>(`${this.baseUrl}`, { params: httpParams });
    }

    get(id: string): Observable<AccessProfile> {
        return this.http.get<AccessProfile>(`${this.baseUrl}/${id}`);
    }

    create(profile: any): Observable<string> {
        return this.http.post<string>(`${this.baseUrl}`, profile);
    }

    update(id: string, profile: any): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/${id}`, profile);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    listResources(): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}/v1/recursos`);
    }
}
