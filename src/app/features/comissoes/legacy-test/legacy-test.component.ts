import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LegacyService, LegacyVendaDto, LegacyAnexoDto } from '../../../core/services/legacy.service';

@Component({
  selector: 'app-legacy-test',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <i class="pi pi-database text-primary text-2xl"></i>
            Integração Legado
          </h1>
          <p class="text-sm text-gray-500">Validação técnica das APIs de conexão com o banco legado SQL Server</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <!-- Configurações -->
        <div class="card p-5 bg-white shadow-sm border border-gray-100 lg:col-span-1">
          <label class="block text-sm font-semibold text-gray-700 mb-2">Empresa no Legado (INT)</label>
          <div class="relative">
            <i class="pi pi-id-card absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input type="number" 
                   class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" 
                   [(ngModel)]="codigoEmpresaLegado">
          </div>
          <p class="mt-2 text-xs text-gray-400">Este ID é usado como filtro em todas as buscas abaixo.</p>
        </div>

        <!-- Busca de Venda -->
        <div class="card p-5 bg-white shadow-sm border border-gray-100 lg:col-span-4">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            
            <!-- Código da Venda (Menor) -->
            <div class="md:col-span-2 w-full">
              <label class="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Código Venda</label>
              <div class="relative">
                <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input type="text" 
                       class="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-lg font-bold text-center" 
                       placeholder="145055"
                       [(ngModel)]="codigoVendaInput">
              </div>
            </div>

            <!-- CPF/CNPJ (O MAIOR) -->
            <div class="md:col-span-7 w-full">
              <label class="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">CPF / CNPJ do Comprador (Anexos)</label>
              <div class="relative">
                <i class="pi pi-user absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input type="text" 
                       class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-lg font-bold" 
                       placeholder="Digite apenas os números do CPF ou CNPJ"
                       [(ngModel)]="cpfInput">
              </div>
            </div>

            <!-- Botão de Sincronizar -->
            <div class="md:col-span-3 w-full">
              <button class="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2"
                      (click)="buscarTudo()">
                <i class="pi pi-sync text-xl" [class.animate-spin]="loading"></i>
                Sincronizar
              </button>
            </div>

          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Resultados da Venda -->
        <div class="space-y-6">
          <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span class="w-2 h-6 bg-primary rounded-full"></span>
            Detalhes da Venda
          </h2>

          <div *ngIf="venda" class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div class="p-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
              <div>
                <span class="text-xs font-bold text-primary uppercase tracking-wider">Venda #{{ venda.codigoVenda }}</span>
                <h3 class="text-xl font-bold text-gray-900">{{ venda.nomeProduto }}</h3>
              </div>
              <div class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                {{ venda.statusConferencia || 'Sem Status' }}
              </div>
            </div>
            <div class="p-6 grid grid-cols-2 gap-6">
              <div class="space-y-1">
                <span class="text-xs text-gray-400 font-medium uppercase">Localização</span>
                <p class="text-sm font-semibold text-gray-700">Qd. {{ venda.quadra }} / Lt. {{ venda.lote }}</p>
              </div>
              <div class="space-y-1">
                <span class="text-xs text-gray-400 font-medium uppercase">Comprador</span>
                <p class="text-sm font-semibold text-gray-700">{{ venda.nomeComprador || 'Não informado' }}</p>
                <p class="text-xs text-gray-400">{{ venda.cpfComprador }}</p>
              </div>
              <div class="space-y-1">
                <span class="text-xs text-gray-400 font-medium uppercase">Cidade/UF</span>
                <p class="text-sm font-semibold text-gray-700">{{ venda.cidadeProduto }} / {{ venda.ufProduto }}</p>
              </div>
              <div class="space-y-1">
                <span class="text-xs text-gray-400 font-medium uppercase">Valor Desconto</span>
                <p class="text-sm font-semibold text-gray-700">{{ venda.desconto | currency:'BRL' }}</p>
              </div>
              <div class="space-y-1">
                <span class="text-xs text-gray-400 font-medium uppercase">Unidade</span>
                <p class="text-sm font-semibold text-gray-700">Ref: {{ venda.codigoUnidade }} ({{ venda.areaUnidade }}m²)</p>
              </div>
              <div class="space-y-1">
                <span class="text-xs text-gray-400 font-medium uppercase">Data Venda</span>
                <p class="text-sm font-semibold text-gray-700">{{ venda.quandoVendeu | date:'dd/MM/yyyy HH:mm' }}</p>
              </div>
            </div>
            <div class="p-4 bg-gray-50 border-t border-gray-100">
               <details class="text-xs text-gray-500 cursor-pointer">
                 <summary class="hover:text-primary transition-colors">Ver JSON bruto</summary>
                 <pre class="mt-2 p-3 bg-gray-900 text-green-400 rounded-lg overflow-x-auto">{{ venda | json }}</pre>
               </details>
            </div>
          </div>

          <div *ngIf="!venda && !erroVenda && !loading" class="bg-white p-12 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
            <i class="pi pi-info-circle text-4xl mb-3"></i>
            <p>Aguardando busca de venda...</p>
          </div>

          <div *ngIf="erroVenda" class="p-4 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm flex items-start gap-3">
            <i class="pi pi-exclamation-triangle mt-1"></i>
            <div>
              <p class="font-bold">Erro ao buscar venda</p>
              <p class="opacity-80">{{ erroVenda }}</p>
            </div>
          </div>
        </div>

        <!-- Resultados dos Anexos -->
        <div class="space-y-6">
          <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span class="w-2 h-6 bg-primary rounded-full"></span>
            Arquivos Anexados ({{ anexos?.length || 0 }})
          </h2>

          <div *ngIf="anexos && anexos.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div *ngFor="let anexo of anexos" class="group bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-primary/50 hover:shadow-md transition-all">
              <div class="flex items-start justify-between mb-3">
                <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <i class="pi" [ngClass]="getIconForAnexo(anexo.tipoAnexo)"></i>
                </div>
                <span class="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">ID: {{ anexo.codigo }}</span>
              </div>
              <h4 class="text-sm font-bold text-gray-800 mb-1 line-clamp-1 border-b border-gray-50 pb-2 mb-3">{{ anexo.tipoAnexo || 'Documento Geral' }}</h4>
              <div class="flex items-center justify-between">
                <span class="text-[10px] text-gray-400">v1.0 - PDF/IMG</span>
                <a [href]="anexo.url" target="_blank" class="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1 group/btn">
                  Visualizar
                  <i class="pi pi-external-link text-[10px] group-hover/btn:translate-x-0.5 transition-transform"></i>
                </a>
              </div>
            </div>
          </div>

          <div *ngIf="(!anexos || anexos.length === 0) && !erroAnexos && !loading" class="bg-white p-12 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
            <i class="pi pi-folder-open text-4xl mb-3"></i>
            <p>Aguardando busca de anexos...</p>
          </div>

          <div *ngIf="erroAnexos" class="p-4 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm flex items-start gap-3">
            <i class="pi pi-exclamation-triangle mt-1"></i>
            <div>
              <p class="font-bold">Erro ao buscar anexos</p>
              <p class="opacity-80">{{ erroAnexos }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LegacyTestComponent {
  codigoEmpresaLegado: number = 62;
  loading: boolean = false;

  // Venda
  codigoVendaInput: number | null = null;
  venda: LegacyVendaDto | null = null;
  erroVenda: string | null = null;

  // Anexos
  cpfInput: string = '';
  anexos: LegacyAnexoDto[] | null = null;
  erroAnexos: string | null = null;

  constructor(private legacyService: LegacyService) { }

  buscarTudo() {
    this.buscarVenda();
    this.buscarAnexos();
  }

  getIconForAnexo(tipo?: string): string {
    if (!tipo) return 'pi-file';
    const t = tipo.toLowerCase();
    if (t.includes('rg') || t.includes('cpf') || t.includes('identidade')) return 'pi-id-card';
    if (t.includes('endereço') || t.includes('comprovante')) return 'pi-home';
    if (t.includes('contrato')) return 'pi-file-pdf';
    if (t.includes('pj') || t.includes('social')) return 'pi-briefcase';
    return 'pi-file';
  }

  buscarVenda() {
    if (!this.codigoVendaInput) return;

    this.loading = true;
    this.erroVenda = null;
    this.venda = null;

    this.legacyService.getVenda(this.codigoVendaInput, this.codigoEmpresaLegado).subscribe({
      next: (data) => {
        this.venda = data;
        this.loading = false;
      },
      error: (err) => {
        this.erroVenda = (err.error?.message || err.message);
        this.loading = false;
      }
    });
  }

  buscarAnexos() {
    if (!this.cpfInput) return;

    this.loading = true;
    this.erroAnexos = null;
    this.anexos = null;

    this.legacyService.getAnexosPessoa(this.cpfInput, this.codigoEmpresaLegado).subscribe({
      next: (data) => {
        this.anexos = data;
        this.loading = false;
      },
      error: (err) => {
        this.erroAnexos = (err.error?.message || err.message);
        this.loading = false;
      }
    });
  }
}
