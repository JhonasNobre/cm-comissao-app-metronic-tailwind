// Enums de Venda
export enum ESistemaOrigem {
    Manual = 0,
    Legado = 1,
    Integracao = 2
}

export enum EStatusImportacao {
    Pendente = 0,
    Processada = 1,
    FalhaRegra = 2
}

// Interfaces
export interface VendaImportada {
    id: string;
    idVendaLegado: string;
    nomeCliente?: string;
    valorTotalVenda: number;
    dataVenda: Date;
    sistemaOrigem: ESistemaOrigem;
    statusImportacao: EStatusImportacao;
}

export interface VendaImportadaFiltros {
    pagina: number;
    tamanhoPagina: number;
    busca?: string;
    idEmpresa?: string;
    apenasPendentes?: boolean;
}
