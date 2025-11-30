import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * HTTP Interceptor que anexa o token JWT em todas as requisições
 * e trata erros de autenticação/autorização
 *
 * Interceptor funcional (Angular 14+)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);

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
