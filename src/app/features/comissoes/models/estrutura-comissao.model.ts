// Interfaces TypeScript para Estrutura de Comissão
// Correspondem aos DTOs do backend

export interface EstruturaComissao {
    id: string;
    nome: string;
    descricao?: string;
    idEmpresa: string;
    idEmpreendimento?: string;
    tipoComissao: number; // TipoComissao enum
    valorPercentual?: number;
    valorFixoInicial?: number;
    regraLiberacao: number; // RegraLiberacao enum
    percentualLiberacao?: number;
    parcelaLiberacao?: number;
    tipoRateio: number; // TipoRateio enum
    origem: number;
    dataVigenciaInicio?: Date;
    dataVigenciaFim?: Date;
    versao: number;
    ativo: boolean;
    niveis: EstruturaComissaoNivel[];
    criadoEm: Date;
    atualizadoEm?: Date;
}

export interface EstruturaComissaoNivel {
    id: string;
    idEstruturaComissao: string;
    nomeNivel: string;
    prioridade: number;
    idGrupo?: string;
    tipoValor: number; // TipoValor enum
    percentual?: number;
    valorFixo?: number;
    ordemExibicao?: number;
}

// DTOs para requests

export interface CreateEstruturaComissaoRequest {
    nome: string;
    descricao?: string;
    idEmpresa: string;
    idEmpreendimento?: string;
    tipoComissao: number;
    valorPercentual?: number;
    valorFixoInicial?: number;
    regraLiberacao: number;
    percentualLiberacao?: number;
    parcelaLiberacao?: number;
    tipoRateio: number;
    dataVigenciaInicio?: Date;
    dataVigenciaFim?: Date;
    niveis: CreateEstruturaComissaoNivelRequest[];
}

export interface CreateEstruturaComissaoNivelRequest {
    nomeNivel: string;
    prioridade: number;
    idGrupo?: string;
    tipoValor: number;
    percentual?: number;
    valorFixo?: number;
}

export interface UpdateEstruturaComissaoRequest extends CreateEstruturaComissaoRequest {
    id: string;
    versao: number;
}

// Filtros para listagem

export interface EstruturaComissaoFiltros {
    busca?: string;
    tipoComissao?: number;
    ativo?: boolean;
    idEmpresa?: string;
    pagina?: number;
    tamanhoPagina?: number;
}

// Response paginado

export interface PagedResult<T> {
    items: T[];
    totalItems: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
