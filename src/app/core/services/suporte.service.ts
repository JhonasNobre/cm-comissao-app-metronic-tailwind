import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AbrirChamadoRequest {
    nome: string;
    telefone: string;
    titulo: string;
    mensagem: string;
    arquivo?: File;
}

@Injectable({
    providedIn: 'root'
})
export class SuporteService {
    private apiUrl = `${environment.apiUrl}/suporte`;

    constructor(private http: HttpClient) { }

    abrirChamado(dados: AbrirChamadoRequest): Observable<any> {
        const formData = new FormData();
        formData.append('nome', dados.nome);
        formData.append('telefone', dados.telefone);
        formData.append('titulo', dados.titulo);
        formData.append('mensagem', dados.mensagem);

        if (dados.arquivo) {
            formData.append('arquivo', dados.arquivo);
        }

        return this.http.post(`${this.apiUrl}/abrir-chamado`, formData);
    }
}
