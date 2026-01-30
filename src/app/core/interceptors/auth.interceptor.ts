import { HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { EmpresaSelectorService } from '../services/empresa-selector.service';

/**
 * HTTP Interceptor que anexa o token JWT em todas as requisições
 * e trata erros de autenticação/autorização
 *
 * Interceptor funcional (Angular 14+)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const injector = inject(Injector);
    // Lazy load AuthService to avoid Circular Dependency
    const authService = injector.get(AuthService);
    const empresaSelectorService = inject(EmpresaSelectorService);
    const router = inject(Router);

    // Ignorar requisições de login para evitar loop ou envio desnecessário
    if (req.url.includes('/authentication/legacy-login')) {
        return next(req);
    }

    // Clonar requisição e adicionar headers
    const token = authService.getAccessToken();
    const selectedEmpresaIds = empresaSelectorService.getSelectedEmpresaIds();

    let headers: { [key: string]: string } = {};

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Adicionar header X-Empresa-Ids se houver empresas selecionadas
    if (selectedEmpresaIds.length > 0) {
        headers['X-Empresa-Ids'] = selectedEmpresaIds.join(',');
    }

    if (Object.keys(headers).length > 0) {
        req = req.clone({ setHeaders: headers });
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
