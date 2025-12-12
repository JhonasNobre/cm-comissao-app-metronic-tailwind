import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EmpresaInfo, EmpresaSelectorService } from '../../../../core/services/empresa-selector.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-selecao-empresa',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="d-flex flex-column flex-root min-h-screen bg-light">
      <div class="d-flex flex-center flex-column flex-column-fluid p-10 pb-lg-20">
        <!-- Logo -->
        <a href="#" class="mb-12">
          <img src="assets/media/logos/default-dark.svg" class="h-40px" alt="ClickMenos" />
        </a>

        <!-- Wrapper -->
        <div class="w-lg-900px bg-body rounded shadow-sm p-10 p-lg-15 mx-auto">
          
          <div class="text-center mb-10">
            <h1 class="text-dark mb-3">Bem-vindo(a) de volta!</h1>
            <div class="text-gray-400 fw-bold fs-4">Selecione a empresa para continuar</div>
          </div>

          <!-- Grade de Empresas -->
          @if (loading) {
            <div class="d-flex justify-content-center py-10">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
          } @else if (empresas.length === 0) {
            <div class="alert alert-warning d-flex align-items-center p-5 mb-10">
              <div class="d-flex flex-column">
                <h4 class="mb-1 text-dark">Nenhuma empresa vinculada</h4>
                <span>Você não possui acesso a nenhuma empresa. Contate o administrador.</span>
              </div>
            </div>
            <div class="text-center">
               <button class="btn btn-light-primary" (click)="logout()">Sair</button>
            </div>
          } @else {
            <div class="row g-6 justify-content-center">
              @for (empresa of empresas; track empresa.id) {
                <div class="col-md-4 col-sm-6">
                  <div class="card h-100 hover-elevate-up cursor-pointer border-hover-primary transition-all" 
                       [class.border-primary]="selectedId === empresa.id"
                       (click)="selecionar(empresa)">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center p-9">
                      
                      <!-- Logo Placeholder ou Real -->
                      <div class="symbol symbol-75px mb-5">
                          @if(empresa.logoUrl) {
                            <img [src]="empresa.logoUrl" alt="Logo" class="theme-light-show" />
                          } @else {
                            <div class="symbol-label fs-2 fw-bold text-primary bg-light-primary">
                                {{ empresa.nome.substring(0, 2).toUpperCase() }}
                            </div>
                          }
                      </div>

                      <div class="fs-4 fw-bolder text-dark mb-1">{{ empresa.nome }}</div>
                      
                      @if(empresa.cargo) {
                        <div class="text-gray-400 fw-bold fs-7">{{ empresa.cargo }}</div>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          }

          <div class="text-center mt-10" *ngIf="empresas.length > 0">
             <span class="text-gray-400 me-2">Não encontrou sua empresa?</span>
             <a (click)="logout()" class="text-muted text-hover-primary cursor-pointer fw-bold">Trocar de Usuário</a>
          </div>

        </div>
      </div>
    </div>
  `,
    styles: [`
    .hover-elevate-up:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.05);
    }
    .transition-all {
        transition: all 0.3s ease;
    }
    .cursor-pointer {
        cursor: pointer;
    }
  `]
})
export class SelecaoEmpresaComponent implements OnInit {

    empresas: EmpresaInfo[] = [];
    loading = true;
    selectedId: string | null = null;

    private empresaService = inject(EmpresaSelectorService);
    private authService = inject(AuthService);
    private router = inject(Router);

    ngOnInit(): void {
        this.carregarEmpresas();
    }

    carregarEmpresas() {
        this.empresaService.userEmpresas$.subscribe(list => {
            this.empresas = list || [];
            this.loading = false;

            // Se não houver empresas carregadas (refresh F5), talvez precise buscá-las do backend
            // TODO: Implementar busca no backend se a lista estiver vazia mas tiver token
        });
    }

    selecionar(empresa: EmpresaInfo) {
        this.selectedId = empresa.id;
        this.loading = true; // Mostra loading enquanto valida

        this.empresaService.selecionarEmpresa(empresa).subscribe({
            next: () => {
                // Sucesso: Redireciona para Dashboard
                this.router.navigate(['/']);
            },
            error: (err) => {
                console.error('Erro ao selecionar empresa', err);
                this.loading = false;
                alert('Erro ao validar acesso à empresa. Tente novamente.');
            }
        });
    }

    logout() {
        this.authService.logout();
    }
}
