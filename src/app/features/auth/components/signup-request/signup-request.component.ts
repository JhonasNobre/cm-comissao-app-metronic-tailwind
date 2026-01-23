import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, SignupRequest } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-signup-request',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './signup-request.component.html',
    host: { class: 'contents' }
})
export class SignupRequestComponent {
    data: SignupRequest = {
        nome: '',
        sobrenome: '',
        email: '',
        telefone: '',
        titulo: '',
        mensagem: ''
    };

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

        if (!this.data.nome || !this.data.sobrenome || !this.data.email || !this.data.titulo || !this.data.mensagem) {
            this.error = 'Por favor, preencha todos os campos.';
            return;
        }

        // Validação de email simples
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.data.email)) {
            this.error = 'Por favor, insira um email válido.';
            return;
        }

        this.loading = true;

        this.authService.requestSignup(this.data).subscribe({
            next: () => {
                this.loading = false;
                this.success = 'Sua solicitação foi enviada com sucesso! Em breve entraremos em contato.';

                // Limpar formulário
                this.data = {
                    nome: '',
                    sobrenome: '',
                    email: '',
                    telefone: '',
                    titulo: '',
                    mensagem: ''
                };

                // Redirecionar após 3 segundos
                setTimeout(() => {
                    this.router.navigate(['/auth/login']);
                }, 5000);
            },
            error: (err) => {
                console.error('Signup error:', err);
                this.loading = false;
                this.error = err.error?.title || 'Ocorreu um erro ao enviar sua solicitação. Tente novamente.';
            }
        });
    }
}
