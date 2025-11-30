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

  userName: string = 'Usuário';
  userEmail: string = '';
  userAvatar: string = 'assets/media/avatars/300-2.png'; // Default avatar

  ngOnInit(): void {
    this.loadUserInfo();
  }

  private loadUserInfo(): void {
    if (this.authService.isAuthenticated()) {
      const claims = this.authService.getUserInfo();
      if (claims) {
        this.userName = claims.name || claims.preferred_username || 'Usuário';
        this.userEmail = claims.email || '';
      }
    }
  }

  logout() {
    this.authService.logout();
  }
}
