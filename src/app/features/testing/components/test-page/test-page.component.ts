import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MetronicInitService } from '../../../core/services/metronic-init.service';

@Component({
  selector: 'app-test-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './test-page.component.html',
  styleUrl: './test-page.component.scss'
})
export class TestPageComponent implements AfterViewInit {
  private metronicInitService = inject(MetronicInitService);

  ngAfterViewInit(): void {
    // Inicializa os componentes Metronic (datatable, selects, menus, etc)
    this.metronicInitService.init();
  }
}
