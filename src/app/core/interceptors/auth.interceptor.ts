import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * HTTP Interceptor que anexa o token JWT em todas as requisições
 * e trata erros de autenticação/autorização
 *
 * Interceptor funcional (Angular 14+)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const oauthService = inject(OAuthService);
    const router = inject(Router);

    // Clonar requisição e adicionar header Authorization
    const token = oauthService.getAccessToken();

    if (token) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    // Processar requisição e tratar erros
    return next(req).pipe(
        catchError((error) => {
            if (error.status === 401) {
                // Token expirado ou inválido
                console.warn('Token expirado ou inválido. Redirecionando para login...');
                oauthService.logOut();
                router.navigate(['/auth/login']);
            }

            if (error.status === 403) {
                // Acesso negado (usuário não tem permissão)
                console.warn('Acesso negado. Usuário não possui permissão.');
                router.navigate(['/error/403']);
            }

            return throwError(() => error);
        })
    );
};
