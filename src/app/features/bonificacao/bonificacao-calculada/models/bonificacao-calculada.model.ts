export enum ETipoBonificacao {
    PorParcelamento = 1,
    Livre = 2,
    PorMeta = 3
}

export enum EStatusBonificacao {
    Pendente = 1,
    PartialmenteLiberada = 2,
    Liberada = 3,
    Paga = 4,
    Cancelada = 5
}

export enum EStatusParcelaBonificacao {
    Pendente = 1,
    Liberada = 2,
    Paga = 3,
    Cancelada = 4
}

export interface BonificacaoItem {
    id: string;
    idUsuario: string;
    nomeBeneficiario: string;
    valorTotal: number | { valor: number };
    numeroParcelas: number;
}

export interface BonificacaoParcela {
    id: string;
    idUsuario: string;
    idItemBonificacao: string;
    numeroParcela: number;
    valorParcela: number | { valor: number };
    dataPrevista?: Date;
    dataLiberacao?: Date;
    status: EStatusParcelaBonificacao | string;
}

export interface BonificacaoCalculada {
    id: string;
    idEmpresa: string;
    idVendaImportada: string;
    idEstruturaComissao: string;
    idNivel: string;
    tipoBonificacao: ETipoBonificacao | string;
    valorBase: number | { valor: number };
    valorTotal: number | { valor: number };
    status: EStatusBonificacao | string;
    criadoEm: Date;
    itens: BonificacaoItem[];
    parcelas: BonificacaoParcela[];
}

export interface BonificacaoFiltros {
    idEmpresa?: string;
    mes?: number;
    ano?: number;
    tipo?: ETipoBonificacao;
    status?: EStatusBonificacao;
    pagina: number;
    tamanhoPagina: number;
}
