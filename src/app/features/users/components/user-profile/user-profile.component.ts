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
        this.userService.getUserById(id).subscribe({
            next: (user: User | undefined) => {
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

    getRoleBadgeClass(role: string): string {
        switch (role) {
            case 'Admin': return 'kt-badge-danger';
            case 'Gestor': return 'kt-badge-primary';
            case 'Vendedor': return 'kt-badge-info';
            default: return 'kt-badge-secondary';
        }
    }

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'Active': return 'kt-badge-success';
            case 'Inactive': return 'kt-badge-secondary';
            case 'Pending': return 'kt-badge-warning';
            case 'Locked': return 'kt-badge-danger';
            default: return 'kt-badge-secondary';
        }
    }
}
