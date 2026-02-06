export interface OrigemPagamento {
    id: string;
    nome: string;
    descricao?: string;
    isDefault: boolean;
    ativo: boolean;
}

export interface CriarOrigemPagamentoRequest {
    nome: string;
    descricao?: string;
    idEmpresa: string;
    isDefault: boolean;
}

export interface AtualizarOrigemPagamentoRequest {
    nome: string;
    descricao?: string;
}
