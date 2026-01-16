import { Component } from '@angular/core';
// Trigger rebuild
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { LoginRequest } from '../../../../core/models/auth.model';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './login.component.html',
    host: { class: 'contents' }
})
export class LoginComponent {
    credentials: LoginRequest = {
        username: '',
        password: ''
    };

    loading = false;
    error = '';

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    login() {
        if (!this.credentials.username || !this.credentials.password) {
            this.error = 'Preencha todos os campos';
            return;
        }

        this.loading = true;
        this.error = '';

        this.authService.login(this.credentials).subscribe({
            next: () => {
                this.router.navigate(['/']);
            },
            error: (err) => {
                console.error('Login error:', err);
                this.loading = false;

                if (err.status === 403 && err.error?.error === 'password_change_required') {
                    this.router.navigate(['/auth/change-password'], {
                        queryParams: { email: this.credentials.username }
                    });
                    return;
                }

                if (err.status === 401) {
                    this.error = 'Usuário ou senha inválidos';
                } else {
                    this.error = 'Erro ao realizar login. Tente novamente.';
                }
            }
        });
    }
}
