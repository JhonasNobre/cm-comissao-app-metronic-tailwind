import { BaseEntity } from "../../../shared/models/base-model";

/**
 * Access Profile model matching backend PerfilAcessoDto
 */
export interface AccessProfile extends BaseEntity {
    id: string;
    nome: string;
    limiteDescontoMaximo: number;
    ehPadrao: boolean;
    quantidadeMaximaReservas: number;
    restricaoHorario?: any; // We can refine this type later if needed, or reuse the one from User
    permissoes: PermissionDetail[];
    criadoEm?: Date;
    atualizadoEm?: Date;
}

export interface PermissionDetail {
    recursoId: string;
    recursoNome: string;
    acao: string;
    nivelAcesso: string;
}
