// Interfaces TypeScript para Estrutura de Comissão
// Correspondem aos DTOs do backend

export interface EstruturaComissao {
    id: string;
    nome: string;
    descricao?: string;
    idEmpresa: string;
    idEmpreendimento?: string;
    tipoComissao?: number; // TipoComissao enum
    valorPercentual?: number;
    valorFixoInicial?: number;
    regraLiberacao?: number; // RegraLiberacao enum
    percentualLiberacao?: number;
    parcelaLiberacao?: number;
    tipoRateio?: number; // TipoRateio enum
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
    numeroParcelas?: number;
    idGrupo?: string;
    tipoValor: number; // TipoValor enum
    percentual?: number;
    valorFixo?: number;
    ordemExibicao?: number;

    // Campos de Bônus
    tipoBonificacao?: number;
    origemPagamentoId?: string;
    parcelaInicialLiberacao?: number;
    liberacaoAutomaticaQuitacao?: boolean;
    tipoDistribuicao?: number;
    metaVendasMinima?: number;
    parentId?: string;
    membros: EstruturaComissaoMembro[];
}

export interface EstruturaComissaoMembro {
    id: string;
    idNivel: string;
    usuarioId?: string;
    equipeId?: string;
    nome: string;
}

// DTOs para requests

export interface CreateEstruturaComissaoRequest {
    nome: string;
    descricao?: string;
    idEmpresa: string;
    idEmpreendimento?: string;
    tipoComissao?: number;
    valorPercentual?: number;
    valorFixoInicial?: number;
    regraLiberacao?: number;
    percentualLiberacao?: number;
    parcelaLiberacao?: number;
    tipoRateio?: number;
    dataVigenciaInicio?: Date;
    dataVigenciaFim?: Date;
    niveis: CreateEstruturaComissaoNivelRequest[];
}

export interface CreateEstruturaComissaoNivelRequest {
    id: string;
    nomeNivel: string;
    prioridade: number;
    numeroParcelas?: number | null;
    idGrupo?: string;
    tipoValor: number;
    percentual?: number;
    valorFixo?: number;

    tipoComissao?: number | null;
    regraLiberacao?: number | null;
    prioridadePagamento?: number | null;
    // Campos de Bônus 
    tipoBonificacao?: number;
    origemPagamentoId?: string;
    parcelaInicialLiberacao?: number;
    liberacaoAutomaticaQuitacao?: boolean;
    tipoDistribuicao?: number;
    metaVendasMinima?: number;
    parentId?: string;
    membros: CreateEstruturaComissaoMembroRequest[];
    regrasParcelamento?: RegraParcelamentoBonificacaoRequest[];
}

export interface RegraParcelamentoBonificacaoRequest {
    id?: string;
    parcelasMin: number;
    parcelasMax: number;
    formaCalculo: number; // EFormaCalculoBonificacao
    numeroParcelasBonus: number;
    prioridadePagamento: number;
    percentual?: number;
    valorFixo?: number;
}

export interface CreateEstruturaComissaoMembroRequest {
    id: string;
    nome: string;
    usuarioId?: string;
    equipeId?: string;
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
