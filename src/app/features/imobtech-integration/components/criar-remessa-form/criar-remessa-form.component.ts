import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ImobtechRemessaService } from '../../services/imobtech-remessa.service';

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
        InputTextModule
    ],
    template: `
    <p-dialog 
      header="Criar Remessa Manual - Imobtech" 
      [(visible)]="visible" 
      [modal]="true" 
      [style]="{width: '800px', maxHeight: '90vh'}"
      [draggable]="false" 
      [resizable]="false"
      (onHide)="onClose()">
      
      <ng-template pTemplate="content">
        <div class="overflow-y-auto max-h-[70vh] px-2">
          <!-- VENDA -->
          <div class="mb-6">
            <h3 class="text-lg font-semibold mb-3 text-gray-800">📋 Dados da Venda</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Código Venda</label>
                <input type="text" pInputText [(ngModel)]="venda.codigo" class="w-full" placeholder="98798" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Unidade</label>
                <input type="text" pInputText [(ngModel)]="venda.unidade" class="w-full" placeholder="teste api" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Data Venda</label>
                <input type="date" pInputText [(ngModel)]="venda.dataVenda" class="w-full" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">CEP</label>
                <input type="text" pInputText [(ngModel)]="venda.cep" class="w-full" placeholder="74453630" />
              </div>
            </div>
          </div>

          <!-- CLIENTE -->
          <div class="mb-6">
            <h3 class="text-lg font-semibold mb-3 text-gray-800">👤 Dados do Cliente</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">CPF/CNPJ</label>
                <input type="text" pInputText [(ngModel)]="cliente.cpfCnpj" class="w-full" placeholder="01140852183" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Nome</label>
                <input type="text" pInputText [(ngModel)]="cliente.nome" class="w-full" placeholder="teste" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Email</label>
                <input type="email" pInputText [(ngModel)]="cliente.email" class="w-full" placeholder="jhonasboni@gmail.com" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Logradouro</label>
                <input type="text" pInputText [(ngModel)]="cliente.logradouro" class="w-full" placeholder="Rua São Clemente" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Número</label>
                <input type="text" pInputText [(ngModel)]="cliente.numero" class="w-full" placeholder="0" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Bairro</label>
                <input type="text" pInputText [(ngModel)]="cliente.bairro" class="w-full" placeholder="Vila Regina" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Cidade</label>
                <input type="text" pInputText [(ngModel)]="cliente.cidade" class="w-full" placeholder="Goiânia" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Estado</label>
                <input type="text" pInputText [(ngModel)]="cliente.estado" class="w-full" placeholder="GO" maxlength="2" />
              </div>
            </div>
          </div>

          <!-- PARCELAS -->
          <div class="mb-4">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-lg font-semibold text-gray-800">💰 Parcelas</h3>
              <button pButton label="+ Parcela" class="p-button-sm p-button-success" (click)="adicionarParcela()"></button>
            </div>
            
            <div *ngFor="let parcela of parcelas; let i = index" class="border rounded p-4 mb-4 bg-gray-50">
              <div class="flex justify-between items-center mb-3">
                <h4 class="font-semibold">Parcela {{i + 1}}</h4>
                <button pButton icon="pi pi-trash" class="p-button-sm p-button-danger p-button-text" 
                  (click)="removerParcela(i)"></button>
              </div>
              
              <div class="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label class="block text-sm font-medium mb-1">Valor</label>
                  <input type="number" pInputText [(ngModel)]="parcela.valor" class="w-full" placeholder="10" />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Vencimento</label>
                  <input type="date" pInputText [(ngModel)]="parcela.dataVencimento" class="w-full" />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Limite Pgto</label>
                  <input type="date" pInputText [(ngModel)]="parcela.dataLimitePagamento" class="w-full" />
                </div>
              </div>

              <!-- BENEFICIÁRIOS -->
              <div class="mt-3">
                <div class="flex justify-between items-center mb-2">
                  <label class="text-sm font-semibold">Beneficiários</label>
                  <button pButton label="+ Beneficiário" class="p-button-xs p-button-outlined" 
                    (click)="adicionarBeneficiario(i)"></button>
                </div>
                
                <div *ngFor="let ben of parcela.beneficiarios; let j = index" 
                  class="grid grid-cols-4 gap-2 mb-2 p-2 border rounded bg-white">
                  <input type="text" pInputText [(ngModel)]="ben.nome" placeholder="Nome" class="text-sm" />
                  <input type="text" pInputText [(ngModel)]="ben.cpfCnpj" placeholder="CPF" class="text-sm" />
                  <input type="number" pInputText [(ngModel)]="ben.valor" placeholder="Valor" class="text-sm" />
                  <div class="flex gap-1">
                    <input type="text" pInputText [(ngModel)]="ben.chavePix" placeholder="Chave Pix" class="text-sm flex-1" />
                    <button pButton icon="pi pi-trash" class="p-button-xs p-button-danger p-button-text" 
                      (click)="removerBeneficiario(i, j)"></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-template>

      <ng-template pTemplate="footer">
        <button pButton label="Cancelar" icon="pi pi-times" class="p-button-text" (click)="onClose()"></button>
        <button pButton label="Criar Remessa" icon="pi pi-check" class="p-button-success" 
          [loading]="loading"
          (click)="confirmar()"></button>
      </ng-template>
    </p-dialog>
  `
})
export class CriarRemessaFormComponent {
    private remessaService = inject(ImobtechRemessaService);

    visible = false;
    loading = false;

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
        estado: 'GO'
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

    abrir() {
        this.visible = true;
    }

    onClose() {
        this.visible = false;
        this.resetForm();
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

        // Montar request no formato esperado pela API
        const request: any = {
            empresaId: 'EMPRESA_ID_AQUI', // TODO: pegar do contexto/auth
            comissao: {
                idVenda: parseInt(this.venda.codigo),
                valorVenda: this.parcelas.reduce((sum, p) => sum + p.valor, 0),
                cliente: {
                    nomeCompleto: this.cliente.nome,
                    cpfCnpj: this.cliente.cpfCnpj,
                    email: this.cliente.email,
                    telefone: '', // TODO: adicionar campo
                    endereco: {
                        logradouro: this.cliente.logradouro,
                        numero: this.cliente.numero,
                        complemento: this.cliente.complemento || '',
                        bairro: this.cliente.bairro,
                        cidade: this.cliente.cidade,
                        estado: this.cliente.estado,
                        cep: this.venda.cep
                    }
                },
                parcelas: this.parcelas.map((p, index) => ({
                    numeroParcela: index + 1,
                    valorParcela: p.valor,
                    dataVencimento: p.dataVencimento,
                    beneficiarios: p.beneficiarios.map(b => ({
                        nome: b.nome,
                        cpfCnpj: b.cpfCnpj,
                        percentual: b.percentual,
                        valor: b.valor,
                        chavePix: b.chavePix,
                        tipoChavePix: this.detectarTipoChavePix(b.chavePix)
                    }))
                }))
            }
        };

        this.loading = true;
        this.remessaService.criarRemessaManual(request).subscribe({
            next: (response) => {
                alert(`Remessa criada com sucesso! ID: ${response.remessaId}`);
                this.onClose();
                this.loading = false;
                window.location.reload(); // Recarregar lista
            },
            error: (err) => {
                console.error('Erro ao criar remessa:', err);
                alert('Erro: ' + (err.error?.message || err.message));
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
        this.venda = {
            codigo: '98798',
            unidade: 'teste api',
            dataVenda: '2025-12-21',
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
            estado: 'GO'
        };
        this.parcelas = [{
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
    }
}
