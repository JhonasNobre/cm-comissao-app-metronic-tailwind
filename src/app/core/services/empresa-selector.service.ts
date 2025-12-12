import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EmpresaInfo {
    id: string;
    nome: string;
    logoUrl?: string;
    cargo?: string; // Para exibir no card visual
}

/**
 * Serviço para gerenciar o contexto da empresa selecionada (Single Tenant Session)
 * Armazena ID em SessionStorage para isolamento por aba do navegador.
 * Valida a troca de contexto no backend via endpoint /auth/selecionar-empresa.
 */
@Injectable({
    providedIn: 'root'
})
export class EmpresaSelectorService {
    private readonly STORAGE_KEY = 'current_empresa_id'; // Key singular
    private readonly API_URL = `${environment.apiUrl}/authentication/selecionar-empresa`;

    private http = inject(HttpClient);

    private userEmpresasSubject = new BehaviorSubject<EmpresaInfo[]>([]);
    public userEmpresas$ = this.userEmpresasSubject.asObservable();

    private currentEmpresaSubject = new BehaviorSubject<EmpresaInfo | null>(null);
    public currentEmpresa$ = this.currentEmpresaSubject.asObservable();

    constructor() {
        this.loadFromStorage();
    }

    /**
     * Define as empresas disponíveis p/ usuário (chamado no login)
     */
    setUserEmpresas(empresas: EmpresaInfo[]): void {
        console.log('Empresas load:', empresas);
        this.userEmpresasSubject.next(empresas);

        // Se já tem empresa na sessão, reidrata o objeto completo
        this.rehydrateCurrentEmpresa(empresas);
    }

    /**
     * Seleciona uma empresa, valida no backend e atualiza a sessão
     */
    selecionarEmpresa(empresa: EmpresaInfo): Observable<any> {
        return this.http.post(this.API_URL, { empresaId: empresa.id }).pipe(
            tap(() => {
                this.setCurrentEmpresaState(empresa);
            })
        );
    }

    /**
     * Obtém o ID da empresa atual para o Interceptor
     */
    getCurrentEmpresaId(): string | null {
        return this.currentEmpresaSubject.value?.id || null;
    }

    /**
     * Limpa o contexto (logout)
     */
    clear(): void {
        this.userEmpresasSubject.next([]);
        this.currentEmpresaSubject.next(null);
        sessionStorage.removeItem(this.STORAGE_KEY);
    }

    // --- Private Helpers ---

    private setCurrentEmpresaState(empresa: EmpresaInfo): void {
        this.currentEmpresaSubject.next(empresa);
        sessionStorage.setItem(this.STORAGE_KEY, empresa.id);
    }

    private loadFromStorage(): void {
        const savedId = sessionStorage.getItem(this.STORAGE_KEY);
        if (savedId) {
            // Apenas ID está salvo, precisamos do objeto completo da lista de empresas
            // Isso será resolvido quando setUserEmpresas for chamado
            console.log('Session restored:', savedId);
        }
    }

    private rehydrateCurrentEmpresa(empresas: EmpresaInfo[]): void {
        const savedId = sessionStorage.getItem(this.STORAGE_KEY);
        if (savedId) {
            const found = empresas.find(e => e.id === savedId);
            if (found) {
                this.currentEmpresaSubject.next(found);
            } else {
                // ID salvo não existe mais nas permissões do usuário
                this.clear();
            }
        }
    }
}
