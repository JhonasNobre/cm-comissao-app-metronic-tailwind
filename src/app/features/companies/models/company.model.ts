import { BaseEntity } from "../../../shared/models/base-model";

export enum CompanyStatus {
    ACTIVE = 'Active',
    INACTIVE = 'Inactive',
    PENDING = 'Pending',
    BLOCKED = 'Blocked'
}

export interface Company extends BaseEntity {
    name: string;
    tradeName: string; // Nome Fantasia
    cnpj: string;
    email: string;
    phone?: string;
    status: CompanyStatus;
    address?: {
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
        zipCode: string;
    };
    logo?: string;
    createdAt: Date;
    updatedAt?: Date;
}
