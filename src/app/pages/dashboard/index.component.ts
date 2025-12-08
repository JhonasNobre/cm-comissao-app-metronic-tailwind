import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ComissaoService } from '../../features/comissoes/services/comissao.service';
import { DashboardStats } from '../../features/comissoes/models/comissao.model';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: './index.component.html',
  styleUrl: './index.component.scss'
})
export class IndexComponent implements OnInit {
  private comissaoService = inject(ComissaoService);

  stats: DashboardStats | null = null;
  loading = true;

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.loading = true;
    this.comissaoService.getDashboard().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }
}
