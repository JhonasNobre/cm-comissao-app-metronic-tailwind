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
                // 401 pode significar:
                // 1. Token expirado/inválido → Deslogar
                // 2. Token válido mas sem permissão para este recurso → NÃO deslogar

                const token = authService.getAccessToken();

                // Se não há token OU token está expirado → Deslogar
                if (!token || authService.isTokenExpired(token)) {
                    console.warn('Token ausente ou expirado. Redirecionando para login...');
                    authService.logout();
                } else {
                    // Token válido mas sem permissão para este recurso específico
                    console.warn('Acesso negado ao recurso:', req.url);
                    // Não desloga, apenas retorna o erro para o componente tratar
                }
            }

            if (error.status === 403) {
                // Acesso negado (usuário autenticado mas sem permissão)
                console.warn('Acesso negado. Usuário não possui permissão para:', req.url);
                // Nunca desloga em 403
            }

            return throwError(() => error);
        })
    );
};
