/**
 * DTO for creating a new holiday
 * Maps frontend naming (English) to backend naming (Portuguese)
 */
export interface CreateHolidayRequest {
    nome: string;
    data: string; // ISO date string
    tipo: number; // 1 = Nacional, 2 = Estadual, 3 = Municipal
    estadoUF?: string;
    municipio?: string;
    estadoId?: string;
    municipioId?: string;
}

/**
 * DTO for updating an existing holiday
 * Maps frontend naming (English) to backend naming (Portuguese)
 */
export interface UpdateHolidayRequest {
    nome: string;
    data: string; // ISO date string
    tipo: number; // 1 = Nacional, 2 = Estadual, 3 = Municipal
    estadoUF?: string;
    municipio?: string;
    estadoId?: string;
    municipioId?: string;
}
