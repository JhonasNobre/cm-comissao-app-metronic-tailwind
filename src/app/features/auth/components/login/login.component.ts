import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../core/services/auth.service';
import { EmpresaSelectorService } from '../../../../core/services/empresa-selector.service';
import { LoginRequest } from '../../../../core/models/auth.model';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './login.component.html',
    host: { class: 'contents' }
})
export class LoginComponent {
    private authService = inject(AuthService);
    private empresaSelectorService = inject(EmpresaSelectorService);
    private router = inject(Router);
    private http = inject(HttpClient);

    credentials: LoginRequest = {
        username: '',
        password: ''
    };

    loading = false;
    error = '';

    login() {
        if (!this.credentials.username || !this.credentials.password) {
            this.error = 'Preencha todos os campos';
            return;
        }

        this.loading = true;
        this.error = '';

        this.authService.login(this.credentials).subscribe({
            next: () => {
                // Após login, verificar quantidade de empresas
                this.checkEmpresasAndRedirect();
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

    private checkEmpresasAndRedirect(): void {
        // Garantir que não há empresa selecionada antes de verificar a lista completa via API.
        // Isso evita que o AuthInterceptor filtre o resultado da própria API de listagem.
        this.empresaSelectorService.setSelectedEmpresas([]);

        // Buscar empresas do usuário via API
        this.http.get<any[]>(`${environment.apiUrl}/v1/usuarios/me/empresas`).subscribe({
            next: (empresas) => {
                const count = empresas?.length || 0;

                if (count > 1) {
                    const empresasInfo = empresas.map(e => ({
                        id: e.id,
                        nome: e.nome,
                        codigoLegado: e.codigoLegado,
                        dominioLegado: e.dominioLegado,
                        ambienteLegado: e.ambienteLegado
                    }));
                    this.empresaSelectorService.setUserEmpresas(empresasInfo);
                    this.router.navigate(['/auth/select-empresa']);
                } else if (count === 1) {
                    const empresa = empresas[0];
                    const info = {
                        id: empresa.id,
                        nome: empresa.nome,
                        codigoLegado: empresa.codigoLegado,
                        dominioLegado: empresa.dominioLegado,
                        ambienteLegado: empresa.ambienteLegado
                    };
                    this.empresaSelectorService.setUserEmpresas([info]);
                    this.empresaSelectorService.setSelectedEmpresas([empresa.id]);
                    this.router.navigate(['/']);
                } else {
                    this.router.navigate(['/']);
                }
            },
            error: (err) => {
                // Fallback: Tentar usar o que veio no token se disponível, ou ir para a raiz
                this.router.navigate(['/']);
            }
        });
    }
}
