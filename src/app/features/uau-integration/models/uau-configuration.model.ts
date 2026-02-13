export interface UauConfiguration {
    urlApi: string;
    usuarioUau: string;
    senhaUau?: string; // Opcional no envio se não alterar

    sistemaIntegracao: string;
    stringConexao: string;

    usuarioClickmenos: string;
    senhaClickmenos?: string; // Opcional no envio se não alterar

    urlApiClickmenos: string;
    urlApiGraphql: string; // Adicionado de volta

    usuarioActiveDirectory: string;
}

export interface UauConfigurationResponse {
    urlApi: string;
    usuarioUau: string;

    // Configurações Globais
    sistemaIntegracao: string;
    stringConexao: string;

    usuarioClickmenos: string;
    urlApiClickmenos: string;
    urlApiGraphql: string; // Adicionado de volta

    usuarioActiveDirectory: string;

    fimVigenciaToken?: Date;
}
