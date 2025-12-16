import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, TreeNode } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';
import { OrganizationChartModule } from 'primeng/organizationchart';
import { DialogModule } from 'primeng/dialog';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { EstruturaComissaoService } from '../../services/estrutura-comissao.service';
import { CreateEstruturaComissaoRequest, UpdateEstruturaComissaoRequest, CreateEstruturaComissaoNivelRequest, EstruturaComissaoMembro, CreateEstruturaComissaoMembroRequest } from '../../models/estrutura-comissao.model';
import {
    TipoComissao, TipoComissaoLabels,
    TipoRateio, TipoRateioLabels,
    RegraLiberacao, RegraLiberacaoLabels,
    TipoValor, TipoValorLabels
} from '../../models/enums';
import { EmpresaSelectorService } from '../../../../core/services/empresa-selector.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CompanyService } from '../../../companies/services/company.service';
import { Company } from '../../../companies/models/company.model';
import { UserService } from '../../../users/services/user.service';
import { TeamService } from '../../../teams/services/team.service';
import { UserListDTO } from '../../../users/models/user.model';
import { TeamListDTO } from '../../../teams/models/team.model';

@Component({
    selector: 'app-estrutura-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        ToastModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        InputNumberModule,
        CardModule,
        DividerModule,
        RippleModule,
        OrganizationChartModule,
        DialogModule,
        AutoCompleteModule,
        SelectButtonModule,
        TooltipModule,
        CheckboxModule
    ],
    providers: [MessageService],
    templateUrl: './estrutura-form.component.html',
    styleUrl: './estrutura-form.component.scss'
})
export class EstruturaFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private estruturaService = inject(EstruturaComissaoService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    public messageService = inject(MessageService);
    private empresaSelectorService = inject(EmpresaSelectorService);
    private companyService = inject(CompanyService);
    private authService = inject(AuthService);
    private userService = inject(UserService);
    private teamService = inject(TeamService);

    saving = signal(false);
    loading = signal(false);
    form!: FormGroup;
    estruturaId?: string;
    isEditMode = signal(false);
    versaoAtual: number = 0;

    // Tree Logic
    treeData: TreeNode[] = [];
    selectedNode: TreeNode | null = null;

    // Level Dialog Logic
    displayLevelDialog = false;
    levelForm!: FormGroup;
    editingNode: TreeNode | null = null;
    parentForNewNode: TreeNode | null = null;

    // Bulk Member Assignment Dialog (simplified - no level selection)
    displayBulkMemberDialog = false;
    bulkMemberSearch = '';
    allUsersForBulk: UserListDTO[] = [];
    allTeamsForBulk: TeamListDTO[] = [];
    filteredMembersForBulk: (UserListDTO | TeamListDTO)[] = [];
    selectedMembersForBulk: (UserListDTO | TeamListDTO)[] = [];
    selectedBulkMemberType: 'usuario' | 'equipe' = 'usuario';

    // Get total members count across all levels
    getTotalMembersCount(): number {
        let count = 0;
        this.treeData.forEach(node => {
            count += this.countMembersRecursive(node);
        });
        return count;
    }

    private countMembersRecursive(node: TreeNode): number {
        let count = node.data?.membros?.length || 0;
        if (node.children) {
            node.children.forEach(child => {
                count += this.countMembersRecursive(child);
            });
        }
        return count;
    }

    // Get all assigned member IDs to filter them out
    private getAssignedMemberIds(): { userIds: string[], teamIds: string[] } {
        const userIds: string[] = [];
        const teamIds: string[] = [];

        const collectFromNode = (node: TreeNode) => {
            if (node.data?.membros) {
                node.data.membros.forEach((m: CreateEstruturaComissaoMembroRequest) => {
                    if (m.usuarioId) userIds.push(m.usuarioId);
                    if (m.equipeId) teamIds.push(m.equipeId);
                });
            }
            if (node.children) {
                node.children.forEach(collectFromNode);
            }
        };

        this.treeData.forEach(collectFromNode);
        return { userIds, teamIds };
    }

    // Member Selection Logic
    memberTypeOptions = [
        { label: 'Usuário', value: 'usuario' },
        { label: 'Equipe', value: 'equipe' }
    ];
    selectedMemberType = 'usuario';
    filteredUsers: UserListDTO[] = [];
    filteredTeams: TeamListDTO[] = [];
    selectedMemberToAdd: any = null;
    currentLevelMembers: EstruturaComissaoMembro[] = [];

    // Enums para uso no template
    TipoComissao = TipoComissao;
    TipoRateio = TipoRateio;
    RegraLiberacao = RegraLiberacao;
    TipoValor = TipoValor;

    // Options para dropdowns
    tipoComissaoOptions = Object.entries(TipoComissaoLabels).map(([value, label]) => ({
        label,
        value: Number(value)
    }));

    tipoRateioOptions = Object.entries(TipoRateioLabels).map(([value, label]) => ({
        label,
        value: Number(value)
    }));

    regraLiberacaoOptions = Object.entries(RegraLiberacaoLabels).map(([value, label]) => ({
        label,
        value: Number(value)
    }));

    tipoValorOptions = Object.entries(TipoValorLabels).map(([value, label]) => ({
        label,
        value: Number(value)
    }));

    // Empresas
    empresas: { label: string; value: string }[] = [];

    ngOnInit() {
        this.initForm();
        this.initLevelForm();
        this.loadEmpresas();

        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.estruturaId = id;
                this.isEditMode.set(true);
                this.loadEstrutura(id);
            } else {
                this.treeData = [];
            }
        });
    }

    private initForm() {
        this.form = this.fb.group({
            idEmpresa: [null, [Validators.required]],
            nome: ['', [Validators.required, Validators.maxLength(100)]],
            descricao: ['', [Validators.maxLength(500)]],
            status: ['Ativo', [Validators.required]],
            tipoComissao: [TipoComissao.Percentual, [Validators.required]],
            valorPercentual: [null, [Validators.min(0), Validators.max(100)]],
            valorFixoInicial: [null, [Validators.min(0)]],
            tipoRateio: [TipoRateio.Linear, [Validators.required]],
            regraLiberacao: [RegraLiberacao.Diretamente, [Validators.required]],
            percentualLiberacao: [null, [Validators.min(0), Validators.max(100)]],
            parcelaLiberacao: [null, [Validators.min(1)]]
        });
    }

    private initLevelForm() {
        this.levelForm = this.fb.group({
            nomeNivel: ['', [Validators.required, Validators.maxLength(50)]],
            prioridade: [1, [Validators.required, Validators.min(1)]],
            tipoValor: [TipoValor.Percentual, [Validators.required]],
            percentual: [null, [Validators.min(0), Validators.max(100)]],
            valorFixo: [null, [Validators.min(0)]]
        });
    }

    private loadEmpresas() {
        if (this.authService.isAdmin()) {
            this.loading.set(true);
            this.companyService.list({ size: 1000 }).subscribe({
                next: (result: any) => {
                    const lista = Array.isArray(result) ? result : (result.content || []);
                    this.empresas = lista.map((e: Company) => ({
                        label: `${e.name} (${e.cnpj})`,
                        value: e.id
                    }));
                    if (this.empresas.length === 1 && !this.estruturaId) {
                        this.form.patchValue({ idEmpresa: this.empresas[0].value });
                    }
                    this.loading.set(false);
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar lista de empresas' });
                    this.loading.set(false);
                }
            });
        } else {
            this.empresaSelectorService.userEmpresas$.subscribe(empresas => {
                this.empresas = empresas.map(e => ({ label: e.nome, value: e.id }));
                if (this.empresas.length === 1 && !this.estruturaId) {
                    this.form.patchValue({ idEmpresa: this.empresas[0].value });
                }
            });
        }
    }

    loadEstrutura(id: string) {
        this.loading.set(true);
        this.estruturaService.getById(id).subscribe({
            next: (estrutura) => {
                console.log('=== ESTRUTURA CARREGADA DO BACKEND ===');
                console.log('Estrutura completa:', estrutura);
                console.log('Niveis:', estrutura.niveis);
                if (estrutura.niveis) {
                    estrutura.niveis.forEach((n: any, i: number) => {
                        console.log(`Nivel ${i}:`, n.nomeNivel, 'ParentId:', n.parentId, 'Membros:', n.membros);
                    });
                }

                this.versaoAtual = estrutura.versao;
                this.form.patchValue({
                    idEmpresa: estrutura.idEmpresa,
                    nome: estrutura.nome,
                    descricao: estrutura.descricao,
                    status: estrutura.ativo ? 'Ativo' : 'Inativo',
                    tipoComissao: typeof estrutura.tipoComissao === 'string' ? TipoComissao[estrutura.tipoComissao as keyof typeof TipoComissao] : estrutura.tipoComissao,
                    valorPercentual: estrutura.valorPercentual,
                    valorFixoInicial: estrutura.valorFixoInicial,
                    tipoRateio: typeof estrutura.tipoRateio === 'string' ? TipoRateio[estrutura.tipoRateio as keyof typeof TipoRateio] : estrutura.tipoRateio,
                    regraLiberacao: typeof estrutura.regraLiberacao === 'string' ? RegraLiberacao[estrutura.regraLiberacao as keyof typeof RegraLiberacao] : estrutura.regraLiberacao,
                    percentualLiberacao: estrutura.percentualLiberacao,
                    parcelaLiberacao: estrutura.parcelaLiberacao
                });

                if (estrutura.niveis && estrutura.niveis.length > 0) {
                    this.treeData = this.buildTreeFromLevels(estrutura.niveis);
                    console.log('=== TREE DATA CONSTRUIDA ===');
                    console.log('TreeData:', this.treeData);
                    console.log('Total membros:', this.getTotalMembersCount());
                }
                this.loading.set(false);
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar estrutura' });
                this.router.navigate(['/comissoes/estruturas']);
            }
        });
    }

    // --- Member Search Logic ---
    searchMembers(event: any) {
        const query = event.query;
        if (this.selectedMemberType === 'usuario') {
            this.userService.list({ busca: query, size: 20 }).subscribe(users => {
                this.filteredUsers = users;
            });
        } else {
            this.teamService.list({ busca: query, size: 20 }).subscribe(teams => {
                this.filteredTeams = teams;
            });
        }
    }

    addToMemberList() {
        if (!this.selectedMemberToAdd) return;

        const isUser = this.selectedMemberType === 'usuario';
        const newItem: EstruturaComissaoMembro = {
            id: crypto.randomUUID(),
            idNivel: this.editingNode?.data.id || '',
            nome: this.selectedMemberToAdd.nome || this.selectedMemberToAdd.nomeCompleto,
            usuarioId: isUser ? this.selectedMemberToAdd.id : undefined,
            equipeId: !isUser ? this.selectedMemberToAdd.id : undefined
        };

        const exists = this.currentLevelMembers.some(m =>
            (m.usuarioId && m.usuarioId === newItem.usuarioId) ||
            (m.equipeId && m.equipeId === newItem.equipeId)
        );

        if (!exists) {
            this.currentLevelMembers = [...this.currentLevelMembers, newItem];
        }

        this.selectedMemberToAdd = null;
    }

    removeFromMemberList(index: number) {
        this.currentLevelMembers = this.currentLevelMembers.filter((_, i) => i !== index);
    }

    // --- Tree Logic ---
    private buildTreeFromLevels(levels: any[]): TreeNode[] {
        const map = new Map<string, TreeNode>();
        const roots: TreeNode[] = [];

        levels.forEach(lvl => {
            map.set(lvl.id, {
                key: lvl.id,
                label: lvl.nomeNivel,
                data: { ...lvl, membros: lvl.membros || [] },
                expanded: true,
                children: [],
                type: lvl.tipoValor === 4 ? 'bonus' : 'person'
            });
        });

        levels.forEach(lvl => {
            const node = map.get(lvl.id)!;
            if (lvl.parentId) {
                const parent = map.get(lvl.parentId);
                if (parent) {
                    parent.children?.push(node);
                } else {
                    roots.push(node);
                }
            } else {
                roots.push(node);
            }
        });

        return roots;
    }

    private generateGuid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    addRootLevel() {
        this.openLevelDialog(null);
    }

    addChildLevel(parent: TreeNode) {
        this.openLevelDialog(parent);
    }

    editLevel(node: TreeNode) {
        this.editingNode = node;
        this.parentForNewNode = null;
        this.currentLevelMembers = node.data.membros || [];

        const data = node.data;
        this.levelForm.patchValue({
            nomeNivel: data.nomeNivel,
            prioridade: data.prioridade,
            tipoValor: Number(data.tipoValor),
            percentual: data.percentual,
            valorFixo: data.valorFixo
        });

        this.displayLevelDialog = true;
    }

    deleteLevel(node: TreeNode) {
        this.treeData = this.removeNodeFromTree(this.treeData, node);
    }

    private removeNodeFromTree(nodes: TreeNode[], target: TreeNode): TreeNode[] {
        return nodes.filter(n => n !== target).map(n => {
            if (n.children) {
                n.children = this.removeNodeFromTree(n.children, target);
            }
            return n;
        });
    }

    openLevelDialog(parent: TreeNode | null) {
        this.editingNode = null;
        this.parentForNewNode = parent;
        this.currentLevelMembers = [];
        this.levelForm.reset({
            prioridade: 1,
            tipoValor: TipoValor.Percentual
        });
        this.displayLevelDialog = true;
    }

    saveLevel() {
        if (this.levelForm.invalid) {
            this.levelForm.markAllAsTouched();
            return;
        }

        const value = this.levelForm.value;
        const finalMembers = [...this.currentLevelMembers];

        if (this.editingNode) {
            this.editingNode.data = { ...this.editingNode.data, ...value, membros: finalMembers };
            this.editingNode.label = value.nomeNivel;
            this.editingNode.type = value.tipoValor === TipoValor.Misto || value.tipoValor === 4 ? 'bonus' : 'person';
        } else {
            const newNode: TreeNode = {
                key: crypto.randomUUID(),
                label: value.nomeNivel,
                data: { ...value, id: crypto.randomUUID(), membros: finalMembers },
                expanded: true,
                children: [],
                type: value.tipoValor === 4 ? 'bonus' : 'person'
            };

            if (this.parentForNewNode) {
                if (!this.parentForNewNode.children) this.parentForNewNode.children = [];
                this.parentForNewNode.children.push(newNode);
                newNode.data.parentId = this.parentForNewNode.key;
            } else {
                this.treeData = [...this.treeData, newNode];
            }
        }

        this.displayLevelDialog = false;
    }

    onSubmit() {
        if (this.form.invalid) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha o formulário corretamente.' });
            return;
        }

        if (this.treeData.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Adicione pelo menos um nível.' });
            return;
        }

        this.saving.set(true);
        const formValue = this.form.value;

        const levelsRequest = this.flattenTreeRecursive(this.treeData);

        const request: CreateEstruturaComissaoRequest = {
            ...formValue,
            niveis: levelsRequest
        };

        if (this.isEditMode()) {
            this.estruturaService.update(this.estruturaId!, { ...request, id: this.estruturaId!, versao: this.versaoAtual } as UpdateEstruturaComissaoRequest).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Atualizado com sucesso' });
                    setTimeout(() => this.router.navigate(['/comissoes/estruturas']), 1500);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao salvar' });
                    this.saving.set(false);
                }
            });
        } else {
            this.estruturaService.create(request).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Criado com sucesso' });
                    setTimeout(() => this.router.navigate(['/comissoes/estruturas']), 1500);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao salvar' });
                    this.saving.set(false);
                }
            });
        }
    }

    private flattenTreeRecursive(nodes: TreeNode[]): CreateEstruturaComissaoNivelRequest[] {
        let result: CreateEstruturaComissaoNivelRequest[] = [];

        for (const node of nodes) {
            const data = node.data;
            const req: CreateEstruturaComissaoNivelRequest = {
                nomeNivel: data.nomeNivel,
                prioridade: data.prioridade,
                tipoValor: data.tipoValor,
                percentual: data.percentual,
                valorFixo: data.valorFixo,
                parentId: data.parentId,
                membros: data.membros ? data.membros.map((m: any) => ({
                    nome: m.nome,
                    usuarioId: m.usuarioId,
                    equipeId: m.equipeId
                })) : []
            };

            result.push(req);

            if (node.children && node.children.length > 0) {
                node.children.forEach(child => child.data.parentId = node.data.id || node.key);
                result = result.concat(this.flattenTreeRecursive(node.children));
            }
        }
        return result;
    }

    cancel() {
        this.router.navigate(['/comissoes/estruturas']);
    }

    openMemberSelectionForAll() {
        this.selectedMembersForBulk = [];
        this.bulkMemberSearch = '';
        this.displayBulkMemberDialog = true;
        this.loadAllMembersForBulk();
    }

    private flattenTreeToList(nodes: TreeNode[]): TreeNode[] {
        let result: TreeNode[] = [];
        nodes.forEach(node => {
            result.push(node);
            if (node.children && node.children.length > 0) {
                result = result.concat(this.flattenTreeToList(node.children));
            }
        });
        return result;
    }

    loadAllMembersForBulk() {
        // Load all users and teams
        this.userService.list({ ativo: true }).subscribe({
            next: (result: UserListDTO[]) => {
                console.log('Users loaded:', result);
                this.allUsersForBulk = result;
                if (this.selectedBulkMemberType === 'usuario') {
                    this.filterMembersForBulk();
                }
            },
            error: (err) => {
                console.error('Error loading users:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar usuários'
                });
            }
        });

        this.teamService.list({ ativo: true }).subscribe({
            next: (result: TeamListDTO[]) => {
                console.log('Teams loaded:', result);
                this.allTeamsForBulk = result;
                if (this.selectedBulkMemberType === 'equipe') {
                    this.filterMembersForBulk();
                }
            },
            error: (err) => {
                console.error('Error loading teams:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar equipes'
                });
            }
        });
    }

    filterMembersForBulk() {
        const members = this.selectedBulkMemberType === 'usuario' ? this.allUsersForBulk : this.allTeamsForBulk;
        const { userIds, teamIds } = this.getAssignedMemberIds();

        // Filter out already assigned members
        let availableMembers = members.filter(m => {
            if (this.selectedBulkMemberType === 'usuario') {
                return !userIds.includes(m.id);
            } else {
                return !teamIds.includes(m.id);
            }
        });

        // Apply search filter
        if (!this.bulkMemberSearch) {
            this.filteredMembersForBulk = availableMembers;
        } else {
            const search = this.bulkMemberSearch.toLowerCase();
            this.filteredMembersForBulk = availableMembers.filter(m =>
                m.nome.toLowerCase().includes(search)
            );
        }
        console.log('Filtered members (excluding assigned):', this.filteredMembersForBulk.length);
    }

    toggleMemberSelection(member: UserListDTO | TeamListDTO) {
        const index = this.selectedMembersForBulk.findIndex(m => m.id === member.id);
        if (index >= 0) {
            this.selectedMembersForBulk.splice(index, 1);
        } else {
            this.selectedMembersForBulk.push(member);
        }
    }

    isMemberSelected(member: UserListDTO | TeamListDTO): boolean {
        return this.selectedMembersForBulk.some(m => m.id === member.id);
    }

    selectAllMembers() {
        this.selectedMembersForBulk = [...this.filteredMembersForBulk];
    }

    confirmBulkAssignment() {
        if (this.selectedMembersForBulk.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Atenção',
                detail: 'Selecione pelo menos um membro'
            });
            return;
        }

        // Assign selected members to ALL levels in the tree
        const allLevels = this.flattenTreeToList(this.treeData);

        allLevels.forEach(level => {
            this.selectedMembersForBulk.forEach(member => {
                const isUser = 'email' in member; // UserListDTO has email
                const newMember: CreateEstruturaComissaoMembroRequest = {
                    nome: member.nome,
                    usuarioId: isUser ? member.id : undefined,
                    equipeId: !isUser ? member.id : undefined
                };

                if (!level.data.membros) {
                    level.data.membros = [];
                }

                // Avoid duplicates
                const exists = level.data.membros.some((m: CreateEstruturaComissaoMembroRequest) =>
                    (m.usuarioId && m.usuarioId === newMember.usuarioId) ||
                    (m.equipeId && m.equipeId === newMember.equipeId)
                );

                if (!exists) {
                    level.data.membros.push(newMember);
                }
            });
        });

        this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: `${this.selectedMembersForBulk.length} membro(s) atribuído(s) a ${allLevels.length} nível(is)`
        });

        this.displayBulkMemberDialog = false;
    }
}
