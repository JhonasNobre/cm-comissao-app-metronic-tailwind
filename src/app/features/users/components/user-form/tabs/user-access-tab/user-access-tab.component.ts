import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { AccordionModule } from 'primeng/accordion';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';

interface ResourceGroup {
    name: string;
    resources: any[];
}

@Component({
    selector: 'app-user-access-tab',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        SelectModule,
        MultiSelectModule,
        AccordionModule,
        CheckboxModule,
        TooltipModule,
        MessageModule
    ],
    templateUrl: './user-access-tab.component.html'
})
export class UserAccessTabComponent implements OnChanges {
    @Input() form!: FormGroup;
    @Input() companies: any[] = [];
    @Input() resources: any[] = [];
    @Input() permissions: any[] = [];

    groupedResources: ResourceGroup[] = [];
    activeIndices: number[] = []; // Control expanded tabs

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['resources'] || changes['permissions']) {
            this.groupResources();
        }
        if (changes['companies']) {
            console.log('Companies received:', this.companies);
        }
    }

    private groupResources(): void {
        if (!this.resources || this.resources.length === 0) {
            this.groupedResources = [];
            this.activeIndices = [];
            return;
        }

        // Mock grouping based on keywords or default
        const groups: { [key: string]: any[] } = {};

        this.resources.forEach(res => {
            // Infer group from name prefix if it exists (e.g. "Vendas - x")
            // If not, put in "Módulo Geral"
            let groupName = 'Módulo Geral';
            if (res.nome && res.nome.includes(' - ')) {
                groupName = res.nome.split(' - ')[0];
            } else if (res.nome && (res.nome.toLowerCase().includes('venda') || res.nome.toLowerCase().includes('comiss'))) {
                groupName = 'Módulo de Vendas';
            }

            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(res);
        });

        this.groupedResources = Object.keys(groups).map(key => ({
            name: key,
            resources: groups[key]
        }));

        // Expand all tabs by default
        this.activeIndices = this.groupedResources.map((_, index) => index);
    }

    hasPermission(resourceId: string, action: string): boolean {
        const perm = this.permissions.find(p => p.recursoId === resourceId && p.acao === action);
        return !!perm;
    }

    getScope(resourceId: string): string | null {
        // Find any permission for this resource to get the scope (assuming scope is uniform per resource-row)
        const perm = this.permissions.find(p => p.recursoId === resourceId);
        return perm ? perm.nivelAcesso : null;
    }

    isScopeSelected(resourceId: string, scopeValue: string): boolean {
        const currentScope = this.getScope(resourceId);
        return currentScope === scopeValue;
    }

    isOpen(index: number): boolean {
        return this.activeIndices.includes(index);
    }

    getPermissionSummary(resourceId: string): string {
        const parts: string[] = [];

        // Operations
        const ops: string[] = [];
        if (this.hasPermission(resourceId, 'CRIAR')) ops.push('Adicionar');
        if (this.hasPermission(resourceId, 'ATUALIZAR')) ops.push('Alterar');
        if (this.hasPermission(resourceId, 'LER')) ops.push('Consultar');
        if (this.hasPermission(resourceId, 'EXCLUIR')) ops.push('Remover');
        // Future placeholders if we had data for them:
        // if (this.hasPermission(resourceId, 'APROVAR')) ops.push('Aprovar');

        if (ops.length > 0) {
            parts.push(`Operações: ${ops.join(', ')}`);
        }

        // Scope
        const scope = this.getScope(resourceId);
        if (scope) {
            let scopeLabel = scope;
            switch (scope) {
                case 'TODOS': scopeLabel = 'Todos os Dados'; break;
                case 'DADOS_USUARIO': scopeLabel = 'Dados do Usuário'; break;
                case 'DADOS_EQUIPE': scopeLabel = 'Dados da Equipe'; break;
            }
            parts.push(`Visualização: ${scopeLabel}`);
        }

        return parts.length > 0 ? parts.join('; ') : 'Sem permissões configuradas';
    }
}
