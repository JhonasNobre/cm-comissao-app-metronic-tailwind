import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './login.component.html',
    host: { class: 'contents' }
})
export class LoginComponent implements OnInit {
    loginForm!: FormGroup;
    loading = false;
    error = '';
    currentYear = new Date().getFullYear();

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit() {
        this.loginForm = this.fb.group({
            username: ['', [Validators.required, Validators.minLength(3)]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    // Getters para facilitar acesso aos controles
    get username() { return this.loginForm.get('username'); }
    get password() { return this.loginForm.get('password'); }

    login() {
        // Marcar todos os campos como touched para exibir erros
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        this.error = '';

        const credentials = {
            username: this.loginForm.value.username,
            password: this.loginForm.value.password
        };

        this.authService.login(credentials).subscribe({
            next: () => {
                this.router.navigate(['/']);
            },
            error: (err) => {
                console.error('Login error:', err);
                this.loading = false;
                if (err.status === 401) {
                    this.error = 'Usuário ou senha inválidos';
                } else {
                    this.error = 'Erro ao realizar login. Tente novamente.';
                }
            }
        });
    }

    forgotPassword() {
        // TODO: Implementar tela de recuperação de senha
        alert('Funcionalidade em desenvolvimento. Entre em contato com o administrador.');
    }
}
