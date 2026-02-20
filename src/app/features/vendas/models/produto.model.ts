export interface ProdutoImportado {
    id: string;
    nome: string;
    codigoLegado?: string;
    nomeCidade?: string;
    uf?: string;
    tipoProduto: number;
    status: number;
    codigoObra?: string;
}

export interface ProdutoFiltros {
    pagina: number;
    tamanhoPagina: number;
    busca?: string;
    idEmpresa?: string;
}
