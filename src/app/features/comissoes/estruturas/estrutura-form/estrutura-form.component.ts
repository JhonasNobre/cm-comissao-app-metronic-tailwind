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
import { OrgNode, countSubordinates } from '../models/org-node.model';
import { HierarchyTreeComponent } from '../components/hierarchy-tree/hierarchy-tree.component';

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
        CheckboxModule,
        HierarchyTreeComponent
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
    isEditMode = signal(false);
    estruturaId: string | null = null;
    versaoAtual: number = 0;

    // Tree Data
    treeData: TreeNode[] = [];
    selectedNode: TreeNode | null = null;
    orgData: OrgNode | null = null; // Data for the visual tree

    // Dialogs
    levelDialogVisible = false;
    bulkMemberDialogVisible = false;

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

    // Member search in level dialog
    showMemberSearch = false;

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

    // Get total UNIQUE members count across all levels
    getTotalMembersCount(): number {
        const seenIds = new Set<string>();

        const collectUnique = (node: TreeNode) => {
            if (node.data?.membros) {
                node.data.membros.forEach((m: CreateEstruturaComissaoMembroRequest) => {
                    const id = m.usuarioId || m.equipeId || m.nome;
                    if (id) seenIds.add(id);
                });
            }
            node.children?.forEach(collectUnique);
        };

        this.treeData.forEach(collectUnique);
        return seenIds.size;
    }

    // Get all members preview (first 5, unique by usuarioId/equipeId)
    getAllMembersPreview(): CreateEstruturaComissaoMembroRequest[] {
        const allMembers: CreateEstruturaComissaoMembroRequest[] = [];
        const seenIds = new Set<string>();

        const collectMembers = (node: TreeNode) => {
            if (node.data?.membros) {
                node.data.membros.forEach((m: CreateEstruturaComissaoMembroRequest) => {
                    const id = m.usuarioId || m.equipeId || m.nome;
                    if (id && !seenIds.has(id)) {
                        seenIds.add(id);
                        allMembers.push(m);
                    }
                });
            }
            node.children?.forEach(collectMembers);
        };
        this.treeData.forEach(collectMembers);
        return allMembers.slice(0, 5);
    }

    // Count all levels including children
    countAllLevels(): number {
        let count = 0;
        const countRecursive = (node: TreeNode) => {
            count++;
            node.children?.forEach(countRecursive);
        };
        this.treeData.forEach(countRecursive);
        return count;
    }

    // Get label for Tipo de Comissão
    getTipoComissaoLabel(): string {
        const value = this.form?.get('tipoComissao')?.value;
        const option = this.tipoComissaoOptions.find(o => o.value === value);
        return option?.label || '-';
    }

    // Get label for Tipo de Rateio
    getTipoRateioLabel(): string {
        const value = this.form?.get('tipoRateio')?.value;
        const option = this.tipoRateioOptions.find(o => o.value === value);
        return option?.label || '-';
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

    ngOnInit() {
        this.initForm();
        this.initLevelForm();
        this.loadEmpresas();

        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.estruturaId = id;
                this.isEditMode.set(true);
                this.loadEstrutura(this.estruturaId);
            } else {
                this.initializeTree();
            }
        });

        this.loadForm();
    }

    initializeTree() {
        this.treeData = [{
            label: 'Nível 1',
            expanded: true,
            data: {
                id: crypto.randomUUID(),
                prioridade: 1,
                nome: 'Nível 1',
                tipoComissao: TipoComissao.Percentual,
                valor: 0,
                regraLiberacao: RegraLiberacao.Diretamente,
                membros: []
            },
            children: []
        }];
        this.updateTreeData();
    }

    updateTreeData() {
        this.treeData = [...this.treeData]; // Trigger change detection
    }

    loadForm() {
        if (this.isEditMode()) {
            this.form.patchValue({
                // ... patch values if needed, usually handled in loadEstrutura
            });
        }
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
            prioridade: [1, [Validators.required, Validators.min(1)]], // Nº de Parcelas
            tipoValor: [TipoValor.Percentual, [Validators.required]],
            percentual: [null, [Validators.min(0), Validators.max(100)]],
            valorFixo: [null, [Validators.min(0)]],
            tipoComissao: [null], // Visual alignment
            regraLiberacao: [null], // Visual alignment
            prioridadePagamento: [null], // Visual alignment
            parentId: [null] // Hidden field to track parent
        });
    }

    private loadEmpresas() {
        // Pega a empresa do contexto logado automaticamente
        const empresaAtual = this.empresaSelectorService.getEmpresaAtual();
        if (empresaAtual && !this.estruturaId) {
            this.form.patchValue({ idEmpresa: empresaAtual.id });
        }

        // Subscribe para atualizar se mudar a empresa selecionada
        this.empresaSelectorService.selectedEmpresaIds$.subscribe(ids => {
            if (ids.length > 0 && !this.estruturaId) {
                this.form.patchValue({ idEmpresa: ids[0] });
            }
        });
    }

    loadEstrutura(id: string) {
        this.loading.set(true);
        this.estruturaService.getById(id).subscribe({
            next: (estrutura) => {
                console.log('=== [DEBUG] STRUCTURE LOADED FROM API ===');
                console.log('API Response:', estrutura);
                console.log('Levels (Raw):', estrutura.niveis);

                if (estrutura.niveis) {
                    estrutura.niveis.forEach((n: any, i: number) => {
                        console.log(`[DEBUG] Level ${i}:`, {
                            nome: n.nomeNivel,
                            id: n.id,
                            parentId: n.parentId,
                            memberCount: n.membros?.length || 0,
                            membros: n.membros
                        });
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
                    this.updateOrgTreeData();
                    console.log('=== [DEBUG] TREE DATA BUILT ===');
                    console.log('TreeNode Structure:', this.treeData);
                    console.log('Visual OrgData:', this.orgData);
                    console.log('Total Unique Members:', this.getTotalMembersCount());
                } else {
                    console.warn('=== [DEBUG] NO LEVELS FOUND IN STRUCTURE ===');
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

    // Convert TreeNode[] to OrgNode for the visual hierarchy tree
    // The diagram starts directly from the hierarchy levels (no virtual root)
    private updateOrgTreeData(): void {
        if (this.treeData.length === 0) {
            this.orgData = null;
            return;
        }

        // Use the first root level as the main root of the org chart
        const firstRoot = this.treeData[0];
        this.orgData = this.convertTreeNodeToOrgNode(firstRoot, true, 1);

        // If there are more root levels, add them as siblings (children of the first root at visual level)
        if (this.treeData.length > 1) {
            const additionalRoots = this.treeData.slice(1).map(node => this.convertTreeNodeToOrgNode(node, false, 1));
            // Insert additional roots alongside the first root's children
            this.orgData.children = [...(this.orgData.children || []), ...additionalRoots];
        }
    }

    private convertTreeNodeToOrgNode(node: TreeNode, isFirst: boolean, level: number): OrgNode {
        const membros = node.data?.membros || [];
        const isBonus = node.type === 'bonus';

        // Display Logic matching Figma:
        // Name = Node Label (e.g., "Imobiliária")
        // Role = "Nível Hierárquico X" OR Member Name if multiple?
        // Actually, based on user feedback:
        // Top Line (Name) -> "Imobiliária" (Level Name)
        // Bottom Line (Role) -> "Nível Hierárquico 1" (Level Description)

        // However, if there are specific members, we might want to show the first member?
        // The user complained about the DEFAULT state when creating a level.
        // In that state, there are NO members.

        let name = node.label || 'Sem nome';
        let role = `Nível Hierárquico ${level}`;

        // If there are members, we might want to show the "Lead" member? 
        // Or keep showing the Level Name?
        // The current implementation showed: memberName as Name, node.label as Role.
        // If members exist: Name="Jhonas", Role="Imobiliária"
        // If NO members: Name="Imobiliária", Role="Imobiliária" (Duplicate!)

        const firstMember = membros[0];
        if (firstMember) {
            name = firstMember.nome;
            role = node.label || `Nível Hierárquico ${level}`;
        }

        const children = node.children?.map(child => this.convertTreeNodeToOrgNode(child, false, level + 1)) || [];

        return {
            id: node.key || '',
            name: name,
            role: role,
            people: membros.length, // Only count members of THIS level, not children
            first: isFirst,
            last: children.length === 0,
            isBonus: isBonus,
            children: children.length > 0 ? children : undefined
        };
    }

    private countChildrenMembers(node: TreeNode): number {
        if (!node.children) return 0;
        return node.children.reduce((acc, child) => {
            const childMembros = child.data?.membros?.length || 0;
            return acc + childMembros + this.countChildrenMembers(child);
        }, 0);
    }

    // Handler for adding subordinates from the visual tree
    onAddSubordinatesFromTree(node: OrgNode): void {
        // Find the corresponding TreeNode
        const treeNode = this.findTreeNodeById(this.treeData, node.id);
        if (treeNode) {
            this.openBulkMemberDialog(treeNode);
        }
    }

    // Handler for removing a node from the visual tree
    onRemoveFromTree(node: OrgNode): void {
        const treeNode = this.findTreeNodeById(this.treeData, node.id);
        if (treeNode) {
            this.deleteLevel(treeNode);
            this.updateOrgTreeData();
        }
    }

    private findTreeNodeById(nodes: TreeNode[], id: string): TreeNode | null {
        for (const node of nodes) {
            if (node.key === id) return node;
            if (node.children) {
                const found = this.findTreeNodeById(node.children, id);
                if (found) return found;
            }
        }
        return null;
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
        this.showMemberSearch = false;

        const data = node.data;
        this.levelForm.patchValue({
            nomeNivel: data.nomeNivel,
            prioridade: data.prioridade,
            tipoValor: Number(data.tipoValor) || TipoValor.Percentual,
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

    // --- Bulk Member Logic ---
    openBulkMemberDialog(parentNode: TreeNode | null) {
        this.parentForNewNode = parentNode;
        this.selectedMembersForBulk = [];
        this.bulkMemberSearch = '';
        this.selectedBulkMemberType = 'usuario';

        // Load initial list if empty
        if (this.allUsersForBulk.length === 0) {
            this.userService.list({ size: 100 }).subscribe(users => {
                this.allUsersForBulk = users;
                this.filterMembersForBulk();
            });
            this.teamService.list({ size: 100 }).subscribe(teams => {
                this.allTeamsForBulk = teams;
            });
        } else {
            this.filterMembersForBulk();
        }

        this.displayBulkMemberDialog = true;
    }

    // Grouped members for display
    groupedMembersForBulk: { name: string, members: UserListDTO[] }[] = [];

    // Helper to get all active member IDs from the tree
    getAllActiveMemberIds(): Set<string> {
        const activeIds = new Set<string>();

        const traverse = (nodes: TreeNode[]) => {
            nodes.forEach(node => {
                if (node.data && node.data.membros) {
                    node.data.membros.forEach((m: EstruturaComissaoMembro) => {
                        if (m.usuarioId) activeIds.add(m.usuarioId);
                        if (m.equipeId) activeIds.add(m.equipeId);
                        // Also add the ID itself if no specific user/team ID (legacy or direct link)
                        if (!m.usuarioId && !m.equipeId && m.id) activeIds.add(m.id);
                    });
                }
                if (node.children) {
                    traverse(node.children);
                }
            });
        };

        traverse(this.treeData);
        return activeIds;
    }

    filterMembersForBulk() {
        const query = this.bulkMemberSearch.toLowerCase();
        const activeIds = this.getAllActiveMemberIds();

        if (this.selectedBulkMemberType === 'usuario') {
            // Filter users: Match name AND not in active list
            const filteredUsers = this.allUsersForBulk.filter(u =>
                (u.nome || '').toLowerCase().includes(query) && !activeIds.has(u.id)
            );
            this.filteredMembersForBulk = filteredUsers;

            // Group Layout Logic
            const groups: { [teamName: string]: UserListDTO[] } = {};
            const teamMap = new Map<string, string>();

            this.allTeamsForBulk.forEach(t => teamMap.set(t.id, t.nome));

            filteredUsers.forEach(user => {
                const userTeams = user.equipes || (user as any).equipeIds || [];

                if (userTeams.length === 0) {
                    const key = 'Sem Equipe';
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(user);
                } else {
                    userTeams.forEach((teamVal: any) => {
                        const val = typeof teamVal === 'object' ? (teamVal.id || teamVal.equipeId || teamVal.nome) : teamVal;
                        let teamName = teamMap.get(val);
                        if (!teamName) teamName = val;
                        if (!teamName) teamName = 'Equipe Desconhecida';

                        if (!groups[teamName]) groups[teamName] = [];
                        groups[teamName].push(user);
                    });
                }
            });

            this.groupedMembersForBulk = Object.keys(groups).sort().map(name => ({
                name,
                members: groups[name]
            }));

        } else {
            // Filter teams: Match name AND not in active list
            this.filteredMembersForBulk = this.allTeamsForBulk.filter(t =>
                (t.nome || '').toLowerCase().includes(query) && !activeIds.has(t.id)
            );
            this.groupedMembersForBulk = [];
        }
    }

    isTeam(member: any): boolean {
        return !!member && 'quantidadeUsuarios' in member;
    }

    toggleBulkMemberSelection(member: any) {
        const index = this.selectedMembersForBulk.findIndex(m => m.id === member.id);
        if (index >= 0) {
            this.selectedMembersForBulk = this.selectedMembersForBulk.filter(m => m.id !== member.id);
        } else {
            this.selectedMembersForBulk = [...this.selectedMembersForBulk, member];
        }
    }

    isBulkMemberSelected(member: any): boolean {
        return this.selectedMembersForBulk.some(m => m.id === member.id);
    }

    toggleAllBulkMembers() {
        if (this.selectedMembersForBulk.length === this.filteredMembersForBulk.length) {
            this.selectedMembersForBulk = [];
        } else {
            this.selectedMembersForBulk = [...this.filteredMembersForBulk];
        }
    }

    saveBulkMembers() {
        if (this.selectedMembersForBulk.length === 0) return;

        // Create member objects from selections
        const newMembers: EstruturaComissaoMembro[] = this.selectedMembersForBulk.map(m => ({
            id: crypto.randomUUID(),
            idNivel: this.parentForNewNode?.data?.id || '',
            nome: (m as any).nome,
            usuarioId: this.selectedBulkMemberType === 'usuario' ? m.id : undefined,
            equipeId: this.selectedBulkMemberType === 'equipe' ? m.id : undefined
        }));

        if (this.parentForNewNode) {
            // Add members to the existing level (not as a new child level)
            if (!this.parentForNewNode.data.membros) {
                this.parentForNewNode.data.membros = [];
            }

            // Add new members to the parent node's member list
            this.parentForNewNode.data.membros.push(...newMembers);

            this.messageService.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: `${newMembers.length} integrante(s) adicionado(s) ao nível "${this.parentForNewNode.label}"`
            });
        } else {
            // If no parent is selected, show an error - members must belong to a level
            this.messageService.add({
                severity: 'warn',
                summary: 'Atenção',
                detail: 'Selecione um nível para adicionar os integrantes.'
            });
            return;
        }

        this.updateOrgTreeData();
        this.displayBulkMemberDialog = false;
        this.selectedMembersForBulk = [];
    }

    openLevelDialog(parent: TreeNode | null) {
        this.editingNode = null;
        this.parentForNewNode = parent;
        this.currentLevelMembers = [];
        this.showMemberSearch = false;
        this.levelForm.reset({
            prioridade: 1,
            tipoValor: TipoValor.Percentual,
            parentId: parent ? parent.key : null
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
        const isBonus = value.tipoComissao === TipoComissao.Bonus;

        if (this.editingNode) {
            this.editingNode.data = { ...this.editingNode.data, ...value, membros: finalMembers };
            this.editingNode.label = value.nomeNivel;
            this.editingNode.type = isBonus ? 'bonus' : 'person';
        } else {
            // Create consistent ID for the new node
            const newId = crypto.randomUUID();

            const newNode: TreeNode = {
                key: newId,
                label: value.nomeNivel,
                data: { ...value, id: newId, membros: finalMembers },
                expanded: true,
                children: [],
                type: isBonus ? 'bonus' : 'person'
            };
            // NEW: use form's parentId to be robust
            const targetParentId = value.parentId;

            // Try to find parent by ID if parentForNewNode is missing but parentId exists
            let targetParent = this.parentForNewNode;
            if (!targetParent && targetParentId) {
                targetParent = this.findTreeNodeById(this.treeData, targetParentId);

                if (!targetParent) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erro de Hierarquia',
                        detail: 'O nível pai selecionado não foi encontrado.'
                    });
                    return;
                }
            }

            if (targetParent) {
                if (!targetParent.children) targetParent.children = [];
                targetParent.children.push(newNode);
                // Use data.id for safer persistence link
                newNode.data.parentId = targetParent.data.id;
            } else {
                // Se não tem pai, garante que o parentId seja nulo para persistência
                newNode.data.parentId = null;
                this.treeData = [...this.treeData, newNode];
            }
        }

        this.updateOrgTreeData();
        this.displayLevelDialog = false;

        // Show success message for bonus
        if (isBonus) {
            this.messageService.add({
                severity: 'success',
                summary: 'Sucesso!',
                detail: 'Bônus criado.'
            });
        }
    }

    onSubmit() {
        if (this.form.invalid) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha o formulário corretamente.' });
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
                id: data.id,
                nomeNivel: data.nomeNivel,
                prioridade: data.prioridade,
                tipoValor: data.tipoValor || TipoValor.Percentual,
                percentual: data.percentual,
                valorFixo: data.valorFixo,
                parentId: data.parentId,
                membros: data.membros ? data.membros.map((m: any) => ({
                    id: m.id,
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


}
