export const environment = {
    production: true,

    // API Configuration (Production - To be defined)
    apiUrl: 'https://api.clickmenos.com.br/api/v1',

    // Keycloak Configuration (Production)
    keycloak: {
        // URL do realm no Keycloak de produção
        issuer: 'https://auth.clickmenos.com.br/realms/clickmenos',

        // Client ID do frontend
        clientId: 'clickmenos-frontend',

        // URL de redirecionamento após login
        redirectUri: window.location.origin,

        // URL de redirecionamento após logout
        postLogoutRedirectUri: window.location.origin,

        // Tipo de resposta (code = Authorization Code Flow)
        responseType: 'code',

        // Scopes solicitados
        scope: 'openid profile email roles',

        // Exigir HTTPS em produção
        requireHttps: true,

        // Desabilitar debug em produção
        showDebugInformation: false,

        // Timeout do token em segundos (5 minutos)
        tokenTimeoutInSeconds: 300,

        // Habilitar silent refresh (renovação automática do token)
        silentRefresh: true,

        // URL para silent refresh
        silentRefreshRedirectUri: window.location.origin + '/assets/silent-refresh.html'
    }
};
