export interface Team {
    id: string;
    nome: string;
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
    perfilAcessoNome?: string;
    quantidadeUsuarios: number;
    criadoEm: Date;
}

export interface TeamCreateDTO {
    nome: string;
    perfilAcessoId?: string;
    restricaoHorario?: any;
    groups?: any[];
}

export interface TeamUpdateDTO {
    id: string;
    nome: string;
    perfilAcessoId?: string;
    restricaoHorario?: any;
    groups?: any[];
}
