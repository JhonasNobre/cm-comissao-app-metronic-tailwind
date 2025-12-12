import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { EmpresaSelectorService } from '../services/empresa-selector.service';

/**
 * Guard que verifica se existe uma empresa selecionada no contexto (sessão).
 * Se não houver, redireciona para a tela de seleção de empresa.
 */
export const empresaSelectedGuard: CanActivateFn = (route, state) => {
    const empresaService = inject(EmpresaSelectorService);
    const router = inject(Router);

    // Ignora verificação para a própria rota de seleção
    if (state.url.includes('/auth/selecionar-empresa')) {
        return true;
    }

    const currentId = empresaService.getCurrentEmpresaId();

    if (currentId) {
        return true;
    }

    // Se não tem empresa, redireciona para seleção
    // Passa a URL original como retorno se necessário (opcional)
    return router.createUrlTree(['/auth/selecionar-empresa']);
};
