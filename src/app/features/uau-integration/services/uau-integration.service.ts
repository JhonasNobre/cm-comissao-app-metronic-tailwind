import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
}
