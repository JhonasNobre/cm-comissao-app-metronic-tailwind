export interface User {
    id: string;
    nomeCompleto: string;
    email: string;
    inativo: boolean;
    tipoUsuario: UserRole;
    restricaoHorario?: any; // Define specific type if needed later
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
    idEmpresa: string;
    role: string; // Keycloak role
    tipoUsuario: UserRole;
    restricaoHorario?: any;
}

export interface UserUpdateDTO {
    id: string;
    nomeCompleto: string;
    telefone: string;
    role: string;
    perfilAcessoId?: string;
    tipoUsuario: UserRole;
    restricaoHorario?: any;
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
