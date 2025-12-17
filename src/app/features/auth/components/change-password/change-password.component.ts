import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-change-password',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './change-password.component.html',
    host: { class: 'contents' }
})
export class ChangePasswordComponent implements OnInit {
    email: string = '';
    oldPassword: string = '';
    newPassword: string = '';
    confirmPassword: string = '';

    loading: boolean = false;
    error: string = '';
    success: string = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.email = params['email'] || '';
        });
    }

    onSubmit(): void {
        this.error = '';
        this.success = '';

        if (!this.email || !this.oldPassword || !this.newPassword || !this.confirmPassword) {
            this.error = 'Todos os campos são obrigatórios.';
            return;
        }

        if (this.newPassword !== this.confirmPassword) {
            this.error = 'A confirmação de senha não confere.';
            return;
        }

        if (this.newPassword.length < 6) {
            this.error = 'A nova senha deve ter pelo menos 6 caracteres.';
            return;
        }

        this.loading = true;

        this.authService.changePasswordFirstAccess({
            email: this.email,
            oldPassword: this.oldPassword,
            newPassword: this.newPassword
        }).subscribe({
            next: (res) => {
                this.loading = false;
                this.success = 'Senha atualizada com sucesso! Redirecionando para o login...';
                setTimeout(() => {
                    this.router.navigate(['/auth/login']);
                }, 2000);
            },
            error: (err) => {
                this.loading = false;
                console.error('Password change error:', err);
                if (err.status === 401) {
                    this.error = 'Senha atual incorreta.';
                } else {
                    this.error = err.error?.message || 'Erro ao atualizar a senha. Tente novamente.';
                }
            }
        });
    }
}
