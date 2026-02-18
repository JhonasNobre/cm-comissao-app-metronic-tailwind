import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from '../../../shared/services/base/base.service';
import { Comissao, ComissaoFiltros, GerarComissaoCommand, DashboardStats, ComissaoPendente, ComissaoPendentesFiltros, ComissaoHistorico, ComissaoHistoricoFiltros, ParcelaComissaoGridDto, LiberarParcelasEmMassaRequest } from '../models/comissao.model';
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

    getParcelasPaginado(filtros: any): Observable<PagedResult<ParcelaComissaoGridDto>> {
        const params = this.buildHttpParams(filtros);
        return this.http.get<PagedResult<ParcelaComissaoGridDto>>(`${this.baseUrl}/parcelas`, { params });
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
    // Ações em parcelas
    bloquearParcela(idParcela: string, idComissao: string, motivo: string): Observable<any> {
        return this.http.patch(`${this.baseUrl}/parcelas/${idParcela}/bloquear`, {
            idComissao: idComissao,
            motivo: motivo
        });
    }

    desbloquearParcela(idParcela: string, idComissao: string): Observable<any> {
        return this.http.patch(`${this.baseUrl}/parcelas/${idParcela}/desbloquear`, {
            idComissao: idComissao
        });
    }

    liberarParcelasEmMassa(idsParcelas: string[], idResponsavel: string): Observable<any> {
        const request: LiberarParcelasEmMassaRequest = {
            idsParcelas,
            idResponsavel
        };
        return this.http.post(`${this.baseUrl}/parcelas/liberar-em-massa`, request);
    }

    cancelarComissao(id: string, motivo: string, idResponsavel: string): Observable<any> {
        return this.http.delete(`${this.baseUrl}/${id}/cancelar`, {
            body: {
                motivo,
                idResponsavel
            }
        });
    }

    uploadDocumento(idComissao: string, file: File, idResponsavel: string, categoria: number): Observable<any> {
        const formData = new FormData();
        formData.append('Arquivo', file);  // PascalCase to match C# backend
        formData.append('IdResponsavel', idResponsavel);
        formData.append('Categoria', categoria.toString());

        return this.http.post(`${this.baseUrl}/${idComissao}/documentos`, formData);
    }

    aprovarDocumento(idComissao: string, idDocumento: string): Observable<any> {
        return this.http.put(`${this.baseUrl}/${idComissao}/documentos/${idDocumento}/aprovar`, {});
    }

    reprovarDocumento(idComissao: string, idDocumento: string): Observable<any> {
        return this.http.put(`${this.baseUrl}/${idComissao}/documentos/${idDocumento}/reprovar`, {});
    }

    exportar(filtros: ComissaoFiltros): Observable<Blob> {
        const params = this.buildHttpParams(filtros);
        return this.http.get(`${this.baseUrl}/exportar`, { params, responseType: 'blob' });
    }
}
