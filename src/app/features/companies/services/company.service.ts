import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Company, CompanyStatus } from '../models/company.model';

@Injectable({
    providedIn: 'root'
})
export class CompanyService {

    private mockCompanies: Company[] = [
        {
            id: '1',
            name: 'Click Menos Comissão',
            tradeName: 'Click Menos',
            cnpj: '12.345.678/0001-90',
            email: 'contato@clickmenos.com.br',
            phone: '(11) 99999-9999',
            status: CompanyStatus.ACTIVE,
            address: {
                street: 'Av. Paulista',
                number: '1000',
                neighborhood: 'Bela Vista',
                city: 'São Paulo',
                state: 'SP',
                zipCode: '01310-100'
            },
            createdAt: new Date('2023-01-15')
        },
        {
            id: '2',
            name: 'Tech Solutions Ltda',
            tradeName: 'TechSol',
            cnpj: '98.765.432/0001-10',
            email: 'admin@techsol.com',
            phone: '(41) 3333-3333',
            status: CompanyStatus.ACTIVE,
            createdAt: new Date('2023-03-20')
        },
        {
            id: '3',
            name: 'Comércio de Bebidas Silva',
            tradeName: 'Adega Silva',
            cnpj: '45.678.901/0001-23',
            email: 'financeiro@adegasilva.com.br',
            status: CompanyStatus.PENDING,
            createdAt: new Date('2023-06-10')
        },
        {
            id: '4',
            name: 'Transportadora Veloz',
            tradeName: 'Veloz Log',
            cnpj: '11.222.333/0001-44',
            email: 'sac@velozlog.com.br',
            status: CompanyStatus.INACTIVE,
            createdAt: new Date('2022-11-05')
        },
        {
            id: '5',
            name: 'Padaria Pão Quente',
            tradeName: 'Pão Quente',
            cnpj: '55.444.333/0001-22',
            email: 'contato@paoquente.com',
            status: CompanyStatus.BLOCKED,
            createdAt: new Date('2023-08-01')
        }
    ];

    constructor() { }

    getCompanies(): Observable<Company[]> {
        return of(this.mockCompanies).pipe(delay(500));
    }

    getCompanyById(id: string): Observable<Company | undefined> {
        const company = this.mockCompanies.find(c => c.id === id);
        return of(company).pipe(delay(300));
    }

    createCompany(company: Omit<Company, 'id' | 'createdAt'>): Observable<Company> {
        const newCompany: Company = {
            ...company,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date()
        };
        this.mockCompanies = [newCompany, ...this.mockCompanies];
        return of(newCompany).pipe(delay(500));
    }

    updateCompany(id: string, company: Partial<Company>): Observable<Company> {
        const index = this.mockCompanies.findIndex(c => c.id === id);
        if (index !== -1) {
            this.mockCompanies[index] = { ...this.mockCompanies[index], ...company, updatedAt: new Date() };
            return of(this.mockCompanies[index]).pipe(delay(500));
        }
        throw new Error('Company not found');
    }

    deleteCompany(id: string): Observable<void> {
        this.mockCompanies = this.mockCompanies.filter(c => c.id !== id);
        return of(void 0).pipe(delay(500));
    }
}
