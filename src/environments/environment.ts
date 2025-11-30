export const environment = {
    production: false,

    // API Configuration
    apiUrl: 'https://localhost:5001/api/v1',

    // Keycloak Configuration
    keycloak: {
        // URL do realm no Keycloak
        issuer: 'http://localhost:8080/realms/clickmenos',

        // Client ID do frontend (public client com PKCE)
        clientId: 'clickmenos-frontend',

        // URL de redirecionamento após login (deve estar configurada no Keycloak)
        redirectUri: window.location.origin,

        // URL de redirecionamento após logout
        postLogoutRedirectUri: window.location.origin,

        // Tipo de resposta (code = Authorization Code Flow)
        responseType: 'code',

        // Scopes solicitados
        scope: 'openid profile email roles',

        // Desabilitar HTTPS em desenvolvimento (apenas local)
        requireHttps: false,

        // Mostrar informações de debug no console
        showDebugInformation: true,

        // Timeout do token em segundos (5 minutos)
        tokenTimeoutInSeconds: 300,

        // Habilitar silent refresh (renovação automática do token)
        silentRefresh: true,

        // URL para silent refresh
        silentRefreshRedirectUri: window.location.origin + '/assets/silent-refresh.html'
    }
};
