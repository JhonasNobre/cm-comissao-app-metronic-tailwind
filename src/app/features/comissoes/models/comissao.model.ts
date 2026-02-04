export enum EStatusComissao {
    Pendente = 1,
    Aprovada = 2,
    Rejeitada = 3,
    Paga = 4
}

export enum EStatusParcela {
    Pendente = 1,
    Liberada = 2,
    Paga = 3,
    Cancelada = 4,
    Bloqueada = 5
}

export interface ItemComissao {
    id: string;
    idUsuario: string;
    nomeUsuario?: string;
    papelVenda: number;
    nomeNivel?: string;
    baseCalculoItem: number;
    tipoCalculo: number;
    percentualAplicado?: number;
    valorFixoAplicado?: number;
    valorFinal: number;
    ordem: number;
}

export interface ParcelaComissao {
    id: string;
    idUsuario: string;
    nomeUsuario?: string;
    numeroParcela: number;
    valorParcela: number;
    valorRecebido?: number;
    dataVencimento?: Date;
    dataPagamento?: Date;
    status: EStatusParcela;
    dataLiberacao?: Date;
}

export interface Comissao {
    id: string;
    idVendaImportada: string;
    idEstruturaComissao: string;
    nomeEstrutura: string;
    valorVenda: number;
    valorBase: number;
    valorTotalComissao: number;
    dataCompetencia: Date;
    status: EStatusComissao;
    criadoEm: Date;
    dataAprovacao?: Date;
    dataPagamento?: Date;
    motivoRejeicao?: string;
    observacoes?: string;

    // Novos Campos
    valorComissaoRecebido?: number;
    taxaComissaoRecebida?: number;

    itens?: ItemComissao[];
    parcelas?: ParcelaComissao[];
    documentos?: ComissaoDocumento[];
}

export interface ComissaoDocumento {
    id: string;
    idComissao: string;
    nome: string;
    extensao: string;
    tamanhoBytes: number;
    categoria: number;
    dataEnvio: Date;
    idUsuarioEnvio: string;
    nomeUsuarioEnvio?: string;
    aprovado: boolean;
    dataAprovacao?: Date;
    idUsuarioAprovacao?: string;
}

export interface ComissaoFiltros {
    pagina: number;
    tamanhoPagina: number;
    idEmpresa?: string;
    status?: EStatusComissao;
    dataInicio?: Date;
    dataFim?: Date;
}

export interface GerarComissaoCommand {
    idVendaImportada: string;
    idEstruturaComissao: string;
    usuarioId: string;
}

export interface DashboardStats {
    quantidadeTotal: number;
    valorTotalGeral: number;
    quantidadePendente: number;
    valorPendente: number;
    quantidadeAprovada: number;
    valorAprovado: number;
    quantidadeRejeitada: number;
    valorRejeitado: number;
    quantidadePaga: number;
    valorPago: number;
}

export interface ComissaoPendente {
    id: string;
    idComissao: string;
    numeroParcela: string; // Ex: "01/30"
    codigoVenda: string; // Código da venda
    statusPagamento: string; // Atrasado, A receber, Recebido
    produto: string;
    imovel: string;
    nome: string;
    cargo: string;
    valor: number;
    dataPrevista: Date;
    status: string; // Status da parcela: Pendente, Liberada, Bloqueado
}

export interface ComissaoHistorico {
    periodo: Date;
    valorFaturado: number;
    qtdParcelasFaturadas: number;
    valorRecebido: number;
    qtdParcelasRecebidas: number;
    valorAReceber: number;
    qtdParcelasAReceber: number;
}

export interface ComissaoPendentesFiltros {
    pagina: number;
    tamanhoPagina: number;
    idEmpresa?: string;
    termoBusca?: string;
}

export interface ComissaoHistoricoFiltros {
    pagina: number;
    tamanhoPagina: number;
    idEmpresa?: string;
    dataInicio?: Date;
    dataFim?: Date;
}

export interface ParcelaComissaoGridDto {
    id: string;
    idComissao: string;
    numeroParcela: string;
    codigoVenda: string;
    statusPagamento: string;
    produto: string;
    imovel: string;
    nome: string;
    cargo: string;
    valor: number;
    dataPrevista: Date;
    statusParcela: EStatusParcela;
}

export interface BloquearParcelaRequest {
    motivo: string;
    idComissao: string;
}

export interface LiberarParcelasEmMassaRequest {
    idsParcelas: string[];
    idResponsavel: string;
}

export interface CancelarComissaoRequest {
    motivo: string;
    idResponsavel: string;
}
