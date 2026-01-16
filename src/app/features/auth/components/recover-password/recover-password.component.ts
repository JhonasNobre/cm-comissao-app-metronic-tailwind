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
    loading = false;
    error = '';
    success = '';

    constructor(
        private authService: AuthService
    ) { }

    submit() {
        if (!this.email) {
            this.error = 'Informe seu e-mail.';
            return;
        }

        this.loading = true;
        this.error = '';
        this.success = '';

        this.authService.recoverPassword(this.email).subscribe({
            next: () => {
                this.loading = false;
                this.success = 'Se o e-mail existir, você receberá instruções em breve.';
                this.email = ''; // Limpar campo
            },
            error: (err) => {
                console.error('Recover password error:', err);
                this.loading = false;
                this.error = 'Ocorreu um erro ao processar sua solicitação. Tente novamente.';
            }
        });
    }
}
