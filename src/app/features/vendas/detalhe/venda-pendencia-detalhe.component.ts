import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { PendenciaService } from '../services/pendencia.service';
import { VendaPendencia } from '../models/pendencia.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-venda-pendencia-detalhe',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        TagModule,
        TabsModule,
        TableModule,
        ToastModule
    ],
    providers: [MessageService],
    templateUrl: './venda-pendencia-detalhe.component.html'
})
export class VendaPendenciaDetalheComponent implements OnInit {
    private pendenciaService = inject(PendenciaService);
    private authService = inject(AuthService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private messageService = inject(MessageService);

    venda: VendaPendencia | null = null;
    loading = false;

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.loadDetalhes(Number(id));
            }
        });
    }

    loadDetalhes(codigoVendaLegado: number) {
        this.loading = true;
        this.pendenciaService.obterDetalhes(codigoVendaLegado).subscribe({
            next: (data) => {
                this.venda = data;
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar detalhes da pendência' });
                this.loading = false;
            }
        });
    }

    voltar() {
        this.router.navigate(['/vendas/pendentes']);
    }

    abrirDocumento(url: string) {
        if (url) {
            window.open(url, '_blank');
        }
    }
}
