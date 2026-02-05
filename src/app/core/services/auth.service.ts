import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse } from '../models/auth.model';
import { EmpresaSelectorService, EmpresaInfo } from './empresa-selector.service';

export interface SignupRequest {
    nome: string;
    sobrenome: string;
    email: string;
    telefone: string;
    titulo: string;
    mensagem: string;
    arquivo?: File;
}

/**
 * Serviço de autenticação usando API Backend (JWT)
 */
@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
    public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

    private currentUserSubject = new BehaviorSubject<any>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    public get currentUserValue(): any {
        return this.currentUserSubject.value;
    }

    private readonly TOKEN_KEY = 'access_token';
    private readonly REFRESH_TOKEN_KEY = 'refresh_token';
    private tokenRefreshTimer: any = null;

    constructor(
        private http: HttpClient,
        private router: Router,
        private empresaSelectorService: EmpresaSelectorService
    ) {
        // Deferir a verificação do token para permitir que o construtor termine
        // e evitar dependência circular (AuthService -> HttpClient -> Interceptor -> AuthService)
        setTimeout(() => {
            this.checkToken();
        }, 0);
    }

    /**
     * Verifica se existe um token válido no storage ao iniciar
     */
    private checkToken(): void {
        const token = this.getAccessToken();
        const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);

        if (token) {
            if (this.isTokenExpired(token)) {
                // Se expirado mas tem refresh token, tenta renovar
                if (refreshToken) {
                    this.refreshToken().subscribe({
                        error: () => this.logout()
                    });
                } else {
                    this.logout();
                }
            } else {
                this.isAuthenticatedSubject.next(true);
                this.updateCurrentUser(token);
                this.updateEmpresaSelector(); // Fix: Load companies on startup
                this.scheduleTokenRefresh(token); // Re-agendar timer!
            }
        }
    }

    /**
     * Realiza o login na API
     */
    login(credentials: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${environment.apiUrl}/authentication/legacy-login`, credentials)
            .pipe(
                tap(response => {
                    if (response && response.access_token) {
                        this.setSession(response.access_token, response.refresh_token);
                    }
                })
            );
    }

    /**
     * Atualiza a senha no primeiro acesso (quando obrigatório pelo Keycloak)
     */
    changePasswordFirstAccess(credentials: any): Observable<any> {
        return this.http.post(`${environment.apiUrl}/authentication/change-password-first-access`, credentials);
    }

    /**
     * Salva o token e atualiza o estado
     */
    private setSession(token: string, refreshToken?: string): void {
        localStorage.setItem(this.TOKEN_KEY, token);
        if (refreshToken) {
            localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
        }
        this.isAuthenticatedSubject.next(true);
        this.updateCurrentUser(token);
        this.updateEmpresaSelector();
        this.scheduleTokenRefresh(token);
    }

    /**
     * Atualiza os dados do usuário a partir do token
     */
    private updateCurrentUser(token: string): void {
        try {
            const claims = this.decodeToken(token);
            this.currentUserSubject.next(claims);
        } catch (e) {
            console.error('Erro ao decodificar token', e);
        }
    }

    /**
     * Realiza o logout do usuário
     */
    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        this.isAuthenticatedSubject.next(false);
        this.currentUserSubject.next(null);
        this.cancelTokenRefresh();
        this.empresaSelectorService.clear();
        this.router.navigate(['/auth/login']);
    }

    /**
     * Verifica se o usuário está autenticado
     */
    isAuthenticated(): boolean {
        const token = this.getAccessToken();
        return !!token && !this.isTokenExpired(token);
    }

    /**
     * Obtém o access token JWT
     */
    getAccessToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    /**
     * Obtém as informações do usuário (claims do token)
     */
    getUserInfo(): any {
        return this.currentUserSubject.value;
    }

    /**
     * Decodifica o payload do JWT
     */
    private decodeToken(token: string): any {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    }

    /**
     * Verifica se o token expirou
     */
    public isTokenExpired(token: string): boolean {
        const decoded = this.decodeToken(token);
        if (!decoded || !decoded.exp) return true;

        const expirationDate = decoded.exp * 1000;
        return new Date().getTime() > expirationDate;
    }

    /**
     * Obtém o ID da empresa do usuário (multitenancy)
     * Extrai do claim 'groups' no formato: /empresa_{UUID}
     */
    getIdEmpresa(): string | null {
        const claims = this.getUserInfo();

        if (!claims || !claims.groups) {
            return null;
        }

        // Groups pode ser array ou string
        const groups = Array.isArray(claims.groups) ? claims.groups : [claims.groups];

        // Procurar por grupo que começa com 'empresa_' ou '/empresa_'
        const empresaGroup = groups.find((g: string) =>
            g.includes('empresa_')
        );

        if (!empresaGroup) {
            return null;
        }

        // Extrair UUID do formato: /empresa_{UUID} ou empresa_{UUID}
        const match = empresaGroup.match(/empresa_([a-f0-9-]+)/i);
        return match ? match[1] : null;
    }

    /**
     * Obtém todas as empresas do usuário (para multiselect)
     * Extrai do claim 'groups' no formato: /empresa_{UUID}
     */
    getEmpresas(): EmpresaInfo[] {
        const claims = this.getUserInfo();

        if (!claims || !claims.groups) {
            return [];
        }

        // Groups pode ser array ou string
        const groups = Array.isArray(claims.groups) ? claims.groups : [claims.groups];

        // Filtrar grupos de empresa e extrair UUIDs
        return groups
            .filter((g: string) => g.includes('empresa_'))
            .map((g: string) => {
                const match = g.match(/empresa_([a-f0-9-]+)/i);
                if (match) {
                    return {
                        id: match[1],
                        nome: `Empresa ${match[1].substring(0, 8)}...` // Nome temporário
                    };
                }
                return null;
            })
            .filter((e: EmpresaInfo | null): e is EmpresaInfo => e !== null);
    }

    /**
     * Atualiza o EmpresaSelectorService com as empresas do usuário
     */
    private updateEmpresaSelector(): void {
        const empresas = this.getEmpresas();

        if (empresas.length > 0) {
            this.empresaSelectorService.setUserEmpresas(empresas);
        } else {
            console.warn('Nenhuma empresa encontrada no token. Tentando buscar via API...');
            // Usar endpoint /me/empresas que resolve o ExternalAuthId no backend
            this.http.get<any[]>(`${environment.apiUrl}/v1/usuarios/me/empresas`)
                .subscribe({
                    next: (data) => {
                        if (data && data.length > 0) {
                            const empresasApi = data.map(e => ({
                                id: e.id,
                                nome: e.nome,
                                codigoLegado: e.codigoLegado
                            }));
                            this.empresaSelectorService.setUserEmpresas(empresasApi);
                        } else {
                            console.warn('Usuário não possui empresas vinculadas na API.');
                        }
                    },
                    error: (err) => console.error('Erro ao buscar empresas do usuário via API', err)
                });
        }
    }

    /**
     * Obtém o ID do usuário a partir do token (sub)
     */
    getUserId(): string | null {
        const claims = this.getUserInfo();
        return claims ? claims.sub : null;
    }

    /**
     * Obtém as roles do usuário
     */
    getUserRoles(): string[] {
        const claims = this.getUserInfo();

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
     * Agenda a renovação automática do token
     */
    private scheduleTokenRefresh(token: string): void {
        this.cancelTokenRefresh();

        const decoded = this.decodeToken(token);
        if (!decoded || !decoded.exp) return;

        const expiresAt = decoded.exp * 1000;
        const now = new Date().getTime();
        const timeUntilExpiry = expiresAt - now;

        // Renovar 2 minutos antes de expirar (ou quando faltar 20% do tempo)
        const refreshBuffer = Math.min(2 * 60 * 1000, timeUntilExpiry * 0.2);
        const refreshTime = timeUntilExpiry - refreshBuffer;

        if (refreshTime > 0) {
            this.tokenRefreshTimer = setTimeout(() => {
                this.refreshToken().subscribe();
            }, refreshTime);
        }
    }

    /**
     * Cancela o timer de renovação
     */
    private cancelTokenRefresh(): void {
        if (this.tokenRefreshTimer) {
            clearTimeout(this.tokenRefreshTimer);
            this.tokenRefreshTimer = null;
        }
    }

    /**
     * Renova o access token usando o refresh token
     */
    /**
     * Renova o access token usando o refresh token
     */
    private refreshToken(): Observable<LoginResponse | null> {
        const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
        if (!refreshToken) {
            this.logout();
            return of(null);
        }

        return this.http.post<LoginResponse>(`${environment.apiUrl}/authentication/refresh`, { RefreshToken: refreshToken })
            .pipe(
                catchError(error => {
                    console.error('Failed to refresh token', error);
                    this.logout();
                    return of(null);
                }),
                tap(response => {
                    if (response && response.access_token) {
                        this.setSession(response.access_token, response.refresh_token);
                    }
                })
            );
    }
    /**
     * Solicita a recuperação de senha
     */
    recoverPassword(email: string): Observable<any> {
        return this.http.post(`${environment.apiUrl}/authentication/recover-password`, { email });
    }

    /**
     * Redefine a senha com o token
     */
    resetPassword(data: any): Observable<any> {
        return this.http.post(`${environment.apiUrl}/authentication/reset-password`, data);
    }

    /**
     * Solicita cadastro de novo usuário
     */
    requestSignup(data: SignupRequest): Observable<any> {
        const formData = new FormData();
        formData.append('nome', data.nome);
        formData.append('sobrenome', data.sobrenome);
        formData.append('email', data.email);
        formData.append('telefone', data.telefone);
        formData.append('titulo', data.titulo);
        formData.append('mensagem', data.mensagem);

        if (data.arquivo) {
            formData.append('arquivo', data.arquivo);
        }

        return this.http.post(`${environment.apiUrl}/authentication/signup-request`, formData);
    }

    validateRecoveryCode(email: string, code: string): Observable<any> {
        return this.http.post(`${environment.apiUrl}/authentication/validate-recovery-code`, { email, code });
    }

    /**
     * Solicita recuperação de senha via SMS
     */
    requestPasswordRecoverySms(identificador: string): Observable<any> {
        return this.http.post(`${environment.apiUrl}/authentication/recover-password-sms`, { identificador });
    }

    /**
     * Valida o código recebido via SMS
     */
    validateSmsCode(identificador: string, code: string): Observable<any> {
        return this.http.post(`${environment.apiUrl}/authentication/validate-recovery-code-sms`, { identificador, code });
    }

    /**
     * Redefine a senha usando o código SMS
     */
    resetPasswordSms(data: any): Observable<any> {
        return this.http.post(`${environment.apiUrl}/authentication/reset-password-sms`, data);
    }
}

