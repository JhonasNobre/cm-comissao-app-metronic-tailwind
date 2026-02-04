export interface VendaPendencia {
    id: number; // Requisito do GenericPTable/BaseEntity
    idVenda?: string;
    idVendaLegado: string;
    codigoVendaLegado: number;
    nomeCliente?: string;
    cpfCliente?: string;
    empreendimento?: string;
    unidade?: string;
    endereco?: string;
    dataVenda: string;
    statusGeral: 'Pendente' | 'Liberado';
    pendencias: PendenciaItem[];
    documentos: DocumentoConferencia[];
}

export interface PendenciaItem {
    tipo: string;
    descricao: string;
    bloqueante: boolean;
}

export interface DocumentoConferencia {
    codigo: number;
    tipo: string;
    url: string;
    status: string;
}
