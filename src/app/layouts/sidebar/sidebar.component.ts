import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: '[app-sidebar]',
  templateUrl: './sidebar.component.html',
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class SidebarComponent {
  private authService = inject(AuthService);

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }
}