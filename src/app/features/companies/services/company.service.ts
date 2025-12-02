import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from '../../../shared/services/base/base.service';
import { Company } from '../models/company.model';

@Injectable({
    providedIn: 'root'
})
export class CompanyService extends BaseService<Company> {

    constructor(http: HttpClient) {
        super(http, '/v1/empresas');
    }
}
