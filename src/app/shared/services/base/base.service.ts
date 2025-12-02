import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export abstract class BaseService<T> {
    constructor(protected http: HttpClient, private apiName: string, private modelType?: new (init?: Partial<T>) => T) { }

    protected get baseUrl(): string {
        return `${environment.apiUrl}${this.apiName}`;
    }

    list(params?: any): Observable<T[]> {
        const httpParams = this.buildHttpParams(params);
        return this.http.get<T[]>(`${this.baseUrl}`, { params: httpParams }).pipe(
            map(data => {
                // API retorna array direto (sem wrapper)
                return this.modelType ? data.map(item => new this.modelType!(item)) : data;
            }),
            first()
        );
    }

    get(id: number | string): Observable<T> {
        return this.http.get<T>(`${this.baseUrl}/${id}`).pipe(
            map(data => {
                // API retorna objeto direto (sem wrapper)
                return this.modelType && data ? new this.modelType(data) : data;
            }),
            first()
        );
    }

    create(obj: T): Observable<T> {
        return this.http.post<T>(`${this.baseUrl}`, obj).pipe(
            map(data => data),
            first()
        );
    }

    update(obj: T, id: number | string): Observable<boolean> {
        return this.http.put<any>(`${this.baseUrl}/${id}`, obj).pipe(
            map(() => true), // API retorna 204 NoContent em sucesso
            first()
        );
    }

    delete(id: number | string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
            map(() => void 0),
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
