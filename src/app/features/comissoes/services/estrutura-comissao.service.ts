import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    EstruturaComissao,
    CreateEstruturaComissaoRequest,
    UpdateEstruturaComissaoRequest,
    EstruturaComissaoFiltros,
    PagedResult
} from '../models/estrutura-comissao.model';

@Injectable({
    providedIn: 'root'
})
export class EstruturaComissaoService {
    private readonly apiUrl = `${environment.apiUrl}/v1/estruturas-comissao`;

    constructor(private http: HttpClient) { }

    /**
     * Lista as estruturas de uma empresa específica
     */
    getByEmpresa(idEmpresa: string, filtros?: Partial<EstruturaComissaoFiltros>): Observable<PagedResult<EstruturaComissao>> {
        let params = new HttpParams();
        params = params.set('idEmpresa', idEmpresa);

        if (filtros) {
            if (filtros.busca) params = params.set('busca', filtros.busca);
            if (filtros.tipoComissao !== undefined) params = params.set('tipoComissao', filtros.tipoComissao.toString());
            if (filtros.ativo !== undefined) params = params.set('ativo', filtros.ativo.toString());
            if (filtros.pagina) params = params.set('pagina', filtros.pagina.toString());
            if (filtros.tamanhoPagina) params = params.set('tamanhoPagina', filtros.tamanhoPagina.toString());
        }

        return this.http.get<PagedResult<EstruturaComissao>>(this.apiUrl, { params });
    }

    /**
     * Busca uma estrutura por ID
     */
    getById(id: string): Observable<EstruturaComissao> {
        return this.http.get<EstruturaComissao>(`${this.apiUrl}/${id}`);
    }

    /**
     * Cria uma nova estrutura
     */
    create(request: CreateEstruturaComissaoRequest): Observable<EstruturaComissao> {
        return this.http.post<EstruturaComissao>(this.apiUrl, request);
    }

    /**
     * Atualiza uma estrutura existente
     */
    update(id: string, request: UpdateEstruturaComissaoRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, request);
    }

    /**
     * Deleta uma estrutura (soft delete)
     */
    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    /**
     * Ativa uma estrutura
     */
    ativar(id: string): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/${id}/ativar`, {});
    }

    /**
     * Desativa uma estrutura
     */
    desativar(id: string): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/${id}/desativar`, {});
    }

    /**
     * Duplica uma estrutura existente
     */
    duplicar(id: string, novoNome: string): Observable<EstruturaComissao> {
        return this.http.post<EstruturaComissao>(`${this.apiUrl}/${id}/duplicar`, { nome: novoNome });
    }

    /**
     * Envia estrutura para o sistema UAU
     */
    enviarParaUau(id: string): Observable<{ codigoUau: number }> {
        // Endpoint de integração (CQRS)
        const url = `${environment.apiUrl}/v1/integracoes/uau/enviar-estrutura/${id}`;
        return this.http.post<{ codigoUau: number }>(url, {});
    }
}
