import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BaseService } from '../../../shared/services/base/base.service';
import { User, UserListDTO, UserCreateDTO, UserUpdateDTO } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UserService extends BaseService {

    constructor(http: HttpClient) {
        super(http, '/v1/usuarios');
    }

    list(params?: any): Observable<UserListDTO[]> {
        const httpParams = this.buildHttpParams(params);
        return this.http.get<UserListDTO[]>(`${this.baseUrl}`, { params: httpParams }).pipe(
            map(users => users.map(u => this.mapResponseToUserList(u)))
        );
    }

    get(id: string): Observable<User> {
        return this.http.get<User>(`${this.baseUrl}/${id}`).pipe(
            map(u => this.mapResponseToUser(u))
        );
    }

    create(obj: UserCreateDTO): Observable<User> {
        return this.http.post<User>(`${this.baseUrl}`, obj).pipe(
            map(u => this.mapResponseToUser(u))
        );
    }

    update(obj: UserUpdateDTO, id: string): Observable<User> {
        return this.http.put<User>(`${this.baseUrl}/${id}`, obj).pipe(
            map(u => this.mapResponseToUser(u))
        );
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    // Custom methods
    reenviarEmail(id: string): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/${id}/reenviar-email`, {});
    }

    inativar(ids: string[]): Observable<void> {
        return this.http.patch<void>(`${this.baseUrl}/inativar`, ids);
    }

    reativar(ids: string[]): Observable<void> {
        return this.http.patch<void>(`${this.baseUrl}/${ids[0]}/reativar`, ids);
    }

    uploadFoto(id: string, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post(`${this.baseUrl}/${id}/foto`, formData);
    }

    getFotoUrl(id: string): string {
        return `${this.baseUrl}/${id}/foto`;
    }

    private mapResponseToUser(u: any): User {
        // Backend returns "fotoPerfil" as base64 string
        return {
            ...u,
            fotoPerfil: u.fotoPerfil ? `data:image/jpeg;base64,${u.fotoPerfil}` : undefined
        };
    }

    private mapResponseToUserList(u: any): UserListDTO {
        return {
            ...u,
            fotoPerfil: u.fotoPerfil ? `data:image/jpeg;base64,${u.fotoPerfil}` : undefined
        };
    }
}
