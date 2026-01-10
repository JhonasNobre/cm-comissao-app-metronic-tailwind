import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from '../../../shared/services/base/base.service';
import { Comissao, ComissaoFiltros, GerarComissaoCommand, DashboardStats, ComissaoPendente, ComissaoPendentesFiltros, ComissaoHistorico, ComissaoHistoricoFiltros } from '../models/comissao.model';
import { PagedResult } from '../models/estrutura-comissao.model';

@Injectable({
    providedIn: 'root'
})
export class ComissaoService extends BaseService {

    constructor(http: HttpClient) {
        super(http, '/v1/comissoes');
    }

    getAll(filtros: ComissaoFiltros): Observable<PagedResult<Comissao>> {
        const params = this.buildHttpParams(filtros);
        return this.http.get<PagedResult<Comissao>>(this.baseUrl, { params });
    }

    getPendentes(filtros: ComissaoPendentesFiltros): Observable<PagedResult<ComissaoPendente>> {
        const params = this.buildHttpParams(filtros);
        return this.http.get<PagedResult<ComissaoPendente>>(`${this.baseUrl}/pendentes`, { params });
    }

    getHistorico(filtros: ComissaoHistoricoFiltros): Observable<PagedResult<ComissaoHistorico>> {
        const params = this.buildHttpParams(filtros);
        return this.http.get<PagedResult<ComissaoHistorico>>(`${this.baseUrl}/historico`, { params });
    }

    getById(id: string): Observable<Comissao> {
        return this.http.get<Comissao>(`${this.baseUrl}/${id}`);
    }

    gerar(command: GerarComissaoCommand): Observable<string> {
        return this.http.post<string>(`${this.baseUrl}/gerar`, command);
    }

    aprovar(id: string, idAprovador: string, observacoes?: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/${id}/aprovar`, { idAprovador, observacoes });
    }

    rejeitar(id: string, idAprovador: string, motivo: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/${id}/rejeitar`, { idAprovador, motivo });
    }

    liberarParcelaManual(idComissao: string, idParcela: string, idResponsavel: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/${idComissao}/parcelas/${idParcela}/liberar`, { idResponsavel });
    }

    getDashboard(): Observable<DashboardStats> {
        return this.http.get<DashboardStats>(`${this.baseUrl}/dashboard`);
    }

    // Ações em parcelas
    bloquearParcela(idParcela: string, motivo?: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/parcelas/${idParcela}/bloquear`, {
            idResponsavel: null,
            motivo: motivo
        });
    }

    cancelarParcela(idParcela: string, motivo: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/parcelas/${idParcela}/cancelar`, {
            idResponsavel: 'current-user-id',
            motivo: motivo
        });
    }

    liberarParcelasLote(idsParcelas: string[]): Observable<{ value: number }> {
        return this.http.post<{ value: number }>(`${this.baseUrl}/parcelas/liberar-lote`, {
            idsParcelas: idsParcelas,
            idResponsavel: 'current-user-id'
        });
    }
}
