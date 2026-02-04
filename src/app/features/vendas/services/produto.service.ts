import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from '../../../shared/services/base/base.service';
import { PagedResult } from '../models/venda.model';
import { ProdutoImportado, ProdutoFiltros } from '../models/produto.model';

@Injectable({
    providedIn: 'root'
})
export class ProdutoService extends BaseService {

    constructor(http: HttpClient) {
        super(http, '/v1/produtos');
    }

    getAll(filtros: ProdutoFiltros): Observable<PagedResult<ProdutoImportado>> {
        const params = this.buildHttpParams(filtros);
        return this.http.get<PagedResult<ProdutoImportado>>(this.baseUrl, { params });
    }
}
