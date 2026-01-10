import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from '../../../shared/services/base/base.service';

export interface GrupoEquipe {
    id: string;
    nome: string;
    idEquipe: string;
    descricao?: string;
    cor?: string;
}

@Injectable({
    providedIn: 'root'
})
export class TeamGroupService extends BaseService {

    constructor(http: HttpClient) {
        super(http, '/v1/grupos-equipes');
    }

    listByTeam(teamId: string): Observable<GrupoEquipe[]> {
        return this.http.get<GrupoEquipe[]>(`${this.baseUrl}?idEquipe=${teamId}`);
    }

    get(id: string): Observable<GrupoEquipe> {
        return this.http.get<GrupoEquipe>(`${this.baseUrl}/${id}`);
    }

    create(obj: any): Observable<string> {
        return this.http.post<string>(`${this.baseUrl}`, obj);
    }

    update(obj: any, id: string): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/${id}`, obj);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
