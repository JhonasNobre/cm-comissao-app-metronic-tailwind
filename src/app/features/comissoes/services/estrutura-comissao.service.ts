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
     * Lista todas as estruturas com filtros opcionais
     */
    getAll(filtros?: EstruturaComissaoFiltros): Observable<PagedResult<EstruturaComissao>> {
        let params = new HttpParams();

        if (filtros) {
            if (filtros.busca) params = params.set('busca', filtros.busca);
            if (filtros.tipoComissao !== undefined) params = params.set('tipoComissao', filtros.tipoComissao.toString());
            if (filtros.ativo !== undefined) params = params.set('ativo', filtros.ativo.toString());
            if (filtros.idEmpresa) params = params.set('idEmpresa', filtros.idEmpresa);
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
}
