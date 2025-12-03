import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { User, UserRole } from '../../models/user.model';
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

    getRoleBadgeClass(role: UserRole): string {
        switch (role) {
            case UserRole.ADMINISTRADOR: return 'kt-badge-danger';
            case UserRole.COLABORADOR: return 'kt-badge-info';
            case UserRole.CLIENTE: return 'kt-badge-success';
            default: return 'kt-badge-secondary';
        }
    }

    getStatusBadgeClass(inativo: boolean): string {
        return inativo ? 'kt-badge-danger' : 'kt-badge-success';
    }
}
