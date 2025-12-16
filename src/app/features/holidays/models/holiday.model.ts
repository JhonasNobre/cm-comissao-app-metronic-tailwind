import { BaseEntity } from "../../../shared/models/base-model";

export enum HolidayType {
    NATIONAL = 'Nacional',
    STATE = 'Estadual',
    MUNICIPAL = 'Municipal'
}

export interface Holiday extends BaseEntity {
    name: string;
    date: Date;
    type: HolidayType;
    stateCode?: string; // UF (Deprecated)
    city?: string; // Município (Deprecated)
    estadoId?: string;
    municipioId?: string;
}
