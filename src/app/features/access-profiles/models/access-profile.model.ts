import { BaseEntity } from "../../../shared/models/base-model";

/**
 * Access Profile model matching backend PerfilAcessoDto
 */
export interface AccessProfile extends BaseEntity {
    id: string;
    nome: string;      // Profile name
    descricao?: string; // Profile description
}
