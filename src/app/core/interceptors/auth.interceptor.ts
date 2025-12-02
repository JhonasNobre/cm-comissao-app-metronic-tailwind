import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * HTTP Interceptor que anexa o token JWT em todas as requisições
 * e trata erros de autenticação/autorização
 *
 * Interceptor funcional (Angular 14+)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Ignorar requisições de login para evitar loop ou envio desnecessário
    if (req.url.includes('/authentication/legacy-login')) {
        return next(req);
    }

    // Clonar requisição e adicionar header Authorization
    const token = authService.getAccessToken();

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
                authService.logout();
            }

            if (error.status === 403) {
                // Acesso negado (usuário não tem permissão)
                console.warn('Acesso negado. Usuário não possui permissão.');
                // router.navigate(['/error/403']); // Opcional: criar página de erro 403
            }

            return throwError(() => error);
        })
    );
};
