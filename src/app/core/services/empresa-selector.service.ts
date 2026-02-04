import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';

export interface EmpresaInfo {
    id: string;
    nome: string;
    codigoLegado?: number;
}

/**
 * Serviço para gerenciar as empresas selecionadas pelo usuário.
 * Automaticamente seleciona a primeira empresa se o usuário tem apenas 1.
 * Usado pelo interceptor para adicionar o header X-Empresa-Ids nas requisições.
 */
@Injectable({
    providedIn: 'root'
})
export class EmpresaSelectorService {
    private readonly STORAGE_KEY = 'selected_empresas';

    private userEmpresasSubject = new BehaviorSubject<EmpresaInfo[]>([]);
    public userEmpresas$ = this.userEmpresasSubject.asObservable();

    private selectedEmpresaIdsSubject = new BehaviorSubject<string[]>([]);
    public selectedEmpresaIds$ = this.selectedEmpresaIdsSubject.asObservable();

    constructor() {
        this.loadFromStorage();
    }

    /**
     * Define as empresas do usuário logado (chamado pelo AuthService após login)
     */
    setUserEmpresas(empresas: EmpresaInfo[]): void {
        this.userEmpresasSubject.next(empresas);

        // Auto-seleciona se o usuário tem apenas 1 empresa
        if (empresas.length === 1) {
            this.setSelectedEmpresas([empresas[0].id]);
        } else if (empresas.length > 0) {
            // Se tem mais de 1, verifica se já tinha seleção salva
            const savedIds = this.getFromStorage();
            const validIds = savedIds.filter(id => empresas.some(e => e.id === id));

            if (validIds.length > 0) {
                this.setSelectedEmpresas(validIds);
            } else {
                // Se não tinha seleção válida, seleciona a primeira
                this.setSelectedEmpresas([empresas[0].id]);
            }
        }
    }

    /**
     * Define as empresas selecionadas
     */
    setSelectedEmpresas(ids: string[]): void {
        this.selectedEmpresaIdsSubject.next(ids);
        this.saveToStorage(ids);
    }

    /**
     * Obtém os IDs das empresas selecionadas (para uso síncrono)
     */
    getSelectedEmpresaIds(): string[] {
        return this.selectedEmpresaIdsSubject.value;
    }

    /**
     * Verifica se o usuário tem empresas
     */
    hasEmpresas(): boolean {
        return this.userEmpresasSubject.value.length > 0;
    }

    /**
     * Obtém a empresa selecionada atual (primeira da lista)
     */
    getEmpresaAtual(): EmpresaInfo | null {
        const ids = this.getSelectedEmpresaIds();
        if (ids.length === 0) return null;

        const empresas = this.userEmpresasSubject.value;
        return empresas.find(e => e.id === ids[0]) || null;
    }

    /**
     * Limpa a seleção (usado no logout)
     */
    clear(): void {
        this.userEmpresasSubject.next([]);
        this.selectedEmpresaIdsSubject.next([]);
        localStorage.removeItem(this.STORAGE_KEY);
    }

    private loadFromStorage(): void {
        const saved = this.getFromStorage();
        if (saved.length > 0) {
            this.selectedEmpresaIdsSubject.next(saved);
        }
    }

    private getFromStorage(): string[] {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    }

    private saveToStorage(ids: string[]): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ids));
    }
}
