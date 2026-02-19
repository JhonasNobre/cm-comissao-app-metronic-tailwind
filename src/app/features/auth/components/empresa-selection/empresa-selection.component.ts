import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EmpresaSelectorService, EmpresaInfo } from '../../../../core/services/empresa-selector.service';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-empresa-selection',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './empresa-selection.component.html',
    host: { class: 'contents' }
})
export class EmpresaSelectionComponent implements OnInit {
    private empresaSelectorService = inject(EmpresaSelectorService);
    private authService = inject(AuthService);
    private router = inject(Router);

    empresas: EmpresaInfo[] = [];
    loading = true;
    selectedEmpresaId: string | null = null;
    userName = '';

    step: 'select-company' | 'select-platform' = 'select-company';

    ngOnInit(): void {
        this.loadUserData();
        this.loadEmpresas();
    }

    private loadUserData(): void {
        const claims = this.authService.getUserInfo();
        if (claims) {
            this.userName = claims.name || claims.preferred_username || 'Usuário';
        }
    }

    private loadEmpresas(): void {
        // Tentar obter do seletor (já carregado pelo AuthService)
        this.empresaSelectorService.userEmpresas$.subscribe(empresas => {
            if (empresas.length > 0) {
                this.empresas = empresas;
                this.loading = false;
            } else {
                console.warn('[EmpresaSelection] Lista vazia no serviço. Tentando API...');
                // Se não tiver, forçar carregamento via API
                this.fetchEmpresasFromApi();
            }
        });
    }

    private fetchEmpresasFromApi(): void {
        // Fallback: buscar direto da API
        fetch(`${environment.apiUrl}/v1/usuarios/me/empresas`, {
            headers: {
                'Authorization': `Bearer ${this.authService.getAccessToken()}`,
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then((data: any[]) => {
                this.empresas = data.map(e => ({
                    id: e.id,
                    nome: e.nome,
                    codigoLegado: e.codigoLegado,
                    dominioLegado: e.dominioLegado,
                    ambienteLegado: e.ambienteLegado
                }));
                this.loading = false;
            })
            .catch(err => {
                console.error('Erro ao buscar empresas:', err);
                this.loading = false;
            });
    }

    selectEmpresa(empresa: EmpresaInfo): void {
        this.selectedEmpresaId = empresa.id;
    }

    selectedPlatform: 'sales' | 'commission' | null = null;

    // Avança para a seleção de plataforma
    proceedToPlatformSelection(): void {
        if (!this.selectedEmpresaId) return;
        this.step = 'select-platform';
        this.selectedPlatform = null; // Resetar seleção anterior
    }

    // Volta para a seleção de empresa
    backToCompanySelection(): void {
        this.step = 'select-company';
        this.selectedEmpresaId = null;
        this.selectedPlatform = null;
    }

    selectPlatform(platform: 'sales' | 'commission'): void {
        this.selectedPlatform = platform;
    }

    confirmPlatformSelection(): void {
        if (!this.selectedEmpresaId || !this.selectedPlatform) return;

        const selectedEmpresa = this.empresas.find(e => e.id === this.selectedEmpresaId);

        if (this.selectedPlatform === 'sales') {
            // Plataforma de Vendas (Legado)
            if (selectedEmpresa && selectedEmpresa.dominioLegado) {
                // Construir URL do legado: https://dominio.ambiente
                const dominio = selectedEmpresa.dominioLegado;
                const ambiente = selectedEmpresa.ambienteLegado || 'clickmenos.com.br'; // Fallback seguro

                let url = `${dominio}.${ambiente}`;

                if (!url.startsWith('http')) {
                    url = `https://${url}`;
                }

                // Redireciona externamente
                window.location.href = url;
            } else {
                console.error('[PlatformSelection] Configuração de domínio legado ausente:', selectedEmpresa);
                alert('Esta empresa não possui configuração para a Plataforma de Vendas (Domínio Legado não encontrado).');
            }
        } else {
            // Plataforma de Comissionamento (Novo)
            if (selectedEmpresa) {
                this.empresaSelectorService.setSelectedEmpresas([this.selectedEmpresaId]);
                this.router.navigate(['/']);
            }
        }
    }

    logout(): void {
        this.authService.logout();
    }

    getLogoUrl(empresaId: string): string {
        return `${environment.apiUrl}/v1/empresas/${empresaId}/logo`;
    }
}
