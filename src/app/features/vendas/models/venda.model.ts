export interface VendaImportada {
    id: string;
    idVendaLegado: string;
    codigoProdutoLegado?: string;
    imovel?: string;
    nomeCliente: string;
    valorTotalVenda: number;
    dataVenda: string;
    sistemaOrigem: number;
    statusImportacao: number;
    parcelasPagamento?: any[];
}

export interface VendaFiltros {
    pagina: number;
    tamanhoPagina: number;
    busca?: string;
    apenasPendentes: boolean;
}

export interface PagedResult<T> {
    items: T[];
    totalItems: number;
    page: number;
    pageSize: number;
}
