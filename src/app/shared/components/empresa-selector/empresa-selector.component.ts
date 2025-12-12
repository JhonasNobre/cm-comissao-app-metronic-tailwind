import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EmpresaSelectorService, EmpresaInfo } from '../../../core/services/empresa-selector.service';

@Component({
    selector: 'app-empresa-selector',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div *ngIf="currentEmpresa" class="d-flex align-items-center gap-2" [class.invisible]="!hasMultipleEmpresas">
            <!-- Nome da Empresa Atual -->
            <div class="d-flex flex-column align-items-end d-none d-lg-flex">
                <span class="text-dark fw-bolder fs-7">{{ currentEmpresa.nome }}</span>
                <span class="text-muted fs-8">Empresa Atual</span>
            </div>

            <!-- Botão Trocar (Só aparece se user tiver > 1 empresa) -->
            <button 
                *ngIf="hasMultipleEmpresas" 
                (click)="trocarEmpresa()" 
                class="btn btn-icon btn-custom btn-icon-muted btn-active-light btn-active-color-primary w-30px h-30px w-md-35px h-md-35px"
                title="Trocar Empresa">
                <i class="pi pi-sync fs-4"></i>
            </button>
        </div>
    `,
    styles: [`
        .btn-custom {
            transition: all 0.3s ease;
        }
    `]
})
export class EmpresaSelectorComponent implements OnInit {
    private empresaSelectorService = inject(EmpresaSelectorService);
    private router = inject(Router);

    currentEmpresa: EmpresaInfo | null = null;
    hasMultipleEmpresas = false;

    ngOnInit(): void {
        this.empresaSelectorService.currentEmpresa$.subscribe(empresa => {
            this.currentEmpresa = empresa;
        });

        this.empresaSelectorService.userEmpresas$.subscribe(list => {
            this.hasMultipleEmpresas = list.length > 1;
        });
    }

    trocarEmpresa(): void {
        this.router.navigate(['/auth/selecionar-empresa']);
    }
}
