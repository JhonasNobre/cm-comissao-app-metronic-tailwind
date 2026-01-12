import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '../../models/user.model';
import { UserService } from '../../services/user.service';

@Component({
    selector: 'app-user-profile',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './user-profile.component.html',
    encapsulation: ViewEncapsulation.None,
    styles: [`
        /* Profile specific styles if needed */
    `]
})
export class UserProfileComponent implements OnInit {
    user: User | null = null;
    loading = true;
    error: string | null = null;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private userService: UserService
    ) { }

    ngOnInit(): void {
        const userId = this.route.snapshot.paramMap.get('id');
        if (userId) {
            this.loadUser(userId);
        } else {
            this.error = 'User ID not provided';
            this.loading = false;
        }
    }

    private loadUser(id: string): void {
        this.loading = true;
        this.userService.get(id).subscribe({
            next: (user: User) => {
                this.user = user || null;
                this.loading = false;
            },
            error: (err: any) => {
                console.error('Error loading user:', err);
                this.error = 'Failed to load user data';
                this.loading = false;
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/users']);
    }



    getStatusBadgeClass(inativo: boolean): string {
        return inativo ? 'kt-badge-danger' : 'kt-badge-success';
    }

    // Photo Upload Logic
    get photoUrl(): string {
        if (!this.user) return '';
        if (this.user.fotoPerfil) return this.user.fotoPerfil;
        // Adiciona timestamp para evitar cache após atualização
        return `${this.userService.getFotoUrl(this.user.id)}?t=${this.photoTimestamp}`;
    }

    photoTimestamp = Date.now();
    showInitials = false;

    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file && this.user) {
            this.loading = true;
            this.userService.uploadFoto(this.user.id, file).subscribe({
                next: () => {
                    this.photoTimestamp = Date.now(); // Força reload da imagem
                    this.showInitials = false;
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Erro ao fazer upload da foto', err);
                    this.error = 'Falha ao atualizar foto de perfil';
                    this.loading = false;
                }
            });
        }
    }

    onImgError(): void {
        this.showInitials = true;
    }
}
