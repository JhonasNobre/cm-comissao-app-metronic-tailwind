import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export abstract class BaseService {
    constructor(protected http: HttpClient, private apiName: string) { }

    protected get baseUrl(): string {
        return `${environment.apiUrl}${this.apiName}`;
    }

    protected buildHttpParams(params: any): HttpParams {
        let httpParams = new HttpParams();
        if (!params) return httpParams;

        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                if (value instanceof Date) {
                    // ...formata para 'AAAA-MM-DD' antes de enviar.
                    const formattedDate = value.toISOString().split('T')[0];
                    httpParams = httpParams.set(key, formattedDate);
                }
                else if (Array.isArray(value)) {
                    value.forEach((item: any) => httpParams = httpParams.append(key, item));
                } else {
                    httpParams = httpParams.set(key, String(value));
                }
            }
        });
        return httpParams;
    }
}
