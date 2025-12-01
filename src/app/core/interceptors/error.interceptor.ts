import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const messageService = inject(MessageService);

    return next(req).pipe(
        catchError((error) => {
            let errorMessage = 'Ocorreu um erro inesperado.';
            let errorSummary = 'Erro';

            if (error.error instanceof ErrorEvent) {
                // Erro do lado do cliente
                errorMessage = error.error.message;
            } else {
                // Erro do lado do servidor
                if (error.status === 401) {
                    errorSummary = 'Não autorizado';
                    errorMessage = 'Sua sessão expirou ou você não tem permissão.';
                } else if (error.status === 403) {
                    errorSummary = 'Acesso negado';
                    errorMessage = 'Você não tem permissão para acessar este recurso.';
                } else if (error.status === 404) {
                    errorSummary = 'Não encontrado';
                    errorMessage = 'O recurso solicitado não foi encontrado.';
                } else if (error.status >= 500) {
                    errorSummary = 'Erro no servidor';
                    errorMessage = 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.';
                } else if (error.error && error.error.message) {
                    errorMessage = error.error.message;
                }
            }

            // Exibe o toast de erro
            messageService.add({
                severity: 'error',
                summary: errorSummary,
                detail: errorMessage,
                life: 5000
            });

            console.error('HTTP Error:', error);
            return throwError(() => error);
        })
    );
};
