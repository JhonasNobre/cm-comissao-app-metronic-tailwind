import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AbrirChamadoRequest {
    nome: string;
    telefone: string;
    titulo: string;
    mensagem: string;
}

@Injectable({
    providedIn: 'root'
})
export class SuporteService {
    private apiUrl = `${environment.apiUrl}/suporte`;

    constructor(private http: HttpClient) { }

    abrirChamado(dados: AbrirChamadoRequest): Observable<any> {
        return this.http.post(`${this.apiUrl}/abrir-chamado`, dados);
    }
}
