import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BonusService } from '../../services/bonus.service';
import { Bonus, EStatusBonus, ETipoBonus } from '../../models/bonus.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

@Component({
    selector: 'app-bonus-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        TableModule,
        TagModule,
        ButtonModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule
    ],
    templateUrl: './bonus-list.component.html'
})
export class BonusListComponent implements OnInit {
    private bonusService = inject(BonusService);

    bonusesResult = toSignal(this.bonusService.listarBonus());
    loading = signal(false);

    ngOnInit(): void { }

    getTipoLabel(tipo: ETipoBonus): string {
        switch (tipo) {
            case ETipoBonus.MetaAtingida: return 'Meta';
            case ETipoBonus.Campanha: return 'Campanha';
            case ETipoBonus.Desempenho: return 'Desempenho';
            case ETipoBonus.Manual: return 'Manual';
            default: return 'Outro';
        }
    }

    getStatusSeverity(status: EStatusBonus): 'warn' | 'info' | 'success' | 'danger' | 'secondary' {
        switch (status) {
            case EStatusBonus.Pendente: return 'warn';
            case EStatusBonus.EmPagamento: return 'info';
            case EStatusBonus.Pago: return 'success';
            case EStatusBonus.Cancelado: return 'danger';
            default: return 'secondary';
        }
    }

    getStatusLabel(status: EStatusBonus): string {
        switch (status) {
            case EStatusBonus.Pendente: return 'Pendente';
            case EStatusBonus.EmPagamento: return 'Em Pagamento';
            case EStatusBonus.Pago: return 'Pago';
            case EStatusBonus.Cancelado: return 'Cancelado';
            default: return '-';
        }
    }
}
