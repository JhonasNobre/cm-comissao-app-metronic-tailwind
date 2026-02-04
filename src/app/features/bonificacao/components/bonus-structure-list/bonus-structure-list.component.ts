import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BonusService } from '../../services/bonus.service';
import { EstruturaBonificacao } from '../../models/bonus-structure.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

@Component({
    selector: 'app-bonus-structure-list',
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
    templateUrl: './bonus-structure-list.component.html'
})
export class BonusStructureListComponent implements OnInit {
    private bonusService = inject(BonusService);

    estruturas = toSignal(this.bonusService.listarEstruturas());
    loading = signal(false);

    ngOnInit(): void { }
}
