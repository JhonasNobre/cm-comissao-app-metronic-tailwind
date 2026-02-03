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

    sincronizarProdutos(codigoEmpresaLegado: number): Observable<SyncResult> {
        const params = new HttpParams().set('codigoEmpresaLegado', codigoEmpresaLegado.toString());
        return this.http.post<SyncResult>(`${this.apiUrl}/produtos`, {}, { params });
    }

    sincronizarVendas(codigoEmpresaLegado: number): Observable<SyncResult> {
        const params = new HttpParams().set('codigoEmpresaLegado', codigoEmpresaLegado.toString());
        return this.http.post<SyncResult>(`${this.apiUrl}/vendas`, {}, { params });
    }
}
