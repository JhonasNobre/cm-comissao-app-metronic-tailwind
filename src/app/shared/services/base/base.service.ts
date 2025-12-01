import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { appEnvironment } from '../../../app.environment';
import { ApiResponse } from '../../models/common/api-response.model';

@Injectable({ providedIn: 'root' })
export abstract class BaseService<T> {
    constructor(protected http: HttpClient, private apiName: string, private modelType?: new (init?: Partial<T>) => T) { }

    protected get baseUrl(): string {
        return `${appEnvironment.urlApi}${this.apiName}`;
    }

    protected get baseUrlReport(): string {
        return `${appEnvironment.urlReport}${this.apiName}`;
    }

    list(params: any): Observable<T[]> {
        const httpParams = this.buildHttpParams(params);
        return this.http.get<ApiResponse<T[]>>(`${this.baseUrl}`, { params: httpParams }).pipe(
            map(response => {
                const data = response.data || [];
                return this.modelType ? data.map(item => new this.modelType!(item)) : data;
            }),
            first()
        );
    }

    get(id: number): Observable<T> {
        return this.http.get<ApiResponse<T>>(`${this.baseUrl}/${id}`).pipe(
            map(response => {
                const data = response.data;
                return this.modelType && data ? new this.modelType(data) : data;
            }),
            first()
        );
    }

    create(obj: T): Observable<T> {
        return this.http.post<ApiResponse<T>>(`${this.baseUrl}`, obj).pipe(
            map(response => {
                return response.data;
            }),
            first()
        );
    }

    update(obj: T, id: number): Observable<boolean> {
        return this.http.put<ApiResponse<any>>(`${this.baseUrl}/${id}`, obj).pipe(
            map(response => response.success),
            first()
        );
    }

    delete(id: number): Observable<void> {
        return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`).pipe(
            map(() => void 0), // Transforma a resposta em 'void'
            first()
        );
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
