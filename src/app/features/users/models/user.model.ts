// Enums para permissões
export enum EAcao {
    CRIAR = 'CRIAR',
    LER = 'LER',
    ATUALIZAR = 'ATUALIZAR',
    EXCLUIR = 'EXCLUIR'
}

export enum ENivelAcesso {
    DADOS_USUARIO = 'DADOS_USUARIO',
    DADOS_EQUIPE = 'DADOS_EQUIPE',
    TODOS = 'TODOS',
    NEGADO = 'NEGADO'
}

// Interface para permissão detalhada
export interface PermissaoDetalhadaDto {
    recursoId: string;
    recursoNome: string;
    acao: EAcao;
    nivelAcesso: ENivelAcesso;
}

// Interface para input de permissão
export interface PermissaoRecursoInput {
    recursoId: string;
    acao: EAcao;
    nivelAcesso: ENivelAcesso;
}

export interface User {
    id: string;
    nomeCompleto: string;
    email: string;
    inativo: boolean;
    tipoUsuario: UserRole;
    restricaoHorario?: any;
    equipeIds?: string[];
    perfilAcessoId?: string;
    // Novos campos: Permissões individuais
    permissoesIndividuais?: PermissaoDetalhadaDto[];
    limiteDescontoMaximoIndividual?: number;
    quantidadeMaximaReservasIndividual?: number;
    criadoEm: Date;
}

export interface UserListDTO {
    id: string;
    nome: string;
    email: string;
    ativo: boolean;
    perfil?: string;
    equipes: string[];
}

export interface UserCreateDTO {
    nomeCompleto: string;
    cpf: string;
    email: string;
    telefone: string;
    senha: string;
    empresaIds: string[];
    role: string;
    perfilAcessoId?: string;
}

export interface UserUpdateDTO {
    id: string;
    nomeCompleto: string;
    telefone: string;
    role: string;
    perfilAcessoId?: string;
    tipoUsuario: UserRole;
    restricaoHorario?: any;
    equipeIds?: string[];
    empresaIds?: string[];
    // Novos campos: Permissões individuais
    permissoesIndividuais?: PermissaoRecursoInput[];
    limiteDescontoMaximoIndividual?: number;
    quantidadeMaximaReservasIndividual?: number;
}

export enum UserRole {
    COLABORADOR = 'Colaborador',
    CLIENTE = 'Cliente',
    ADMINISTRADOR = 'Administrador'
}

export const UserStatusLabel: Record<string, string> = {
    true: 'Ativo',
    false: 'Inativo'
};
