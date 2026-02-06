import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { OrigemPagamento, CriarOrigemPagamentoRequest, AtualizarOrigemPagamentoRequest } from '../models/origem-pagamento.model';

@Injectable({
    providedIn: 'root'
})
export class OrigemPagamentoService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/v1/OrigemPagamento`;

    getAll(idEmpresa: string, apenasAtivos: boolean = true): Observable<OrigemPagamento[]> {
        let params = new HttpParams()
            .set('idEmpresa', idEmpresa)
            .set('apenasAtivos', apenasAtivos.toString());

        return this.http.get<OrigemPagamento[]>(this.apiUrl, { params });
    }

    create(data: CriarOrigemPagamentoRequest): Observable<any> {
        return this.http.post(this.apiUrl, data);
    }

    update(id: string, data: AtualizarOrigemPagamentoRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, data);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
