/**
 * DTO for creating a new company
 * Maps frontend naming (English) to backend naming (Portuguese)
 */
export interface CreateCompanyRequest {
    nome: string;
    cnpj: string;
}

/**
 * DTO for updating an existing company
 * Maps frontend naming (English) to backend naming (Portuguese)
 */
export interface UpdateCompanyRequest {
    nome: string;
    cnpj: string;
}

/**
 * DTO for updating the legacy domain code (CodigoDominioLegado)
 */
export type UpdateCodigoDominioLegadoRequest = number | null;
