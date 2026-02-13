import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ImobtechRemessaService } from '../../services/imobtech-remessa.service';
import { EmpresaSelectorService } from '../../../../core/services/empresa-selector.service';

interface BeneficiarioForm {
  nome: string;
  cpfCnpj: string;
  percentual: number;
  valor: number;
  chavePix: string;
  tipoChavePix: string;
}

interface ParcelaForm {
  numero: number;
  valor: number;
  dataVencimento: string;
  dataLimitePagamento?: string;
  beneficiarios: BeneficiarioForm[];
}

@Component({
  selector: 'app-criar-remessa-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputTextModule,
    TooltipModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <p-dialog 
      header="Criar Remessa Manual - Imobtech" 
      [(visible)]="visible" 
      [modal]="true" 
      [style]="{width: '900px', maxHeight: '90vh'}"
      [draggable]="false" 
      [resizable]="false"
      (onHide)="onClose()">
      
      <ng-template pTemplate="content">
        <div class="overflow-y-auto max-h-[70vh] px-2">
          
          <!-- Warning de Empresa -->
          <div *ngIf="!empresaId" class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <i class="pi pi-exclamation-triangle text-yellow-600"></i>
              </div>
              <div class="ml-3">
                <p class="text-sm text-yellow-700">
                  Nenhuma empresa selecionada no contexto. Selecione uma empresa no menu superior.
                </p>
              </div>
            </div>
          </div>

          <!-- VENDA -->
          <div class="mb-8 border-b pb-6">
            <h3 class="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <i class="pi pi-shopping-bag text-blue-600"></i> 
                Dados da Venda
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label class="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Código Venda</label>
                <input type="text" pInputText [(ngModel)]="venda.codigo" class="w-full p-inputtext-sm" placeholder="Ex: 98798" 
                       pTooltip="ID da venda no sistema de origem (Sienge/Uau)" tooltipPosition="top"/>
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Unidade</label>
                <input type="text" pInputText [(ngModel)]="venda.unidade" class="w-full p-inputtext-sm" placeholder="Ex: BL-01 AP-101" />
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Data Venda</label>
                <input type="date" pInputText [(ngModel)]="venda.dataVenda" class="w-full p-inputtext-sm" />
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">CEP (Origem)</label>
                <input type="text" pInputText [(ngModel)]="venda.cep" class="w-full p-inputtext-sm" placeholder="00000-000" />
              </div>
            </div>
          </div>

          <!-- CLIENTE -->
          <div class="mb-8 border-b pb-6">
            <h3 class="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <i class="pi pi-user text-blue-600"></i>
                Dados do Cliente (Pagador)
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">CPF/CNPJ</label>
                <input type="text" pInputText [(ngModel)]="cliente.cpfCnpj" class="w-full p-inputtext-sm" placeholder="Apenas números" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Nome Completo</label>
                <input type="text" pInputText [(ngModel)]="cliente.nome" class="w-full p-inputtext-sm" />
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Email</label>
                <input type="email" pInputText [(ngModel)]="cliente.email" class="w-full p-inputtext-sm" />
              </div>
              <div class="md:col-span-2 grid grid-cols-3 gap-2">
                 <div class="col-span-2">
                    <label class="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Logradouro</label>
                    <input type="text" pInputText [(ngModel)]="cliente.logradouro" class="w-full p-inputtext-sm" />
                 </div>
                 <div>
                    <label class="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Número</label>
                    <input type="text" pInputText [(ngModel)]="cliente.numero" class="w-full p-inputtext-sm" />
                 </div>
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Bairro</label>
                <input type="text" pInputText [(ngModel)]="cliente.bairro" class="w-full p-inputtext-sm" />
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Cidade</label>
                <input type="text" pInputText [(ngModel)]="cliente.cidade" class="w-full p-inputtext-sm" />
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">UF</label>
                <input type="text" pInputText [(ngModel)]="cliente.estado" class="w-full p-inputtext-sm" maxlength="2" />
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">CEP</label>
                <input type="text" pInputText [(ngModel)]="cliente.cep" class="w-full p-inputtext-sm" placeholder="00000-000" />
              </div>
            </div>
          </div>

          <!-- PARCELAS -->
          <div class="mb-4">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <i class="pi pi-dollar text-green-600"></i> Parcelas
              </h3>
              <button pButton label="Adicionar Parcela" icon="pi pi-plus" class="p-button-sm p-button-success shadow-sm" 
                (click)="adicionarParcela()" pTooltip="Adiciona uma nova parcela à remessa" tooltipPosition="left"></button>
            </div>
            
            <div *ngFor="let parcela of parcelas; let i = index" class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4 bg-gray-50 dark:bg-gray-800/50 shadow-sm relative">
                <!-- Botão Remover Parcela -->
                <button pButton icon="pi pi-trash" class="p-button-rounded p-button-danger p-button-text absolute top-2 right-2" 
                    (click)="removerParcela(i)" pTooltip="Remover esta parcela" tooltipPosition="left"></button>

              <h4 class="font-bold text-gray-800 dark:text-gray-100 mb-3 border-b dark:border-gray-700 pb-2">Parcela #{{i + 1}}</h4>
              
              <div class="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Valor Parcela (R$)</label>
                  <input type="number" pInputText [(ngModel)]="parcela.valor" class="w-full p-inputtext-sm" />
                </div>
                <div>
                  <label class="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Vencimento</label>
                  <input type="date" pInputText [(ngModel)]="parcela.dataVencimento" class="w-full p-inputtext-sm" />
                </div>
                <div>
                  <label class="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Limite Pagamento</label>
                  <input type="date" pInputText [(ngModel)]="parcela.dataLimitePagamento" class="w-full p-inputtext-sm" />
                </div>
              </div>

              <!-- BENEFICIÁRIOS -->
              <div class="bg-white dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700">
                <div class="flex justify-between items-center mb-2">
                  <label class="text-sm font-bold text-gray-700 dark:text-gray-300">Beneficiários (Splits)</label>
                  <button pButton label="Add Beneficiário" icon="pi pi-user-plus" class="p-button-xs p-button-outlined p-button-secondary" 
                    (click)="adicionarBeneficiario(i)" pTooltip="Adicionar recebedor para esta parcela"></button>
                </div>
                
                <div *ngIf="parcela.beneficiarios.length === 0" class="text-xs text-gray-400 italic text-center py-2">
                    Nenhum beneficiário adicionado.
                </div>

                <div *ngFor="let ben of parcela.beneficiarios; let j = index" 
                  class="flex gap-2 mb-2 items-center">
                  <input type="text" pInputText [(ngModel)]="ben.nome" placeholder="Nome" class="p-inputtext-sm flex-grow" />
                  <input type="text" pInputText [(ngModel)]="ben.cpfCnpj" placeholder="CPF/CNPJ" class="p-inputtext-sm w-32" />
                  <input type="number" pInputText [(ngModel)]="ben.valor" placeholder="R$" class="p-inputtext-sm w-24" />
                  <input type="text" pInputText [(ngModel)]="ben.chavePix" placeholder="Chave Pix" class="p-inputtext-sm w-40" />
                  
                  <button pButton icon="pi pi-trash" class="p-button-rounded p-button-danger p-button-text p-button-sm" 
                    (click)="removerBeneficiario(i, j)" pTooltip="Remover beneficiário"></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-template>

      <ng-template pTemplate="footer">
        <button pButton label="Cancelar" icon="pi pi-times" class="p-button-text" (click)="onClose()"></button>
        <button pButton label="Criar Remessa" icon="pi pi-check" class="p-button-success" 
          [loading]="loading" [disabled]="!empresaId"
          (click)="confirmar()" pTooltip="Envia a remessa para processamento"></button>
      </ng-template>
    </p-dialog>
  `
})
export class CriarRemessaFormComponent implements OnInit {
  private remessaService = inject(ImobtechRemessaService);
  private empresaService = inject(EmpresaSelectorService);
  private messageService = inject(MessageService);

  visible = false;
  loading = false;
  empresaId: string = '';

  venda = {
    codigo: '98798',
    unidade: 'teste api',
    dataVenda: '2025-12-21',
    cep: '74453630'
  };

  cliente = {
    cpfCnpj: '01140852183',
    nome: 'teste',
    email: 'jhonasboni@gmail.com',
    logradouro: 'Rua São Clemente',
    numero: '0',
    complemento: '',
    bairro: 'Vila Regina',
    cidade: 'Goiânia',
    estado: 'GO',
    cep: '74453630'
  };

  parcelas: ParcelaForm[] = [{
    numero: 1,
    valor: 10,
    dataVencimento: '2025-12-31',
    dataLimitePagamento: '2026-01-31',
    beneficiarios: [{
      nome: 'Eliezer Rodrigues Moreira',
      cpfCnpj: '01140852183',
      percentual: 100,
      valor: 10,
      chavePix: '01140852183',
      tipoChavePix: 'CPF'
    }]
  }];

  ngOnInit() {
    this.empresaService.selectedEmpresaIds$.subscribe(ids => {
      this.empresaId = ids.length > 0 ? ids[0] : '';
    });
  }

  abrir() {
    this.resetForm();
    this.visible = true;
  }

  onClose() {
    this.visible = false;
    // Não resetar imediatamente para facilitar testes repetidos, ou resetar se preferir
    // this.resetForm(); 
  }

  adicionarParcela() {
    this.parcelas.push({
      numero: this.parcelas.length + 1,
      valor: 0,
      dataVencimento: '',
      dataLimitePagamento: '',
      beneficiarios: []
    });
  }

  removerParcela(index: number) {
    this.parcelas.splice(index, 1);
  }

  adicionarBeneficiario(parcelaIndex: number) {
    this.parcelas[parcelaIndex].beneficiarios.push({
      nome: '',
      cpfCnpj: '',
      percentual: 0,
      valor: 0,
      chavePix: '',
      tipoChavePix: 'CPF'
    });
  }

  removerBeneficiario(parcelaIndex: number, beneficiarioIndex: number) {
    this.parcelas[parcelaIndex].beneficiarios.splice(beneficiarioIndex, 1);
  }

  confirmar() {
    if (!this.validarFormulario()) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (!this.empresaId) {
      alert('Selecione uma empresa no topo da página.');
      return;
    }

    // Montar request no formato estrito do DTO do Backend (ComissaoCalculadaDto)
    const request: any = {
      empresaId: this.empresaId,
      comissao: {
        idVendaInterna: parseInt(this.venda.codigo),
        dataVenda: this.venda.dataVenda,
        nomeUnidade: this.venda.unidade,
        cliente: {
          nome: this.cliente.nome,
          documento: this.cliente.cpfCnpj,
          email: this.cliente.email,
          endereco: `${this.cliente.logradouro}, ${this.cliente.numero} ${this.cliente.complemento || ''} - ${this.cliente.bairro}`,
          cep: this.cliente.cep,
          cidade: this.cliente.cidade,
          uf: this.cliente.estado
        },
        parcelas: this.parcelas.map((p, pIdx) => ({
          idParcela: pIdx + 1,
          valorTotal: p.valor,
          beneficiarios: p.beneficiarios.map((b, bIdx) => ({
            idRateio: (pIdx * 10) + bIdx + 1,
            nomeBeneficiario: b.nome,
            documentoBeneficiario: b.cpfCnpj,
            valor: b.valor,
            dataPrevisaoPagamento: p.dataVencimento
          }))
        }))
      }
    };

    this.loading = true;
    this.remessaService.criarRemessaManual(request).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: `Remessa criada com sucesso! ID: ${response.remessaId}`,
          life: 5000
        });
        this.onClose();
        this.loading = false;
        // window.location.reload(); // Removido para manter SPA experience
      },
      error: (err) => {
        console.error('Erro ao criar remessa:', err);

        let errorMessage = 'Ocorreu um erro ao criar a remessa.';

        if (err.error) {
          if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.error.errors && Array.isArray(err.error.errors)) {
            // Formato FluentResults/MainController: { errors: [ { message: "..." } ] }
            errorMessage = err.error.errors.map((e: any) => e.message).join(' | ');
          } else if (err.error.message) {
            errorMessage = err.error.message;
          }
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Erro na Criação',
          detail: errorMessage,
          life: 5000
        });

        this.loading = false;
      }
    });
  }

  private validarFormulario(): boolean {
    if (!this.venda.codigo || !this.venda.unidade || !this.venda.dataVenda) return false;
    if (!this.cliente.cpfCnpj || !this.cliente.nome || !this.cliente.email) return false;
    if (this.parcelas.length === 0) return false;

    for (const parcela of this.parcelas) {
      if (!parcela.valor || !parcela.dataVencimento) return false;
      if (parcela.beneficiarios.length === 0) return false;

      for (const ben of parcela.beneficiarios) {
        if (!ben.nome || !ben.cpfCnpj || !ben.valor || !ben.chavePix) return false;
      }
    }

    return true;
  }

  private detectarTipoChavePix(chave: string): string {
    if (/^\d{11}$/.test(chave)) return 'CPF';
    if (/^\d{14}$/.test(chave)) return 'CNPJ';
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(chave)) return 'Email';
    if (/^\+?\d{10,}$/.test(chave)) return 'Telefone';
    return 'ChaveAleatoria';
  }

  private resetForm() {
    const hoje = new Date();
    const vencimento = new Date();
    vencimento.setDate(hoje.getDate() + 5);
    const limite = new Date();
    limite.setDate(vencimento.getDate() + 30);

    const dataHoje = hoje.toISOString().split('T')[0];
    const dataVencimento = vencimento.toISOString().split('T')[0];
    const dataLimite = limite.toISOString().split('T')[0];

    this.venda = {
      codigo: '98798',
      unidade: 'teste api',
      dataVenda: dataHoje,
      cep: '74453630'
    };
    this.cliente = {
      cpfCnpj: '01140852183',
      nome: 'teste',
      email: 'jhonasboni@gmail.com',
      logradouro: 'Rua São Clemente',
      numero: '0',
      complemento: '',
      bairro: 'Vila Regina',
      cidade: 'Goiânia',
      estado: 'GO',
      cep: '74453630'
    };
    this.parcelas = [{
      numero: 1,
      valor: 10,
      dataVencimento: dataVencimento,
      dataLimitePagamento: dataLimite,
      beneficiarios: [{
        nome: 'Eliezer Rodrigues Moreira',
        cpfCnpj: '01140852183',
        percentual: 100,
        valor: 10,
        chavePix: '01140852183',
        tipoChavePix: 'CPF'
      }]
    }];
  }
}
