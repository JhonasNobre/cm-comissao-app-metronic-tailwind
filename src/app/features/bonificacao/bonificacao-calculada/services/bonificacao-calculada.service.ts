import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from '../../../../shared/services/base/base.service';
import { BonificacaoCalculada, BonificacaoFiltros } from '../models/bonificacao-calculada.model';
import { PagedResult } from '../../../comissoes/models/estrutura-comissao.model';

@Injectable({
    providedIn: 'root'
})
export class BonificacaoCalculadaService extends BaseService {

    constructor(http: HttpClient) {
        super(http, '/v1/bonificacoes');
    }

    getByVenda(idVenda: string): Observable<BonificacaoCalculada[]> {
        return this.http.get<BonificacaoCalculada[]>(`${this.baseUrl}/venda/${idVenda}`);
    }

    getById(id: string): Observable<BonificacaoCalculada> {
        return this.http.get<BonificacaoCalculada>(`${this.baseUrl}/${id}`);
    }

    listar(filtros: BonificacaoFiltros): Observable<PagedResult<BonificacaoCalculada>> {
        const params = this.buildHttpParams(filtros);
        return this.http.get<PagedResult<BonificacaoCalculada>>(this.baseUrl, { params });
    }

    liberarParcela(idBonificacao: string, idParcela: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/${idBonificacao}/parcelas/${idParcela}/liberar`, {});
    }
}
