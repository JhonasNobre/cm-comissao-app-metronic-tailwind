import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from '../../../shared/services/base/base.service';
import { CriarEstruturaBonificacaoCommand, EstruturaBonificacao } from '../models/bonus-structure.model';
import { Bonus, LancarBonusManualCommand } from '../models/bonus.model';
import { PagedResult } from '../../comissoes/models/estrutura-comissao.model';

@Injectable({
    providedIn: 'root'
})
export class BonusService extends BaseService {

    constructor(http: HttpClient) {
        super(http, '/v1/bonificacao');
    }

    // Estruturas
    criarEstrutura(command: CriarEstruturaBonificacaoCommand): Observable<string> {
        return this.http.post<string>(`${this.baseUrl}/estruturas`, command);
    }

    listarEstruturas(): Observable<EstruturaBonificacao[]> {
        return this.http.get<EstruturaBonificacao[]>(`${this.baseUrl}/estruturas`);
    }

    atualizarEstrutura(command: any): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/estruturas`, command);
    }

    obterEstrutura(id: string): Observable<EstruturaBonificacao> {
        return this.http.get<EstruturaBonificacao>(`${this.baseUrl}/estruturas/${id}`);
    }

    // Bonus Manual
    lancarBonusManual(command: LancarBonusManualCommand): Observable<string> {
        return this.http.post<string>(`${this.baseUrl}/manual`, command);
    }

    // Bonus Listagem (Paginada conforme o novo padrão do backend)
    listarBonus(filtro?: any): Observable<PagedResult<Bonus>> {
        const params = this.buildHttpParams(filtro);
        return this.http.get<PagedResult<Bonus>>(`${this.baseUrl}`, { params });
    }
}
