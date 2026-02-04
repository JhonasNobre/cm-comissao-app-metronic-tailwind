export interface EstruturaBonificacao {
    id: string;
    idEmpresa: string;
    nome: string;
    descricao?: string;
    idOrigemPadrao: string;
    ativo: boolean;
    criadoEm: Date;
    planos: PlanoBonificacao[];
    metas: MetaBonificacao[];
}

export interface PlanoBonificacao {
    id: string;
    nomePlano: string;
    percentualBonus: number;
    qtdParcelasBonus: number;
    parcelaInicialLiberacao: number;
    prioridade: number;
    idOrigem: string;
    liberarAutomaticamenteNaQuitacao: boolean;
}

export interface MetaBonificacao {
    id: string;
    nomeMeta: string;
    quantidadeVendasMinima: number;
    valorBonus: number;
    qtdParcelasBonus: number;
    parcelaInicialLiberacao: number;
    idOrigem: string;
}

export interface CriarEstruturaBonificacaoCommand {
    nome: string;
    descricao?: string;
    idOrigemPadrao: string;
    planos: CriarPlanoBonificacaoDto[];
    metas: CriarMetaBonificacaoDto[];
}

export interface CriarPlanoBonificacaoDto {
    nomePlano: string;
    percentualBonus: number;
    qtdParcelasBonus: number;
    parcelaInicialLiberacao: number;
    prioridade: number;
    idOrigem: string;
    liberarAutomaticamenteNaQuitacao: boolean;
}

export interface CriarMetaBonificacaoDto {
    nomeMeta: string;
    quantidadeVendasMinima: number;
    valorBonus: number;
    qtdParcelasBonus: number;
    parcelaInicialLiberacao: number;
    idOrigem: string;
}
