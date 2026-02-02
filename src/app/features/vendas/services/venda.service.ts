import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from '../../../shared/services/base/base.service';
import { PagedResult, VendaFiltros, VendaImportada } from '../models/venda.model';

@Injectable({
    providedIn: 'root'
})
export class VendaService extends BaseService {

    constructor(http: HttpClient) {
        super(http, '/v1/vendas');
    }

    getAll(filtros: VendaFiltros): Observable<PagedResult<VendaImportada>> {
        const params = this.buildHttpParams(filtros);
        return this.http.get<PagedResult<VendaImportada>>(this.baseUrl, { params });
    }

    getById(id: string): Observable<VendaImportada> {
        return this.http.get<VendaImportada>(`${this.baseUrl}/${id}`);
    }
}
