import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    ListarRemessasResponse,
    ObterRemessaResponse,
    ReprogramarVencimentoRequest,
    CriarRemessaManualRequest,
    CriarRemessaManualResponse
} from '../models/imobtech-remessa.model';

@Injectable({
    providedIn: 'root'
})
export class ImobtechRemessaService {
    private readonly baseUrl = `${environment.apiUrl}/v1/integracoes/imobtech`;

    constructor(private http: HttpClient) { }

    /**
     * Lista todas as remessas com filtros e paginação
     */
    listarRemessas(
        status?: string,
        page: number = 1,
        pageSize: number = 20
    ): Observable<ListarRemessasResponse> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('pageSize', pageSize.toString());

        if (status) {
            params = params.set('status', status);
        }

        return this.http.get<ListarRemessasResponse>(`${this.baseUrl}/remessas`, { params });
    }

    /**
     * Obtém detalhes de uma remessa específica
     */
    obterRemessa(id: string): Observable<ObterRemessaResponse> {
        return this.http.get<ObterRemessaResponse>(`${this.baseUrl}/remessas/${id}`);
    }

    /**
     * Reprocessa uma remessa com erro
     */
    reprocessarRemessa(id: string): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/remessas/${id}/reprocessar`, {});
    }

    /**
     * Cria uma remessa manual (apenas em modo de teste)
     */
    criarRemessaManual(request: CriarRemessaManualRequest): Observable<CriarRemessaManualResponse> {
        return this.http.post<CriarRemessaManualResponse>(`${this.baseUrl}/teste-manual`, request);
    }

    /**
     * Reprograma o vencimento de uma parcela
     */
    reprogramarVencimento(request: ReprogramarVencimentoRequest): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/reprogramar-vencimento`, request);
    }

    /**
     * Exclui uma remessa localmente (apenas se não enviada/erro)
     */
    excluirRemessa(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/remessas/${id}`);
    }

    /**
     * Cancela uma remessa na Imobtech
     */
    cancelarRemessa(id: string, empresaId: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/remessas/${id}/cancelar`, {
            params: { empresaId }
        });
    }

    // ========================================================================
    // MÉTODOS DE DIAGNÓSTICO (LABORATÓRIO)
    // ========================================================================

    cancelarRemessaBulk(empresaId: string, ids: number[]): Observable<any> {
        return this.http.request('delete', `${this.baseUrl}/diagnostico/remessas`, {
            params: { empresaId },
            body: ids
        });
    }

    cancelarParcelas(empresaId: string, ids: number[]): Observable<any> {
        return this.http.request('delete', `${this.baseUrl}/diagnostico/parcelas`, {
            params: { empresaId },
            body: ids
        });
    }

    validarPix(empresaId: string, documento: string): Observable<any> {
        return this.http.get(`${this.baseUrl}/diagnostico/pix/${documento}`, {
            params: { empresaId }
        });
    }

    renegociar(empresaId: string, idAntiga: number, idNova: number, novaParcela: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/diagnostico/renegociar`, novaParcela, {
            params: { empresaId, idAntiga: idAntiga.toString(), idNova: idNova.toString() }
        });
    }

    // Rateios e Extrato
    obterRateiosDiagnostico(empresaId: string, idParcela: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/diagnostico/extrato-rateios/${idParcela}`, {
            params: { empresaId }
        });
    }

    reprogramarDiagnostico(empresaId: string, idImobtech: string, novoVencimento: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/diagnostico/reprogramar-vencimento`, {}, {
            params: { empresaId, idImobtech, novoVencimento }
        });
    }
}
