export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    avatar?: string;
    lastLogin?: Date;
    joinedDate: Date;
    phoneNumber?: string;
    teams?: string[]; // IDs or Names of teams
}

export interface UserListDTO {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    avatar?: string;
    joinedDate: Date;
}

export interface UserCreateDTO {
    name: string;
    email: string;
    role: UserRole;
    password?: string; // Optional if using invite flow
}

export interface UserUpdateDTO {
    name?: string;
    email?: string;
    role?: UserRole;
    status?: UserStatus;
    phoneNumber?: string;
}

export enum UserRole {
    ADMIN = 'Admin',
    GESTOR = 'Gestor',
    VENDEDOR = 'Vendedor',
    USER = 'User'
}

export enum UserStatus {
    ACTIVE = 'Active',
    INACTIVE = 'Inactive',
    PENDING = 'Pending',
    LOCKED = 'Locked'
}
