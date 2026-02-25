export interface Team {
    id: string;
    nome: string;
    descricao?: string;
    perfilAcessoId?: string;
    perfilAcessoNome?: string;
    limiteDescontoMaximo?: number;
    quantidadeMaximaReservas?: number;
    quantidadeUsuarios: number;
    criadoEm: Date;
    atualizadoEm?: Date;
}

export interface TeamListDTO {
    id: string;
    nome: string;
    descricao?: string;
    perfilAcessoNome?: string;
    quantidadeUsuarios: number;
    criadoEm: Date;
}

export interface TeamCreateDTO {
    nome: string;
    descricao?: string;
    perfilAcessoId?: string;
    restricaoHorario?: any;
    groups?: any[];
}

export interface TeamUpdateDTO {
    id: string;
    nome: string;
    descricao?: string;
    perfilAcessoId?: string;
    restricaoHorario?: any;
    groups?: any[];
}

export interface MembroEquipe {
    usuarioId: string;
    nome: string;
    email: string;
    perfilNome: string;
    grupoEquipeId: string;
}
