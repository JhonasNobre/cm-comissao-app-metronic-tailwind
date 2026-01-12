export interface UauConfiguration {
    urlApi: string;
    usuarioUau: string;
    senhaUau?: string; // Opcional no envio se não alterar
    
    sistemaIntegracao: string;
    stringConexao: string;
    
    usuarioClickmenos: string;
    senhaClickmenos?: string; // Opcional no envio se não alterar
    
    urlApiClickmenos: string;
    urlApiGraphql: string;
    
    usuarioActiveDirectory: string;
}

export interface UauConfigurationResponse {
    urlApi: string;
    usuarioUau: string;
    possuiSenhaConfigurada: boolean;
    
    sistemaIntegracao: string;
    stringConexao: string;
    
    usuarioClickmenos: string;
    possuiSenhaClickmenosConfigurada: boolean;
    
    urlApiClickmenos: string;
    urlApiGraphql: string;
    
    usuarioActiveDirectory: string;

    fimVigenciaToken?: Date;
}
