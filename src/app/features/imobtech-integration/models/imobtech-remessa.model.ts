// Remessa Models
export interface RemessaDto {
    id: string;
    idVendaInterna: number;
    empresaId: string;
    imobtechRemessaId: string | null;
    status: StatusRemessaImobtech;
    statusDescricao: string;
    dataEnvio: string | null;
    dataProcessamento: string | null;
    mensagemErro: string | null;
    tentativasReprocessamento: number;
}

export enum StatusRemessaImobtech {
    Pendente = 0,
    Processando = 1,
    Sucesso = 2,
    Erro = 3,
    Cancelado = 4
}

export interface ListarRemessasResponse {
    data: RemessaDto[];
    total: number;
    page: number;
    pageSize: number;
}

export interface ObterRemessaResponse {
    id: string;
    idVendaInterna: number;
    empresaId: string;
    imobtechRemessaId: string | null;
    status: StatusRemessaImobtech;
    statusDescricao: string;
    dataEnvio: string | null;
    dataProcessamento: string | null;
    mensagemErro: string | null;
    tentativasReprocessamento: number;
    valorTotal: number;
}

// Reprogramar Vencimento Models
export interface ReprogramarVencimentoRequest {
    idParcelaInterna: number;
    novaDataVencimento: string; // ISO date string
}

// Criar Remessa Manual Models (Teste)
export interface CriarRemessaManualRequest {
    empresaId: string;
    comissao: ComissaoCalculadaDto;
}

export interface CriarRemessaManualResponse {
    remessaId: string;
    mensagem: string;
}

export interface ComissaoCalculadaDto {
    idVenda: number;
    valorVenda: number;
    cliente: ClienteVendaDto;
    parcelas: ParcelaComissaoDto[];
}

export interface ClienteVendaDto {
    nomeCompleto: string;
    cpfCnpj: string;
    email: string;
    telefone: string;
    endereco: EnderecoDto;
}

export interface EnderecoDto {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
}

export interface ParcelaComissaoDto {
    numeroParcela: number;
    valorParcela: number;
    dataVencimento: string;
    beneficiarios: BeneficiarioRateioDto[];
}

export interface BeneficiarioRateioDto {
    nome: string;
    cpfCnpj: string;
    percentual: number;
    valor: number;
    chavePix: string;
    tipoChavePix: 'CPF' | 'CNPJ' | 'Email' | 'Telefone' | 'ChaveAleatoria';
}
