// export interface ColumnHeader<T> {
//     field: keyof T | string;
//     header: string;
//     enumType?: string;
//     pipe?: string;
//     pipeArgs?: any;
//     formatter?: (value: any, item?: T) => string;
//     type?: 'text' | 'number' | 'currency' | 'date' | 'yesNo';
//     disabled?: boolean;
//     hasTranslate?: boolean;
//     style?: string;
//     order?: number;
//     filter?: boolean;
//     sortable?: boolean;
//     lookupType?: string;
//     /** Se a coluna pode ser escondida. Colunas sem essa flag (ou com false) são sempre visíveis. */
//     optional?: boolean;
//     /** Se a coluna for opcional, esta flag diz se ela deve vir marcada por padrão. */
//     defaultSelected?: boolean;

//     /**
//      * Define como o conteúdo da célula deve ser renderizado.
//      * Se definido como 'badge', a tabela usará o componente <p-badge>.
//      */
//     displayAs?: 'badge';

//     /**
//      * Mapeia os valores de texto da célula para as "severidades" (cores) do PrimeNG Badge.
//      * Ex: { 'Completo': 'success', 'Pendente': 'warning' }
//      */
//     badgeSeverityMap?: { [key: string]: string };
// }
/**
 * Define a configuração para uma coluna na tabela genérica.
 * @template T O tipo do objeto de dados da linha.
 */
export interface ColumnHeader<T> {
    /** O nome da propriedade no objeto de dados a ser exibida. */
    field: keyof T | (string & {});

    /** A chave de tradução para o título da coluna no cabeçalho. */
    header: string;
    hasTranslate?: boolean;

    /**
     * Define como o conteúdo da célula deve ser renderizado.
     * - 'text' (padrão): Apenas texto.
     * - 'badge': Renderiza como um componente <p-badge>.
     * - 'image': Renderiza um avatar com uma imagem e um nome ao lado.
     */
    displayAs?: 'text' | 'number' | 'currency' | 'date' | 'yesNo' | 'badge' | 'image';

    /**
     * Usado quando displayAs é 'image'. Especifica qual campo do objeto de dados
     * contém o nome/texto a ser exibido ao lado do avatar.
     */
    nameField?: keyof T | (string & {});

    /**
     * Usado quando displayAs é 'badge'. Mapeia os valores da célula para as
     * "severidades" (cores) do PrimeNG Badge.
     * Ex: { 'Completo': 'success', 'Pendente': 'warning' }
     */
    badgeSeverityMap?: { [key: string]: string };

    // --- Outras Propriedades de Configuração ---

    /** Um pipe do Angular a ser aplicado ao valor (ex: 'currency', 'date'). */
    pipe?: string;
    /** Argumentos para o pipe (ex: formato de data ou moeda). */
    pipeArgs?: any;
    /** Uma função de formatação customizada. Tem prioridade sobre os pipes. */
    formatter?: (value: any, item?: T) => string;
    /** Para o pipe 'lookup', especifica o tipo de lookup a ser usado. */
    lookupType?: string;
    /** Usado por formatadores/pipes para saber o tipo do enum. */
    enumType?: string;

    /** Se a coluna pode ser escondida pelo seletor de colunas. */
    optional?: boolean;
    /** Se a coluna opcional deve vir selecionada por padrão. */
    defaultSelected?: boolean;

    /** Estilos CSS em linha para a coluna (ex: 'min-width: 150px;'). */
    style?: string;
    /** A ordem de exibição da coluna. */
    order?: number;
    /** Se a coluna deve ter um filtro no cabeçalho. */
    filter?: boolean;
    /** Se a coluna pode ser ordenada. */
    sortable?: boolean;
    /** Template customizado para o corpo da célula. */
    bodyTemplate?: import('@angular/core').TemplateRef<any>;
    /** Se a coluna deve ser escondida por padrão. */
    hidden?: boolean;
}
