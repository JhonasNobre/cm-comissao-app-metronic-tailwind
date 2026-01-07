import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BaseService } from '../../../shared/services/base/base.service';
import { Company } from '../models/company.model';
import { CreateCompanyRequest, UpdateCompanyRequest } from '../models/company-request.dto';

@Injectable({
    providedIn: 'root'
})
export class CompanyService extends BaseService {

    constructor(http: HttpClient) {
        super(http, '/v1/empresas');
    }

    list(params?: any): Observable<Company[]> {
        const httpParams = this.buildHttpParams(params);
        return this.http.get<any[]>(`${this.baseUrl}`, { params: httpParams }).pipe(
            map(companies => companies.map(this.mapResponseToModel))
        );
    }

    get(id: string): Observable<Company> {
        return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
            map(this.mapResponseToModel)
        );
    }

    create(company: Company): Observable<Company> {
        const request: CreateCompanyRequest = this.mapModelToCreateRequest(company);
        return this.http.post<any>(`${this.baseUrl}`, request).pipe(
            map(this.mapResponseToModel)
        );
    }

    update(company: Company, id: string): Observable<boolean> {
        const request: UpdateCompanyRequest = this.mapModelToUpdateRequest(company);
        return this.http.put<void>(`${this.baseUrl}/${id}`, request).pipe(map(() => true));
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    getByExternalAuthId(externalAuthId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/usuario/${externalAuthId}`);
    }

    /**
     * Maps backend response (Portuguese) to frontend model (English)
     */
    private mapResponseToModel(response: any): Company {
        return {
            id: response.id,
            name: response.nome,
            tradeName: response.nomeFantasia || response.nome, // Fallback if not present
            cnpj: response.cnpj,
            email: response.email || '',
            phone: response.telefone,
            status: response.status || 'ACTIVE',
            createdAt: new Date(response.criadoEm || response.createdAt),
            updatedAt: response.atualizadoEm ? new Date(response.atualizadoEm) : undefined
        } as Company;
    }

    /**
     * Maps frontend model (English) to backend create request (Portuguese)
     */
    private mapModelToCreateRequest(company: Company): CreateCompanyRequest {
        return {
            nome: company.name,
            cnpj: company.cnpj
        };
    }

    /**
     * Maps frontend model (English) to backend update request (Portuguese)
     */
    private mapModelToUpdateRequest(company: Company): UpdateCompanyRequest {
        return {
            nome: company.name,
            cnpj: company.cnpj
        };
    }
}
