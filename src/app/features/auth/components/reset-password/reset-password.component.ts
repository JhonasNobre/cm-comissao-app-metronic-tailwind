import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ResetPasswordRequest } from '../../../../core/models/auth.model';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './reset-password.component.html',
    host: { class: 'contents' }
})
export class ResetPasswordComponent implements OnInit {
    data: ResetPasswordRequest = {
        email: '',
        token: '',
        newPassword: '',
        confirmPassword: ''
    };

    loading = false;
    error = '';
    success = '';

    constructor(
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.data.token = params['token'] || '';
            this.data.email = params['email'] || '';

            if (!this.data.token || !this.data.email) {
                this.error = 'Link de recuperação inválido ou incompleto.';
            }
        });
    }

    submit() {
        if (!this.data.token || !this.data.email) {
            this.error = 'Link inválido. Solicite uma nova recuperação.';
            return;
        }

        if (this.data.newPassword !== this.data.confirmPassword) {
            this.error = 'As senhas não conferem.';
            return;
        }

        if (this.data.newPassword.length < 6) {
            this.error = 'A senha deve ter no mínimo 6 caracteres.';
            return;
        }

        this.loading = true;
        this.error = '';
        this.success = '';

        this.authService.resetPassword(this.data).subscribe({
            next: () => {
                this.loading = false;
                this.success = 'Senha redefinida com sucesso! Redirecionando para o login...';
                setTimeout(() => {
                    this.router.navigate(['/auth/login']);
                }, 3000);
            },
            error: (err) => {
                console.error('Reset password error:', err);
                this.loading = false;
                if (err.error?.errors) {
                    // Tentar extrair erro de validação
                    const firstError = Object.values(err.error.errors)[0] as string[];
                    this.error = firstError ? firstError[0] : 'Erro na validação dos dados.';
                } else {
                    this.error = err.error?.message || 'Token inválido ou expirado. Solicite novamente.';
                }
            }
        });
    }
}
