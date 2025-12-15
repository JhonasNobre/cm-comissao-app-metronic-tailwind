import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface TeamMember {
    usuarioId: string;
    nome: string;
    email: string;
    perfilNome?: string;
    vinculadoEm: Date;
}

export interface AddMemberRequest {
    email: string;
}

@Injectable({
    providedIn: 'root'
})
export class TeamMembersService {
    private baseUrl = `${environment.apiUrl}/v1/equipes`;

    constructor(private http: HttpClient) { }

    listMembers(teamId: string): Observable<TeamMember[]> {
        return this.http.get<TeamMember[]>(`${this.baseUrl}/${teamId}/membros`);
    }

    addMember(teamId: string, email: string): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/${teamId}/membros`, { email });
    }

    removeMember(teamId: string, usuarioId: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${teamId}/membros/${usuarioId}`);
    }
}
