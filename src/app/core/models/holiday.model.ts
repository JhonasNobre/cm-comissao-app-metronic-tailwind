export interface Holiday {
    id: string;
    nome: string;
    data: string; // ISO date string
    tipo: 'Nacional' | 'Estadual' | 'Municipal';
    estadoUF?: string;
    municipio?: string;
}
