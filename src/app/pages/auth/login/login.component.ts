import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './login.component.html',
    host: { class: 'contents' }
})
export class LoginComponent {
    constructor(private authService: AuthService) { }

    login() {
        this.authService.login();
    }
}
