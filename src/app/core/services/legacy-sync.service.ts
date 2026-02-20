import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SyncResult {
    message: string;
    quantidade: number;
}

@Injectable({
    providedIn: 'root'
})
export class LegacySyncService {
    private apiUrl = `${environment.apiUrl}/v1/legacy-sync`;

    constructor(private http: HttpClient) { }

    sincronizarProdutos(): Observable<SyncResult> {
        return this.http.post<SyncResult>(`${this.apiUrl}/produtos`, {});
    }

    sincronizarVendas(inicio?: string, fim?: string): Observable<SyncResult> {
        let params = new HttpParams();
        if (inicio) params = params.set('inicio', inicio);
        if (fim) params = params.set('fim', fim);

        return this.http.post<SyncResult>(`${this.apiUrl}/vendas`, {}, { params });
    }

    sincronizarUsuarios(): Observable<SyncResult> {
        return this.http.post<SyncResult>(`${this.apiUrl}/usuarios`, {});
    }
}
