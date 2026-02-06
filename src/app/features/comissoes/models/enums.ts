// Enums para o sistema de comissões
// Correspondem aos enums do backend C#

export enum TipoComissao {
    Percentual = 1,
    ValorFixo = 2,
    Misto = 3,
    BonusPorPercentual = 4,
    BonusLivre = 5,
    BonusMeta = 6
}

export enum TipoRateio {
    Linear = 1,
    Prioritario = 2
}

export enum RegraLiberacao {
    Diretamente = 1,
    PercentualPago = 2,
    ParcelasPagas = 3
}

export enum TipoValor {
    Percentual = 1,
    Fixo = 2,
    Misto = 3
}

export enum StatusComissao {
    Pendente = 1,
    Aprovada = 2,
    Reprovada = 3,
    Liberada = 4,
    Cancelada = 5
}

export enum StatusParcela {
    Pendente = 1,
    Liberada = 2,
    Cancelada = 3
}

// Labels para exibição na UI
export const TipoComissaoLabels: Record<TipoComissao, string> = {
    [TipoComissao.Percentual]: 'Percentual',
    [TipoComissao.ValorFixo]: 'Valor Fixo',
    [TipoComissao.Misto]: 'Misto',
    [TipoComissao.BonusPorPercentual]: 'Bônus por Percentual',
    [TipoComissao.BonusLivre]: 'Bônus Livre',
    [TipoComissao.BonusMeta]: 'Bônus Meta'
};

export const TipoRateioLabels: Record<TipoRateio, string> = {
    [TipoRateio.Linear]: 'Linear',
    [TipoRateio.Prioritario]: 'Prioritário'
};

export const RegraLiberacaoLabels: Record<RegraLiberacao, string> = {
    [RegraLiberacao.Diretamente]: 'Liberação Direta',
    [RegraLiberacao.PercentualPago]: 'Por Percentual Pago',
    [RegraLiberacao.ParcelasPagas]: 'Por Parcelas Pagas'
};

export const StatusComissaoLabels: Record<StatusComissao, string> = {
    [StatusComissao.Pendente]: 'Pendente',
    [StatusComissao.Aprovada]: 'Aprovada',
    [StatusComissao.Reprovada]: 'Reprovada',
    [StatusComissao.Liberada]: 'Liberada',
    [StatusComissao.Cancelada]: 'Cancelada'
};

export const TipoValorLabels: Record<TipoValor, string> = {
    [TipoValor.Percentual]: 'Percentual',
    [TipoValor.Fixo]: 'Valor Fixo',
    [TipoValor.Misto]: 'Misto'
};

export enum TipoBonificacao {
    PorParcelamento = 1,
    Livre = 2,
    PorMeta = 3
}

export const TipoBonificacaoLabels: Record<TipoBonificacao, string> = {
    [TipoBonificacao.PorParcelamento]: 'Por Parcelamento',
    [TipoBonificacao.Livre]: 'Livre (Manual)',
    [TipoBonificacao.PorMeta]: 'Por Meta de Vendas'
};
