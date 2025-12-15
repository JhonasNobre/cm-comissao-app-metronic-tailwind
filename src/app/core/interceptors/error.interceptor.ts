import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { AuthService } from '../services/auth.service';

let isLoggingOut = false; // Flag para evitar múltiplos logouts

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const messageService = inject(MessageService);
    const authService = inject(AuthService);

    return next(req).pipe(
        catchError((error) => {
            let errorMessage = 'Ocorreu um erro inesperado.';
            let errorSummary = 'Erro';
            let shouldShowToast = true; // Controle de exibição do toast

            if (error.error instanceof ErrorEvent) {
                // Erro do lado do cliente
                errorMessage = error.error.message;
            } else {
                // Erro do lado do servidor
                if (error.status === 400 && error.error && error.error.errors) {
                    // Erros de validação do FluentValidation
                    const errors = error.error.errors;
                    if (Array.isArray(errors)) {
                        // Array de erros - mostrar cada um
                        errors.forEach((err: any) => {
                            messageService.add({
                                severity: 'error',
                                summary: 'Erro de Validação',
                                detail: err.message || err,
                                life: 5000
                            });
                        });
                        return throwError(() => error);
                    } else {
                        // Objeto com erros por campo
                        const allMessages: string[] = [];
                        Object.keys(errors).forEach(key => {
                            const messages = Array.isArray(errors[key]) ? errors[key] : [errors[key]];
                            allMessages.push(...messages);
                        });
                        errorSummary = 'Erro de Validação';
                        errorMessage = allMessages.join('; ');
                    }
                } else if (error.status === 401) {
                    // Sessão expirada - redirecionar uma única vez
                    if (!isLoggingOut) {
                        isLoggingOut = true;
                        errorSummary = 'Sessão Expirada';
                        errorMessage = 'Sua sessão expirou. Por favor, faça login novamente.';

                        // Aguardar um momento e resetar flag após logout
                        setTimeout(() => {
                            authService.logout();
                            isLoggingOut = false;
                        }, 100);
                    } else {
                        // Se já está fazendo logout, não mostrar toast duplicado
                        shouldShowToast = false;
                    }
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

            // Exibe o toast de erro apenas se não for um logout duplicado
            if (shouldShowToast) {
                messageService.add({
                    severity: 'error',
                    summary: errorSummary,
                    detail: errorMessage,
                    life: 5000
                });
            }

            console.error('HTTP Error:', error);
            return throwError(() => error);
        })
    );
};
