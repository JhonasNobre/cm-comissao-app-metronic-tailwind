import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthService, AuthConfig } from 'angular-oauth2-oidc';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Serviço de autenticação usando Keycloak via OAuth2/OIDC
 * 
 * Implementa o fluxo Authorization Code + PKCE para autenticação segura
 * sem necessidade de client secret (public client).
 */
@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
    public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

    constructor(
        private oauthService: OAuthService,
        private router: Router
    ) {
        this.configureOAuth();
    }

    /**
     * Configuração do OAuth2/OIDC para Keycloak
     */
    private configureOAuth(): void {
        const authConfig: AuthConfig = {
            // URL do servidor de autorização (Keycloak realm)
            issuer: environment.keycloak.issuer,

            // Client ID registrado no Keycloak
            clientId: environment.keycloak.clientId,

            // URL de redirecionamento após login
            redirectUri: environment.keycloak.redirectUri,

            // URL de redirecionamento após logout
            postLogoutRedirectUri: environment.keycloak.postLogoutRedirectUri,

            // Tipo de resposta (code = Authorization Code Flow)
            responseType: environment.keycloak.responseType,

            // Scopes solicitados
            scope: environment.keycloak.scope,

            // Exigir HTTPS apenas em produção
            requireHttps: environment.keycloak.requireHttps,

            // Mostrar informações de debug no console
            showDebugInformation: environment.keycloak.showDebugInformation,

            // URL para silent refresh (renovação automática do token)
            silentRefreshRedirectUri: environment.keycloak.silentRefreshRedirectUri,

            // Timeout para silent refresh
            silentRefreshTimeout: 5000,

            // Usar silent refresh
            useSilentRefresh: environment.keycloak.silentRefresh,

            // Tempo de vida da sessão
            sessionChecksEnabled: true,

            // Clearstorage on logout
            clearHashAfterLogin: false
        };

        // Aplicar configuração
        this.oauthService.configure(authConfig);

        // Carregar discovery document do Keycloak
        this.oauthService.loadDiscoveryDocumentAndTryLogin().then(() => {
            if (this.oauthService.hasValidAccessToken()) {
                this.isAuthenticatedSubject.next(true);
                this.setupAutomaticSilentRefresh();
            }
        });

        // Eventos de token
        this.oauthService.events.subscribe(event => {
            if (event.type === 'token_received' || event.type === 'token_refreshed') {
                this.isAuthenticatedSubject.next(true);
            }
            if (event.type === 'logout' || event.type === 'token_error') {
                this.isAuthenticatedSubject.next(false);
            }
        });
    }

    /**
     * Inicia o fluxo de login redirecionando para o Keycloak
     */
    async login(): Promise<void> {
        await this.oauthService.loadDiscoveryDocument();
        this.oauthService.initCodeFlow();
    }

    /**
     * Realiza o logout do usuário
     */
    logout(): void {
        this.oauthService.logOut();
        this.isAuthenticatedSubject.next(false);
        this.router.navigate(['/auth/login']);
    }

    /**
     * Verifica se o usuário está autenticado
     */
    isAuthenticated(): boolean {
        return this.oauthService.hasValidAccessToken();
    }

    /**
     * Obtém o access token JWT
     */
    getAccessToken(): string {
        return this.oauthService.getAccessToken();
    }

    /**
     * Obtém o ID token JWT
     */
    getIdToken(): string {
        return this.oauthService.getIdToken();
    }

    /**
     * Obtém as informações do usuário (claims do token)
     */
    getUserInfo(): any {
        const claims = this.oauthService.getIdentityClaims();
        return claims;
    }

    /**
     * Obtém o ID da empresa do usuário (multitenancy)
     * Extrai do claim 'groups' no formato: /empresa_{UUID}
     */
    getIdEmpresa(): string | null {
        const claims: any = this.oauthService.getIdentityClaims();

        if (!claims || !claims.groups) {
            console.warn('Claim groups não encontrado no token');
            return null;
        }

        // Groups pode ser array ou string
        const groups = Array.isArray(claims.groups) ? claims.groups : [claims.groups];

        // Procurar por grupo que começa com 'empresa_' ou '/empresa_'
        const empresaGroup = groups.find((g: string) =>
            g.includes('empresa_')
        );

        if (!empresaGroup) {
            console.warn('Grupo de empresa não encontrado');
            return null;
        }

        // Extrair UUID do formato: /empresa_{UUID} ou empresa_{UUID}
        const match = empresaGroup.match(/empresa_([a-f0-9-]+)/i);
        return match ? match[1] : null;
    }

    /**
     * Obtém as roles do usuário
     */
    getUserRoles(): string[] {
        const claims: any = this.oauthService.getIdentityClaims();

        if (!claims) return [];

        // Keycloak pode colocar roles em diferentes lugares
        // realm_access.roles (padrão) ou roles direto
        if (claims.realm_access && claims.realm_access.roles) {
            return claims.realm_access.roles;
        }

        if (claims.roles) {
            return Array.isArray(claims.roles) ? claims.roles : [claims.roles];
        }

        return [];
    }

    /**
     * Verifica se o usuário tem uma role específica
     */
    hasRole(role: string): boolean {
        const roles = this.getUserRoles();
        return roles.includes(role);
    }

    /**
     * Verifica se o usuário é administrador
     */
    isAdmin(): boolean {
        return this.hasRole('Admin') || this.hasRole('admin-clickmenos');
    }

    /**
     * Verifica se o usuário é gestor
     */
    isGestor(): boolean {
        return this.hasRole('Gestor') || this.hasRole('gestor-imobiliaria');
    }

    /**
    * Verifica se o usuário é vendedor
    */
    isVendedor(): boolean {
        return this.hasRole('Vendedor') || this.hasRole('corretor');
    }

    /**
     * Configura renovação automática do token (silent refresh)
     */
    private setupAutomaticSilentRefresh(): void {
        this.oauthService.setupAutomaticSilentRefresh();
    }

    /**
     * Renova o token manualmente
     */
    async refreshToken(): Promise<void> {
        try {
            await this.oauthService.silentRefresh();
        } catch (error) {
            console.error('Erro ao renovar token:', error);
            this.logout();
        }
    }
}
