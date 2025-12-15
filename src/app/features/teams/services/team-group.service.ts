import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from '../../../shared/services/base/base.service';
import { EmpresaSelectorService } from '../../../core/services/empresa-selector.service';

export interface TeamGroup {
    id: string;
    nome: string;
    cor?: string;
    descricao?: string;
    idEmpresa?: string;
}

@Injectable({
    providedIn: 'root'
})
export class TeamGroupService extends BaseService {

    constructor(
        http: HttpClient,
        private empresaService: EmpresaSelectorService
    ) {
        super(http, '/v1/grupos-equipes');
    }

    list(params?: any): Observable<TeamGroup[]> {
        const httpParams = this.buildHttpParams(params)
            .set('idEmpresa', this.empresaService.getCurrentEmpresaId() || '');
        return this.http.get<TeamGroup[]>(`${this.baseUrl}`, { params: httpParams });
    }

    get(id: string): Observable<TeamGroup> {
        return this.http.get<TeamGroup>(`${this.baseUrl}/${id}`);
    }

    create(group: TeamGroup): Observable<TeamGroup> {
        const payload = {
            ...group,
            idEmpresa: this.empresaService.getCurrentEmpresaId()
        };
        return this.http.post<TeamGroup>(this.baseUrl, payload);
    }

    update(group: TeamGroup, id: string): Observable<TeamGroup> {
        const payload = {
            ...group,
            idEmpresa: this.empresaService.getCurrentEmpresaId()
        };
        return this.http.put<TeamGroup>(`${this.baseUrl}/${id}`, payload);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
