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

    getParcelas(vendaId: string): Observable<ParcelaVenda[]> {
        return this.http.get<ParcelaVenda[]>(`${this.baseUrl}/${vendaId}/parcelas`);
    }

    sincronizarParcelas(vendaId: string): Observable<number> {
        return this.http.post<number>(`${this.baseUrl}/${vendaId}/parcelas/sincronizar`, {});
    }

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
