import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { filter, map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.isDoneLoading$.pipe(
        filter(isDone => isDone), // Aguarda até que o carregamento esteja concluído
        take(1), // Pega apenas o primeiro valor "true"
        map(() => {
            if (authService.isAuthenticated()) {
                return true;
            }

            // Redirecionar para login se não estiver autenticado
            router.navigate(['/auth/login']);
            return false;
        })
    );
};
