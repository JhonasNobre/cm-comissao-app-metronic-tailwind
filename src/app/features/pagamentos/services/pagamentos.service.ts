import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface TransacaoFinanceira {
    id: string;
    tipo: string;
    status: string;
    valor: number;
    dataTransacao: string;
    dataProcessamento?: string;
    descricao: string;
    idExterno?: string;
    documentoBeneficiario?: string;
    nomeBeneficiario?: string;
}

export interface TransacaoFinanceiraResponse {
    id: string;
    tipo: string;
    status: string;
    valor: number;
    dataTransacao: string;
    dataProcessamento?: string;
    descricao: string;
    idExterno?: string;
    documentoBeneficiario: string;
    nomeBeneficiario?: string;
}

export interface ListaTransacoesResponse {
    itens: TransacaoFinanceiraResponse[];
    total: number;
    pagina: number;
    tamanhoPagina: number;
}

export interface ConsultaBeneficiarioResponse {
    documento: string;
    totalTransacoes: number;
    valorTotalPago: number;
    valorTotalPendente: number;
    transacoes: TransacaoFinanceira[];
}

export interface ResumoBeneficiarioResponse {
    documento: string;
    saldoPendente: number;
    totalRecebido: number;
    totalTransacoes: number;
    porStatus: { status: string; quantidade: number; valor: number }[];
    porTipo: { tipo: string; quantidade: number; valor: number }[];
    ultimasTransacoes: { dataTransacao: string; tipo: string; status: string; valor: number }[];
}

export interface DistribuicaoComissaoResponse {
    comissaoId: string;
    valorTotal: number;
    status: string;
    itens: {
        idUsuario: string;
        nomeNivel?: string;
        valorFinal: number;
        statusPagamento: string;
        dataPagamento?: string;
        valorPago?: number;
        documentoBeneficiario?: string;
        nomeBeneficiario?: string;
    }[];
    parcelas: {
        numeroParcela: number;
        valorParcela: number;
        valorRecebido?: number;
        status: string;
        dataPagamento?: string;
    }[];
    transacoes: {
        tipo: string;
        status: string;
        valor: number;
        nomeBeneficiario?: string;
        dataTransacao: string;
    }[];
}

export interface RelatorioMensalResponse {
    periodo: string;
    dataInicio: string;
    dataFim: string;
    totalTransacoes: number;
    valorTotal: number;
    valorPago: number;
    valorPendente: number;
    porDia: { data: string; quantidade: number; valor: number }[];
    topBeneficiarios: { documento: string; nome?: string; quantidade: number; valorTotal: number }[];
}

export interface EstatisticasPagamentosResponse {
    pendentes: number;
    concluidas: number;
    comErro: number;
    canceladas: number;
    total: number;
}

@Injectable({
    providedIn: 'root'
})
export class PagamentosService {
    private readonly baseUrl = `${environment.apiUrl}/v1/pagamentos`;

    constructor(private http: HttpClient) { }

    /**
     * Consulta pagamentos por beneficiário (CPF/CNPJ)
     */
    consultarPorBeneficiario(
        documento: string,
        empresaId?: string,
        dataInicio?: string,
        dataFim?: string
    ): Observable<ConsultaBeneficiarioResponse> {
        let params = new HttpParams();
        if (empresaId) params = params.set('empresaId', empresaId);
        if (dataInicio) params = params.set('dataInicio', dataInicio);
        if (dataFim) params = params.set('dataFim', dataFim);

        return this.http.get<ConsultaBeneficiarioResponse>(`${this.baseUrl}/beneficiario/${documento}`, { params });
    }

    /**
     * Resumo de pagamentos por beneficiário
     */
    obterResumoBeneficiario(documento: string, empresaId: string): Observable<ResumoBeneficiarioResponse> {
        const params = new HttpParams().set('empresaId', empresaId);
        return this.http.get<ResumoBeneficiarioResponse>(`${this.baseUrl}/beneficiario/${documento}/resumo`, { params });
    }

    /**
     * Distribuição de pagamentos de uma comissão
     */
    obterDistribuicaoComissao(comissaoId: string): Observable<DistribuicaoComissaoResponse> {
        return this.http.get<DistribuicaoComissaoResponse>(`${this.baseUrl}/comissao/${comissaoId}/distribuicao`);
    }

    /**
     * Relatório mensal de pagamentos
     */
    obterRelatorioMensal(empresaId: string, mes: number, ano: number): Observable<RelatorioMensalResponse> {
        const params = new HttpParams()
            .set('empresaId', empresaId)
            .set('mes', mes.toString())
            .set('ano', ano.toString());

        return this.http.get<RelatorioMensalResponse>(`${this.baseUrl}/relatorio/mensal`, { params });
    }

    /**
     * Estatísticas gerais de pagamentos
     */
    obterEstatisticas(empresaId: string): Observable<EstatisticasPagamentosResponse> {
        const params = new HttpParams().set('empresaId', empresaId);
        return this.http.get<EstatisticasPagamentosResponse>(`${this.baseUrl}/estatisticas`, { params });
    }

    /**
     * Lista transações financeiras
     */
    listarTransacoes(empresaId: string, pagina: number = 1, tamanhoPagina: number = 20): Observable<ListaTransacoesResponse> {
        const params = new HttpParams()
            .set('empresaId', empresaId)
            .set('pagina', pagina.toString())
            .set('tamanhoPagina', tamanhoPagina.toString());
        return this.http.get<ListaTransacoesResponse>(`${environment.apiUrl}/v1/integracoes/imobtech/transacoes`, { params });
    }

    /**
     * Lista transações por beneficiário
     */
    listarTransacoesBeneficiario(documento: string, empresaId?: string): Observable<TransacaoFinanceiraResponse[]> {
        let params = new HttpParams();
        if (empresaId) params = params.set('empresaId', empresaId);
        return this.http.get<TransacaoFinanceiraResponse[]>(`${environment.apiUrl}/v1/integracoes/imobtech/transacoes/beneficiario/${documento}`, { params });
    }
}

