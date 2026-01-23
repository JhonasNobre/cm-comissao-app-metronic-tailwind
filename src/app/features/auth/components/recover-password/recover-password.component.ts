import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-recover-password',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './recover-password.component.html',
    host: { class: 'contents' }
})
export class RecoverPasswordComponent {
    email: string = '';
    code: string = '';
    step: 1 | 2 = 1;

    loading = false;
    error = '';
    success = '';

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    submit() {
        this.error = '';
        this.success = '';

        if (this.step === 1) {
            this.handleEmailSubmit();
        } else {
            this.handleCodeSubmit();
        }
    }

    handleEmailSubmit() {
        if (!this.email) {
            this.error = 'Informe seu e-mail.';
            return;
        }

        this.loading = true;

        this.authService.recoverPassword(this.email).subscribe({
            next: () => {
                this.loading = false;
                this.step = 2; // Avança para o passo do código
                // Não mostramos mensagem de sucesso para focar no próximo passo, 
                // ou podemos mostrar um toast/alert.
            },
            error: (err) => {
                console.error('Recover password error:', err);
                this.loading = false;
                // Por segurança, mesmo se falhar (ex: email não existe), 
                // algumas implementações avançam, mas o backend aqui retorna 200 se não existir (handler padrão).
                // Se der erro 500, mostramos erro.
                this.step = 2; // Avança mesmo assim para evitar enumeração de usuários (se o backend já não fizesse isso)
            }
        });
    }

    handleCodeSubmit() {
        if (!this.code) {
            this.error = 'Informe o código de verificação.';
            return;
        }

        this.loading = true;

        this.authService.validateRecoveryCode(this.email, this.code).subscribe({
            next: () => {
                this.loading = false;
                // Código válido: Navegar para redefinição
                this.router.navigate(['/auth/reset-password'], {
                    queryParams: { email: this.email, token: this.code }
                });
            },
            error: (err) => {
                this.loading = false;
                this.error = 'Código inválido ou expirado. Verifique e tente novamente.';
            }
        });
    }

    back_to_email() {
        this.step = 1;
        this.code = '';
        this.error = '';
    }
}
