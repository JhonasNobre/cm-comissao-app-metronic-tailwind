import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Option {
    label: string;
    value: any;
}

@Injectable({
    providedIn: 'root'
})
export class SystemService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/v1/system`;

    getRoles(): Observable<Option[]> {
        return this.http.get<Option[]>(`${this.apiUrl}/roles`);
    }

    getUserTypes(): Observable<Option[]> {
        return this.http.get<Option[]>(`${this.apiUrl}/user-types`);
    }

    getDaysOfWeek(): Observable<Option[]> {
        return this.http.get<Option[]>(`${this.apiUrl}/days-of-week`);
    }
}
