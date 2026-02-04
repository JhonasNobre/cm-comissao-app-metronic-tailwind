export interface Bonus {
    id: string;
    idEmpresa: string;
    idUsuario: string;
    nomeUsuario?: string; // Preenchido no front/DTO
    tipoBonus: ETipoBonus;
    valorTotal: number;
    status: EStatusBonus;
    descricao: string;
    criadoEm: Date;
    parcelas: BonusParcela[];
}

export interface BonusParcela {
    id: string;
    numeroParcela: number;
    valorParcela: number;
    dataVencimento?: Date;
    status: EStatusParcela;
    valorRecebido?: number;
    dataPagamento?: Date;
}

export enum ETipoBonus {
    MetaAtingida = 1,
    Campanha = 2,
    Desempenho = 3,
    Manual = 4
}

export enum EStatusBonus {
    Pendente = 1,
    EmPagamento = 2,
    Pago = 3,
    Cancelado = 4
}

export enum EStatusParcela {
    Pendente = 1,
    Liberada = 2,
    Paga = 3,
    Cancelada = 4
}

export interface LancarBonusManualCommand {
    idUsuario: string;
    valor: number;
    descricao: string;
    qtdParcelas: number;
    idOrigem: string;
    dataCompetencia: string; // ISO Date
    dataPrimeiroVencimento: string; // ISO Date
}
