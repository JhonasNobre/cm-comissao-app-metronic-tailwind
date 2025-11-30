import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: '[app-header]',
  templateUrl: './header.component.html',
  standalone: true,
  imports: [RouterLink]
})
export class HeaderComponent {
  private authService = inject(AuthService);

  logout() {
    this.authService.logout();
  }
}
