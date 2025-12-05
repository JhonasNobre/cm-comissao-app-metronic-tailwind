import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { Subscription } from 'rxjs';
import { EmpresaSelectorService, EmpresaInfo } from '../../../core/services/empresa-selector.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-empresa-selector',
    standalone: true,
    imports: [CommonModule, FormsModule, MultiSelectModule],
    template: `
        <div *ngIf="empresas.length > 1" class="empresa-selector">
            <p-multiSelect
                [options]="empresaOptions"
                [(ngModel)]="selectedIds"
                (onChange)="onSelectionChange()"
                optionLabel="label"
                optionValue="value"
                placeholder="Selecione empresas"
                [showToggleAll]="false"
                [maxSelectedLabels]="1"
                selectedItemsLabel="{0} empresas"
                styleClass="w-full"
            />
        </div>
        <div *ngIf="empresas.length === 1" class="single-empresa">
            <span class="text-sm text-gray-600">{{ empresas[0].nome }}</span>
        </div>
    `,
    styles: [`
        .empresa-selector {
            min-width: 180px;
        }
        .single-empresa {
            display: flex;
            align-items: center;
        }
    `]
})
export class EmpresaSelectorComponent implements OnInit, OnDestroy {
    private empresaSelectorService = inject(EmpresaSelectorService);
    private authService = inject(AuthService);
    private subscription?: Subscription;

    empresas: EmpresaInfo[] = [];
    selectedIds: string[] = [];
    empresaOptions: { label: string; value: string }[] = [];

    ngOnInit(): void {
        this.subscription = this.empresaSelectorService.userEmpresas$.subscribe(empresas => {
            this.empresas = empresas;
            this.empresaOptions = empresas.map(e => ({
                label: e.nome,
                value: e.id
            }));
        });

        this.empresaSelectorService.selectedEmpresaIds$.subscribe(ids => {
            this.selectedIds = ids;
        });
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }

    onSelectionChange(): void {
        this.empresaSelectorService.setSelectedEmpresas(this.selectedIds);
    }
}
