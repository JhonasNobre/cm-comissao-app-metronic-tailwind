import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from '../../../shared/services/base/base.service';
import { PagedResult } from '../models/estrutura-comissao.model';
import { VendaImportada, VendaImportadaFiltros } from '../models/venda-importada.model';

@Injectable({
    providedIn: 'root'
})
export class VendaService extends BaseService {

    constructor(http: HttpClient) {
        super(http, '/v1/vendas');
    }

    /**
     * Lista vendas importadas com paginação e filtros
     */
    getAll(filtros: VendaImportadaFiltros): Observable<PagedResult<VendaImportada>> {
        const params = this.buildHttpParams(filtros);
        return this.http.get<PagedResult<VendaImportada>>(this.baseUrl, { params });
    }

    /**
     * Obtém uma venda por ID
     */
    getById(id: string): Observable<VendaImportada> {
        return this.http.get<VendaImportada>(`${this.baseUrl}/${id}`);
    }
}
