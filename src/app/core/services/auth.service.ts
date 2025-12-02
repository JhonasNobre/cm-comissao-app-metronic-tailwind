import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse } from '../models/auth.model';

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

    private readonly TOKEN_KEY = 'access_token';

    constructor(
        private http: HttpClient,
        private router: Router
    ) {
        this.checkToken();
    }

    /**
     * Verifica se existe um token válido no storage ao iniciar
     */
    private checkToken(): void {
        const token = this.getAccessToken();
        if (token) {
            if (this.isTokenExpired(token)) {
                this.logout();
            } else {
                this.isAuthenticatedSubject.next(true);
                this.updateCurrentUser(token);
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
                        this.setSession(response.access_token);
                    }
                })
            );
    }

    /**
     * Salva o token e atualiza o estado
     */
    private setSession(token: string): void {
        localStorage.setItem(this.TOKEN_KEY, token);
        this.isAuthenticatedSubject.next(true);
        this.updateCurrentUser(token);
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
        this.isAuthenticatedSubject.next(false);
        this.currentUserSubject.next(null);
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
}
