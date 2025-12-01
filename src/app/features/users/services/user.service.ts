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
        },
        {
            id: '5',
            name: 'Brian Cox',
            email: 'brian@clickmenos.com',
            role: UserRole.VENDEDOR,
            status: UserStatus.ACTIVE,
            avatar: 'assets/media/avatars/300-3.png',
            joinedDate: new Date('2023-05-12'),
            teams: ['Vendas']
        },
        {
            id: '6',
            name: 'Mikaela Collins',
            email: 'mikaela@clickmenos.com',
            role: UserRole.GESTOR,
            status: UserStatus.ACTIVE,
            avatar: 'assets/media/avatars/300-4.png',
            joinedDate: new Date('2023-06-18'),
            teams: ['Marketing']
        },
        {
            id: '7',
            name: 'Francis Mitcham',
            email: 'francis@clickmenos.com',
            role: UserRole.VENDEDOR,
            status: UserStatus.INACTIVE,
            avatar: 'assets/media/avatars/300-7.png',
            joinedDate: new Date('2023-07-22'),
            teams: []
        },
        {
            id: '8',
            name: 'Olivia Wild',
            email: 'olivia@clickmenos.com',
            role: UserRole.VENDEDOR,
            status: UserStatus.ACTIVE,
            avatar: 'assets/media/avatars/300-8.png',
            joinedDate: new Date('2023-08-30'),
            teams: ['Vendas']
        },
        {
            id: '9',
            name: 'Neil Owen',
            email: 'neil@clickmenos.com',
            role: UserRole.VENDEDOR,
            status: UserStatus.ACTIVE,
            avatar: 'assets/media/avatars/300-9.png',
            joinedDate: new Date('2023-09-14'),
            teams: ['Vendas']
        },
        {
            id: '10',
            name: 'Dan Wilson',
            email: 'dan@clickmenos.com',
            role: UserRole.VENDEDOR,
            status: UserStatus.PENDING,
            avatar: 'assets/media/avatars/300-10.png',
            joinedDate: new Date('2023-10-05'),
            teams: []
        },
        {
            id: '11',
            name: 'Emma Bold',
            email: 'emma.bold@clickmenos.com',
            role: UserRole.GESTOR,
            status: UserStatus.ACTIVE,
            avatar: 'assets/media/avatars/300-11.png',
            joinedDate: new Date('2023-11-20'),
            teams: ['Suporte']
        },
        {
            id: '12',
            name: 'Ana Hansen',
            email: 'ana@clickmenos.com',
            role: UserRole.VENDEDOR,
            status: UserStatus.ACTIVE,
            avatar: 'assets/media/avatars/300-12.png',
            joinedDate: new Date('2024-01-10'),
            teams: ['Vendas']
        },
        {
            id: '13',
            name: 'Robert Doe',
            email: 'robert@clickmenos.com',
            role: UserRole.VENDEDOR,
            status: UserStatus.LOCKED,
            avatar: 'assets/media/avatars/300-13.png',
            joinedDate: new Date('2024-02-14'),
            teams: []
        },
        {
            id: '14',
            name: 'John Miller',
            email: 'john@clickmenos.com',
            role: UserRole.VENDEDOR,
            status: UserStatus.ACTIVE,
            avatar: 'assets/media/avatars/300-14.png',
            joinedDate: new Date('2024-03-22'),
            teams: ['Vendas']
        },
        {
            id: '15',
            name: 'Lucy Kunic',
            email: 'lucy@clickmenos.com',
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
            avatar: 'assets/media/avatars/300-15.png',
            joinedDate: new Date('2024-04-18'),
            teams: ['Gestão']
        },
        {
            id: '16',
            name: 'Ethan Wilder',
            email: 'ethan@clickmenos.com',
            role: UserRole.VENDEDOR,
            status: UserStatus.ACTIVE,
            avatar: 'assets/media/avatars/300-16.png',
            joinedDate: new Date('2024-05-25'),
            teams: ['Vendas']
        },
        {
            id: '17',
            name: 'Olivia Miller',
            email: 'olivia.m@clickmenos.com',
            role: UserRole.VENDEDOR,
            status: UserStatus.INACTIVE,
            avatar: 'assets/media/avatars/300-17.png',
            joinedDate: new Date('2024-06-12'),
            teams: []
        },
        {
            id: '18',
            name: 'Brad Simmons',
            email: 'brad@clickmenos.com',
            role: UserRole.GESTOR,
            status: UserStatus.ACTIVE,
            avatar: 'assets/media/avatars/300-18.png',
            joinedDate: new Date('2024-07-08'),
            teams: ['Marketing']
        },
        {
            id: '19',
            name: 'Sophia Anderson',
            email: 'sophia@clickmenos.com',
            role: UserRole.VENDEDOR,
            status: UserStatus.PENDING,
            avatar: 'assets/media/avatars/300-19.png',
            joinedDate: new Date('2024-08-15'),
            teams: []
        },
        {
            id: '20',
            name: 'James Wilson',
            email: 'james@clickmenos.com',
            role: UserRole.VENDEDOR,
            status: UserStatus.ACTIVE,
            avatar: 'assets/media/avatars/300-20.png',
            joinedDate: new Date('2024-09-20'),
            teams: ['Vendas']
        },
        {
            id: '21',
            name: 'Isabella Martinez',
            email: 'isabella@clickmenos.com',
            role: UserRole.VENDEDOR,
            status: UserStatus.ACTIVE,
            avatar: 'assets/media/avatars/300-21.png',
            joinedDate: new Date('2024-10-05'),
            teams: ['Vendas']
        },
        {
            id: '22',
            name: 'Michael Brown',
            email: 'michael@clickmenos.com',
            role: UserRole.GESTOR,
            status: UserStatus.ACTIVE,
            avatar: 'assets/media/avatars/300-22.png',
            joinedDate: new Date('2024-11-10'),
            teams: ['Financeiro']
        },
        {
            id: '23',
            name: 'Emily Davis',
            email: 'emily@clickmenos.com',
            role: UserRole.VENDEDOR,
            status: UserStatus.LOCKED,
            avatar: 'assets/media/avatars/300-23.png',
            joinedDate: new Date('2024-11-20'),
            teams: []
        },
        {
            id: '24',
            name: 'William Garcia',
            email: 'william@clickmenos.com',
            role: UserRole.VENDEDOR,
            status: UserStatus.ACTIVE,
            avatar: 'assets/media/avatars/300-24.png',
            joinedDate: new Date('2024-11-28'),
            teams: ['Vendas']
        },
        {
            id: '25',
            name: 'Ava Rodriguez',
            email: 'ava@clickmenos.com',
            role: UserRole.VENDEDOR,
            status: UserStatus.PENDING,
            avatar: 'assets/media/avatars/300-25.png',
            joinedDate: new Date('2024-12-01'),
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
