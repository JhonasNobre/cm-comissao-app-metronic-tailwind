import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { User, UserListDTO, UserRole, UserStatus } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {

    // Mock data
    private users: User[] = [
        {
            id: '1',
            name: 'Emma Smith',
            email: 'emma@clickmenos.com',
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
            avatar: 'assets/media/avatars/300-6.png',
            joinedDate: new Date('2023-01-15'),
            lastLogin: new Date(),
            teams: ['Gestão', 'Financeiro']
        },
        {
            id: '2',
            name: 'Melody Macy',
            email: 'melody@clickmenos.com',
            role: UserRole.GESTOR,
            status: UserStatus.ACTIVE,
            avatar: 'assets/media/avatars/300-2.png',
            joinedDate: new Date('2023-02-20'),
            lastLogin: new Date(Date.now() - 86400000), // 1 day ago
            teams: ['Vendas']
        },
        {
            id: '3',
            name: 'Max Smith',
            email: 'max@clickmenos.com',
            role: UserRole.VENDEDOR,
            status: UserStatus.LOCKED,
            avatar: 'assets/media/avatars/300-1.png',
            joinedDate: new Date('2023-03-10'),
            lastLogin: new Date(Date.now() - 172800000), // 2 days ago
            teams: ['Vendas']
        },
        {
            id: '4',
            name: 'Sean Bean',
            email: 'sean@clickmenos.com',
            role: UserRole.VENDEDOR,
            status: UserStatus.PENDING,
            avatar: 'assets/media/avatars/300-5.png',
            joinedDate: new Date('2023-04-05'),
            teams: []
        }
    ];

    constructor() { }

    getUsers(): Observable<UserListDTO[]> {
        // Return mock data with delay to simulate API
        return of(this.users).pipe(delay(500));
    }

    getUserById(id: string): Observable<User | undefined> {
        const user = this.users.find(u => u.id === id);
        return of(user).pipe(delay(300));
    }

    createUser(user: any): Observable<User> {
        const newUser: User = {
            ...user,
            id: Math.random().toString(36).substr(2, 9),
            status: UserStatus.ACTIVE,
            joinedDate: new Date(),
            avatar: 'assets/media/avatars/300-1.png' // Default
        };
        this.users.push(newUser);
        return of(newUser).pipe(delay(500));
    }

    updateUser(id: string, data: any): Observable<User | undefined> {
        const index = this.users.findIndex(u => u.id === id);
        if (index !== -1) {
            this.users[index] = { ...this.users[index], ...data };
            return of(this.users[index]).pipe(delay(500));
        }
        return of(undefined).pipe(delay(500));
    }

    deleteUser(id: string): Observable<boolean> {
        const index = this.users.findIndex(u => u.id === id);
        if (index !== -1) {
            this.users.splice(index, 1);
            return of(true).pipe(delay(500));
        }
        return of(false).pipe(delay(500));
    }
}
