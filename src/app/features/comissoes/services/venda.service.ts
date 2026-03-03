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

    /**
     * Retorna as parcelas sincronizadas localmente para uma venda
     */
    getParcelas(vendaId: string): Observable<ParcelaVenda[]> {
        return this.http.get<ParcelaVenda[]>(`${this.baseUrl}/${vendaId}/parcelas`);
    }

    /**
     * Sincroniza as parcelas de uma venda específica com o banco legado (UAU)
     */
    sincronizarParcelas(vendaId: string): Observable<number> {
        return this.http.post<number>(`${this.baseUrl}/${vendaId}/parcelas/sincronizar`, {});
    }

    /**
     * Sincroniza as parcelas de TODAS as vendas com código legado
     */
    sincronizarTodasParcelas(): Observable<SincronizarTodasResult> {
        return this.http.post<SincronizarTodasResult>(`${this.baseUrl}/parcelas/sincronizar-todas`, {});
    }
}

export interface ParcelaVenda {
    id: string;
    numParcela: number;
    numParcGer: number;
    tipoParcela: string;
    valor: number;
    valorCorrigido: number;
    valorRecebido: number;
    multa: number;
    juros: number;
    correcaoAtraso: number;
    dataVencimento: string;
    dataRecebimento: string | null;
    dataProrrogacao: string | null;
    status: 'AReceber' | 'Atrasada' | 'Recebida';
    sincronizadoEm: string;
}

export interface SincronizarTodasResult {
    vendasProcessadas: number;
    vendasComErro: number;
    totalParcelasSincronizadas: number;
    erros: string[];
}
