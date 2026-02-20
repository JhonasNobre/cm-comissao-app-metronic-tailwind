import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LegacySyncService, SyncResult } from '../../core/services/legacy-sync.service';
import { EmpresaSelectorService } from '../../core/services/empresa-selector.service';

@Component({
  selector: 'app-legacy-sync',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <i class="pi pi-sync text-primary text-2xl"></i>
            Sincronização Legado
          </h1>
          <p class="text-sm text-gray-500">Sincronização manual de dados do sistema legado para o ClickMenos Comissão</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 mb-8">
        <!-- Ações de Sincronização -->
        <div class="card p-5 bg-white shadow-sm border border-gray-100">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div class="flex flex-col">
              <label class="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Data Inicial</label>
              <input type="date" [(ngModel)]="dataInicio" class="form-input rounded-lg border-gray-200 focus:border-primary transition-all">
            </div>
            <div class="flex flex-col">
              <label class="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Data Final</label>
              <input type="date" [(ngModel)]="dataFim" class="form-input rounded-lg border-gray-200 focus:border-primary transition-all">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <button class="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
                    (click)="sincronizarProdutos()" [disabled]="loading">
              <i class="pi pi-box text-3xl mb-3 text-gray-400 group-hover:text-primary" [class.animate-spin]="loadingProducts"></i>
              <span class="font-bold text-gray-700 group-hover:text-primary">Produtos</span>
              <span class="text-xs text-gray-400 mt-1">Importa do legado</span>
            </button>

            <button class="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
                    (click)="sincronizarVendas()" [disabled]="loading">
              <i class="pi pi-shopping-cart text-3xl mb-3 text-gray-400 group-hover:text-primary" [class.animate-spin]="loadingSales"></i>
              <span class="font-bold text-gray-700 group-hover:text-primary">Vendas</span>
              <span class="text-xs text-gray-400 mt-1">Sincroniza no período</span>
            </button>

            <button class="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
                    (click)="sincronizarUsuarios()" [disabled]="loading">
              <i class="pi pi-users text-3xl mb-3 text-gray-400 group-hover:text-primary" [class.animate-spin]="loadingUsers"></i>
              <span class="font-bold text-gray-700 group-hover:text-primary">Usuários</span>
              <span class="text-xs text-gray-400 mt-1">Sincroniza CPF/CRECI/Login</span>
            </button>

          </div>
        </div>
      </div>

      <!-- Logs/Resultados -->
      <div class="space-y-4">
        <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span class="w-2 h-6 bg-primary rounded-full"></span>
          Resumo da Sincronização
        </h2>

        <div *ngIf="lastResult" class="p-4 rounded-lg flex items-start gap-4 transition-all"
             [ngClass]="lastResult.quantidade > 0 ? 'bg-green-50 border border-green-100 text-green-700' : 'bg-blue-50 border border-blue-100 text-blue-700'">
          <i class="pi pi-check-circle text-xl mt-1"></i>
          <div>
            <p class="font-bold">{{ lastResult.message }}</p>
            <p class="text-sm opacity-90">Total de registros processados: {{ lastResult.quantidade }}</p>
          </div>
        </div>

        <div *ngIf="error" class="p-4 bg-red-50 border border-red-100 text-red-700 rounded-lg flex items-start gap-4">
          <i class="pi pi-exclamation-triangle text-xl mt-1"></i>
          <div>
            <p class="font-bold">Falha na sincronização</p>
            <p class="text-sm opacity-90">{{ error }}</p>
          </div>
        </div>

        <div *ngIf="!lastResult && !error && !loading" class="bg-white p-12 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
          <i class="pi pi-info-circle text-4xl mb-3"></i>
          <p>Nenhuma sincronização realizada nesta sessão.</p>
        </div>

        <div *ngIf="loading" class="bg-white p-12 rounded-xl border border-gray-100 flex flex-col items-center justify-center">
            <i class="pi pi-spin pi-spinner text-4xl text-primary mb-3"></i>
            <p class="text-primary font-medium">Sincronizando dados, aguarde...</p>
        </div>
      </div>
    </div>
  `
})
export class LegacySyncComponent {
  loadingProducts: boolean = false;
  loadingSales: boolean = false;
  loadingUsers: boolean = false;
  lastResult: SyncResult | null = null;
  error: string | null = null;

  dataInicio: string = '2025-01-01';
  dataFim: string = new Date().toISOString().substring(0, 10);

  constructor(private syncService: LegacySyncService) { }

  get loading(): boolean {
    return this.loadingProducts || this.loadingSales || this.loadingUsers;
  }

  sincronizarProdutos() {
    this.resetState();
    this.loadingProducts = true;
    this.syncService.sincronizarProdutos().subscribe({
      next: (res: SyncResult) => {
        this.lastResult = res;
        this.loadingProducts = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || err.message;
        this.loadingProducts = false;
      }
    });
  }

  sincronizarVendas() {
    this.resetState();
    this.loadingSales = true;
    this.syncService.sincronizarVendas(this.dataInicio, this.dataFim).subscribe({
      next: (res: SyncResult) => {
        this.lastResult = res;
        this.loadingSales = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || err.message;
        this.loadingSales = false;
      }
    });
  }

  sincronizarUsuarios() {
    this.resetState();
    this.loadingUsers = true;
    this.syncService.sincronizarUsuarios().subscribe({
      next: (res: SyncResult) => {
        this.lastResult = res;
        this.loadingUsers = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || err.message;
        this.loadingUsers = false;
      }
    });
  }

  private resetState() {
    this.lastResult = null;
    this.error = null;
  }
}
