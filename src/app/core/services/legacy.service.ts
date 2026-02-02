import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LegacyVendaDto {
    codigoVenda: number;
    quadra?: string;
    lote?: string;
    quandoVendeu?: Date;
    quemVendeu?: string;
    tipoVenda?: string;
    desconto?: number;
    quantidadeParcelas?: number;
    sistemaAmortizacao?: string;
    personalizacao?: string;
    codigoProduto?: number;
    nomeProduto?: string;
    ufProduto?: string;
    cidadeProduto?: string;
    idCidade?: number;
    codigoUnidade?: number;
    areaUnidade?: number;
    statusConferencia?: string;
    usuarioCodigoConferencia?: number;
    corretorCodigoConferencia?: number;
    atendenteCodigoConferencia?: number;
    cpfComprador?: string;
    nomeComprador?: string;
}

export interface LegacyAnexoDto {
    codigo: number;
    url: string;
    tipoAnexo?: string;
}

@Injectable({
    providedIn: 'root'
})
export class LegacyService {
    private apiUrl = `${environment.apiUrl}/v1/legacy`;

    constructor(private http: HttpClient) { }

    getVenda(codigoVenda: number, codigoEmpresaLegado: number): Observable<LegacyVendaDto> {
        const params = new HttpParams().set('codigoEmpresaLegado', codigoEmpresaLegado.toString());
        return this.http.get<LegacyVendaDto>(`${this.apiUrl}/vendas/${codigoVenda}`, { params });
    }

    getAnexosPessoa(cpf: string, codigoEmpresaLegado: number): Observable<LegacyAnexoDto[]> {
        const params = new HttpParams().set('codigoEmpresaLegado', codigoEmpresaLegado.toString());
        return this.http.get<LegacyAnexoDto[]>(`${this.apiUrl}/pessoas/${cpf}/anexos`, { params });
    }
}
