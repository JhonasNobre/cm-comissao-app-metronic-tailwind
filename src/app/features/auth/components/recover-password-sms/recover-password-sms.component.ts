import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-recover-password-sms',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './recover-password-sms.component.html',
    host: { class: 'contents' }
})
export class RecoverPasswordSmsComponent {
    identificador: string = '';
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
            this.handleSmsRequest();
        } else {
            this.handleCodeSubmit();
        }
    }

    handleSmsRequest() {
        if (!this.identificador) {
            this.error = 'Informe seu CPF ou Telefone.';
            return;
        }

        this.loading = true;

        this.authService.requestPasswordRecoverySms(this.identificador).subscribe({
            next: () => {
                this.loading = false;
                this.step = 2;
            },
            error: (err) => {
                console.error('SMS Request error:', err);
                this.loading = false;
                this.error = 'Ocorreu um erro ao solicitar o SMS. Verifique os dados e tente novamente.';
            }
        });
    }

    handleCodeSubmit() {
        if (!this.code) {
            this.error = 'Informe o código de verificação.';
            return;
        }

        if (this.code.length !== 6) {
            this.error = 'O código deve ter 6 dígitos.';
            return;
        }

        this.loading = true;

        this.authService.validateSmsCode(this.identificador, this.code).subscribe({
            next: () => {
                this.loading = false;
                // Código válido: Navegar para redefinição
                this.router.navigate(['/auth/reset-password'], {
                    queryParams: { email: this.identificador, token: this.code, type: 'sms' }
                });
            },
            error: (err) => {
                this.loading = false;
                this.error = 'Código inválido ou expirado. Verifique e tente novamente.';
            }
        });
    }

    back_to_step1() {
        this.step = 1;
        this.code = '';
        this.error = '';
    }
}
