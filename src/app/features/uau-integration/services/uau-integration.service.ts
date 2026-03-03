import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class UauIntegrationService {
    private http = inject(HttpClient);
    private readonly API_URL = `${environment.apiUrl}/v1/integracoes/uau`;

    testarConexao(): Observable<void> {
        return this.http.post<void>(`${this.API_URL}/configuracao/testar-conexao`, {});
    }

    importarEstrutura(): Observable<void> {
        return this.http.post<void>(`${this.API_URL}/importar-estrutura`, {});
    }

    sincronizarComissao(comissaoId: string): Observable<void> {
        return this.http.post<void>(`${this.API_URL}/sincronizar-comissao/${comissaoId}`, {});
    }

    consultarParcelasDaVenda(
        vendaId: string,
        dataCalculo?: string,
        boletoAntecipado = false,
        somenteAptasBoleto = false
    ): Observable<any> {
        let params = new HttpParams();
        if (dataCalculo) params = params.set('dataCalculo', dataCalculo);
        if (boletoAntecipado) params = params.set('boletoAntecipado', 'true');
        if (somenteAptasBoleto) params = params.set('somenteAptasBoleto', 'true');
        return this.http.get<any>(`${this.API_URL}/vendas/${vendaId}/parcelas`, { params });
    }

    buscarParcelasRecebidas(vendaId: string): Observable<any> {
        return this.http.get<any>(`${this.API_URL}/vendas/${vendaId}/parcelas/recebidas`);
    }
}
