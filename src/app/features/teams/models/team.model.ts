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

    // Campos adicionados para layout de cards
    grupoEquipeNome?: string;
    grupoEquipeCor?: string;
    grupoEquipeId?: string;
    liderNome?: string;
    liderEmail?: string;
}

export interface TeamCreateDTO {
    nome: string;
    descricao?: string;
    grupoEquipeId?: string;
    perfilAcessoId?: string;
    restricaoHorario?: any;
}

export interface TeamUpdateDTO {
    id: string;
    nome: string;
    descricao?: string;
    grupoEquipeId?: string;
    perfilAcessoId?: string;
    restricaoHorario?: any;
}
