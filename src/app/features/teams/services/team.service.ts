import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BaseService } from '../../../shared/services/base/base.service';
import { Team, TeamListDTO, TeamCreateDTO, TeamUpdateDTO } from '../models/team.model';

@Injectable({
    providedIn: 'root'
})
export class TeamService extends BaseService {

    constructor(http: HttpClient) {
        super(http, '/v1/equipes');
    }

    list(params?: any): Observable<TeamListDTO[]> {
        const httpParams = this.buildHttpParams(params);
        return this.http.get<TeamListDTO[]>(`${this.baseUrl}`, { params: httpParams });
    }

    get(id: string): Observable<Team> {
        return this.http.get<Team>(`${this.baseUrl}/${id}`);
    }

    create(obj: any): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}`, obj);
    }

    update(obj: any, id: string): Observable<boolean> {
        return this.http.put<void>(`${this.baseUrl}/${id}`, obj).pipe(map(() => true));
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    listarMembros(teamId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/${teamId}/membros`);
    }

    adicionarMembro(teamId: string, email: string, grupoEquipeId: string): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/${teamId}/membros`, { email, grupoEquipeId });
    }

    removerMembro(teamId: string, usuarioId: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${teamId}/membros/${usuarioId}`);
    }
}
