import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { VendaPendencia } from '../models/pendencia.model';

@Injectable({
    providedIn: 'root'
})
export class PendenciaService {
    private apiUrl = `${environment.apiUrl}/v1/pendencias`;

    constructor(private http: HttpClient) { }

    listarPendencias(): Observable<VendaPendencia[]> {
        return this.http.get<VendaPendencia[]>(`${this.apiUrl}/vendas`);
    }

    obterDetalhes(codigoVendaLegado: number): Observable<VendaPendencia> {
        return this.http.get<VendaPendencia>(`${this.apiUrl}/vendas/${codigoVendaLegado}`);
    }
}
