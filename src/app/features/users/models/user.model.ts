export interface User {
    id: string;
    nomeCompleto: string;
    email: string;
    inativo: boolean;
    tipoUsuario: UserRole;
    restricaoHorario?: any; // Define specific type if needed later
    equipeIds?: string[];
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
    nome: string;
    cpf: string;
    email: string;
    telefone: string;
    password: string;
    empresaIds: string[];
    roles: string[];
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
