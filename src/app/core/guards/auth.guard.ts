import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';


/**
 * Guard para proteger rotas que requerem autenticação
 * 
 * Aguarda o Keycloak terminar de carregar antes de verificar autenticação
 * 
 * Uso:
 * ```typescript
 * {
 *   path: 'dashboard',
 *   component: DashboardComponent,
 *   canActivate: [authGuard]
 * }
 * ```
 */
export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    // Redirecionar para login se não estiver autenticado
    router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
    });
    return false;
};

/**
 * Guard para verificar se usuário tem uma role específica
 * 
 * Uso:
 * ```typescript
 * {
 *   path: 'admin',
 *   component: AdminComponent,
 *   canActivate: [roleGuard(['Admin'])]
 * }
 * ```
 */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
    return (route, state) => {
        const authService = inject(AuthService);
        const router = inject(Router);

        if (!authService.isAuthenticated()) {
            router.navigate(['/auth/login'], {
                queryParams: { returnUrl: state.url }
            });
            return false;
        }

        const userRoles = authService.getUserRoles();
        const hasAccess = allowedRoles.some(role => userRoles.includes(role));

        if (!hasAccess) {
            // Redirecionar para página de acesso negado
            router.navigate(['/error/403']);
            return false;
        }

        return true;
    };
};
