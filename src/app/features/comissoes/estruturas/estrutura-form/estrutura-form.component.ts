import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
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
import { OrigemPagamentoService } from '../../../bonificacao/origem-pagamento/services/origem-pagamento.service';
import {
    TipoComissao, TipoComissaoLabels,
    TipoRateio, TipoRateioLabels,
    RegraLiberacao, RegraLiberacaoLabels,
    TipoValor, TipoValorLabels,
    TipoBonificacao, TipoBonificacaoLabels,
    EFormaCalculoBonificacao,
    StatusComissao
} from '../../models/enums';
import { EstruturaComissaoMembro, CreateEstruturaComissaoNivelRequest, CreateEstruturaComissaoRequest, UpdateEstruturaComissaoRequest } from '../../models/estrutura-comissao.model';
import { TeamService } from '../../../../features/teams/services/team.service';
import { EstruturaComissaoService } from '../../services/estrutura-comissao.service';
import { UserService } from '../../../../features/users/services/user.service';
import { UserListDTO } from '../../../../features/users/models/user.model';
import { TeamListDTO } from '../../../../features/teams/models/team.model';
import { EmpresaSelectorService } from '../../../../core/services/empresa-selector.service';
import { HierarchyTreeComponent } from '../components/hierarchy-tree/hierarchy-tree.component';

import { OrgNode } from '../models/org-node.model';

@Component({
    selector: 'app-estrutura-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
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
    templateUrl: './estrutura-form.component.html',
    providers: [MessageService]
})
export class EstruturaFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private messageService = inject(MessageService);
    private route = inject(ActivatedRoute);
    public router = inject(Router);
    private teamService = inject(TeamService);
    private origemPagamentoService = inject(OrigemPagamentoService);
    private estruturaService = inject(EstruturaComissaoService);
    private userService = inject(UserService);
    private empresaSelectorService = inject(EmpresaSelectorService);

    // State
    estruturaId: string | null = null;
    isEditMode: WritableSignal<boolean> = signal(false);
    loading = signal(false);
    saving = signal(false);
    versaoAtual: number = 1;

    // Forms
    form!: FormGroup;
    levelForm!: FormGroup;

    // Tree Data
    treeData: TreeNode[] = [];
    orgData: OrgNode[] = [];

    // Auxiliary UI State
    showMemberSearch: boolean = false;
    displayLevelDialog: boolean = false;
    displayBulkMemberDialog: boolean = false;
    bulkMemberSearch: string = '';

    // Member Selection State
    selectedMemberType: string = 'usuario'; // 'usuario' | 'equipe'
    selectedBulkMemberType: string = 'usuario';
    filteredUsers: UserListDTO[] = [];
    filteredTeams: TeamListDTO[] = [];
    allUsersForBulk: UserListDTO[] = [];
    allTeamsForBulk: TeamListDTO[] = [];
    filteredMembersForBulk: any[] = [];
    selectedMembersForBulk: any[] = [];

    // Node Editing State
    editingNode: TreeNode | null = null;
    parentForNewNode: TreeNode | null = null; // Agora representa o NÍVEL onde as pessoas entrarão
    currentLevelMembers: any[] = [];
    selectedMemberToAdd: any;

    // Gestor State
    membroGestorIdForNewMember: string | null = null;
    membrosDisponiveisParaGestor: { label: string, value: string }[] = [];


    // Enums for template access
    TipoComissao = TipoComissao;
    TipoRateio = TipoRateio;
    RegraLiberacao = RegraLiberacao;
    TipoValor = TipoValor;
    TipoBonificacao = TipoBonificacao;

    // Options
    tipoComissaoOptions = Object.entries(TipoComissaoLabels).map(([value, label]) => ({
        label,
        value: Number(value)
    }));

    tipoBonificacaoOptions = Object.entries(TipoBonificacaoLabels).map(([value, label]) => ({
        label,
        value: Number(value)
    }));

    tipoValorOptions = Object.entries(TipoValorLabels).map(([value, label]) => ({
        label,
        value: Number(value)
    }));

    regraLiberacaoOptions = Object.entries(RegraLiberacaoLabels).map(([value, label]) => ({
        label,
        value: Number(value)
    }));

    // Origens de Pagamento
    origensPagamento: { label: string; value: string }[] = [];

    getTotalMembersCount(): number {
        // Implementação básica se necessário
        return 0;
    }

    ngOnInit() {
        this.initForm();
        this.initLevelForm();
        this.loadEmpresas();

        // Subscribe to empresa changes to load Payment Origins
        this.form.get('idEmpresa')?.valueChanges.subscribe(id => {
            if (id) this.loadOrigensPagamento(id);
        });

        // Carregar origens imediatamente se empresa já definida
        const empresaId = this.form.get('idEmpresa')?.value;

        if (empresaId) {
            this.loadOrigensPagamento(empresaId);
        }

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

    loadOrigensPagamento(idEmpresa: string) {

        this.origemPagamentoService.getAll(idEmpresa, true).subscribe(origens => {

            this.origensPagamento = origens.map(o => ({
                label: o.nome,
                value: o.id
            }));
        });
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
            // Logic handled in loadEstrutura
        }
    }

    private initLevelForm() {
        this.levelForm = this.fb.group({
            nomeNivel: ['', [Validators.required, Validators.maxLength(50)]],
            prioridade: [1, [Validators.required, Validators.min(1)]],
            tipoValor: [TipoValor.Percentual, [Validators.required]],
            percentual: [null, [Validators.min(0), Validators.max(100)]],
            valorFixo: [null, [Validators.min(0)]],
            tipoComissao: [null, [Validators.required]],
            regraLiberacao: [null, [Validators.required]],
            prioridadePagamento: [null],
            parentId: [null],
            // Campos de Bônus
            tipoBonificacao: [null],
            origemPagamentoId: [null],
            metaVendasMinima: [null],
            parcelaInicialLiberacao: [null],
            liberacaoAutomaticaQuitacao: [false],
            numeroParcelas: [null]
        });

        // Watch TipoComissao changes to handle validation and mapping
        this.levelForm.get('tipoComissao')?.valueChanges.subscribe(val => {
            const tipoBonificacaoControl = this.levelForm.get('tipoBonificacao');
            const origemControl = this.levelForm.get('origemPagamentoId');
            const tipoValorControl = this.levelForm.get('tipoValor');
            const numericVal = Number(val);

            // Mapping Logic: TipoComissao -> TipoValor & TipoBonificacao
            if (numericVal === TipoComissao.Percentual) {
                tipoValorControl?.setValue(TipoValor.Percentual);
                tipoBonificacaoControl?.setValue(null);
            } else if (numericVal === TipoComissao.ValorFixo) {
                tipoValorControl?.setValue(TipoValor.Fixo);
                tipoBonificacaoControl?.setValue(null);
            } else if (numericVal === TipoComissao.Misto) {
                tipoValorControl?.setValue(TipoValor.Misto);
                tipoBonificacaoControl?.setValue(null);
            } else if (numericVal === TipoComissao.BonusPorPercentual) {
                tipoValorControl?.setValue(TipoValor.Percentual);
                tipoBonificacaoControl?.setValue(TipoBonificacao.PorParcelamento);
            } else if (numericVal === TipoComissao.BonusLivre) {
                tipoValorControl?.setValue(TipoValor.Fixo);
                tipoBonificacaoControl?.setValue(TipoBonificacao.Livre);
            } else if (numericVal === TipoComissao.BonusMeta) {
                tipoValorControl?.setValue(TipoValor.Fixo);
                tipoBonificacaoControl?.setValue(TipoBonificacao.PorMeta);
            }

            // Validation Logic
            if (numericVal >= TipoComissao.BonusPorPercentual) {
                // tipoBonificacao não é mais necessário, pois foi setado acima
                origemControl?.setValidators([Validators.required]);
            } else {
                // tipoBonificacaoControl?.clearValidators(); // Already set to null
                origemControl?.clearValidators();
            }
            tipoBonificacaoControl?.updateValueAndValidity();
            origemControl?.updateValueAndValidity();
        });

    }

    onAddSubordinatesFromTree(node: OrgNode) {
        // Se a pessoa clicou num membro para adicionar um subordinado a ele
        // 'node' é o membro. Devemos abrir o modal de adicionar integrantes,
        // pré-selecionando ele como gestor.
        // Mas também precisamos que o usuário informe em QUAL NÍVEL o novo 
        // integrante vai entrar (já que não selecionou na esquerda).
        this.openBulkMemberDialog(null, node.id);
    }

    onEditFromTree(node: OrgNode) {
        let treeNode = this.findTreeNodeById(this.treeData, node.id);

        if (!treeNode) {
            treeNode = this.findTreeNodeByMemberId(this.treeData, node.id);
        }

        if (treeNode) {
            this.editLevel(treeNode);
        }
    }

    onAddMembersFromTree(node: OrgNode) {
        let treeNode = this.findTreeNodeById(this.treeData, node.id);

        if (!treeNode) {
            treeNode = this.findTreeNodeByMemberId(this.treeData, node.id);
        }

        if (treeNode) {
            this.openBulkMemberDialog(treeNode);
        } else {
            this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: 'Não foi possível localizar o nível correspondente na estrutura.'
            });
        }
    }

    onRemoveFromTree(node: OrgNode) {
        // Primeiro tenta encontrar como um nível (TreeNode)
        const treeNode = this.findTreeNodeById(this.treeData, node.id);
        if (treeNode) {
            this.deleteLevel(treeNode);
            this.updateOrgTreeData();
            return;
        }

        // Se não encontrou como nível, pode ser um membro individual
        // Procura o membro em todos os níveis e remove
        const removed = this.removeMemberFromTree(this.treeData, node.id);
        if (removed) {
            this.updateOrgTreeData();
            this.messageService.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: `"${node.name}" foi removido da estrutura.`
            });
        }
    }

    private removeMemberFromTree(nodes: TreeNode[], memberId: string): boolean {
        for (const node of nodes) {
            if (node.data?.membros) {
                const index = node.data.membros.findIndex((m: any) => m.id === memberId);
                if (index >= 0) {
                    node.data.membros.splice(index, 1);
                    return true;
                }
            }
            if (node.children && this.removeMemberFromTree(node.children, memberId)) {
                return true;
            }
        }
        return false;
    }

    private findTreeNodeById(nodes: TreeNode[], id: string): TreeNode | null {
        for (const node of nodes) {
            if (node.key === id || node.data?.id === id) return node;
            if (node.children) {
                const found = this.findTreeNodeById(node.children, id);
                if (found) return found;
            }
        }
        return null;
    }

    private findTreeNodeByMemberId(nodes: TreeNode[], memberId: string): TreeNode | null {
        for (const node of nodes) {
            if (node.data?.membros) {
                const hasMember = node.data.membros.some((m: any) => m.id === memberId);
                if (hasMember) return node;
            }
            if (node.children) {
                const found = this.findTreeNodeByMemberId(node.children, memberId);
                if (found) return found;
            }
        }
        return null;
    }


    private initForm() {
        this.form = this.fb.group({
            idEmpresa: [null, [Validators.required]],
            nome: ['', [Validators.required, Validators.maxLength(100)]],
            descricao: ['', [Validators.maxLength(500)]],
            status: ['Ativo', [Validators.required]],
            tipoComissao: [TipoComissao.Percentual],
            valorComissao: [null, [Validators.min(0)]],
            gerarAutomaticamente: [false]
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
                console.log(estrutura)
                if (estrutura.niveis) {
                    estrutura.niveis.forEach((n: any, i: number) => {

                    });
                }

                this.versaoAtual = estrutura.versao;
                this.form.patchValue({
                    idEmpresa: estrutura.idEmpresa,
                    nome: estrutura.nome,
                    descricao: estrutura.descricao,
                    status: estrutura.ativo ? 'Ativo' : 'Inativo',
                    tipoComissao: typeof estrutura.tipoComissao === 'string' ? TipoComissao[estrutura.tipoComissao as keyof typeof TipoComissao] : (estrutura.tipoComissao ?? TipoComissao.Percentual),
                    valorComissao: estrutura.valorComissao ?? 0,
                    gerarAutomaticamente: estrutura.gerarAutomaticamente ?? false
                });

                if (estrutura.niveis && estrutura.niveis.length > 0) {
                    this.treeData = this.buildTreeFromLevels(estrutura.niveis);
                    this.updateOrgTreeData();
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
        // Níveis agora são apenas uma lista flat, sem hierarquia entre si.
        return levels.map(lvl => ({
            key: lvl.id,
            label: lvl.nomeNivel,
            data: { ...lvl, membros: lvl.membros || [] },
            expanded: true,
            children: [], // Níveis não têm mais filhos (subníveis)
            type: (lvl.tipoComissao >= TipoComissao.BonusPorPercentual || lvl.tipoComissao >= 4 || lvl.tipoBonificacao || lvl.TipoBonificacao) ? 'bonus' : 'person'
        }));
    }

    // Convert flatten list of Levels and their Members into OrgNode[]
    private updateOrgTreeData(): void {
        if (this.treeData.length === 0) {
            this.orgData = [];
            return;
        }

        const allMembros: any[] = [];
        const membroMap = new Map<string, any>();
        const rolesMap = new Map<string, string>(); // membro.id -> roleName
        const isBonusMap = new Map<string, boolean>();

        // 1. Extrair todos os membros
        this.treeData.forEach(lvl => {
            const isBonus = lvl.type === 'bonus' || lvl.data?.tipoComissao >= TipoComissao.BonusPorPercentual || lvl.data?.tipoComissao >= 4;
            const role = isBonus ? 'Bônus' : (lvl.label || 'Sem nome');

            if (lvl.data && lvl.data.membros) {
                lvl.data.membros.forEach((m: any) => {
                    // Garantir que os campos vitais existam
                    m.nivelId = lvl.data.id;
                    allMembros.push(m);
                    membroMap.set(m.id, m);
                    rolesMap.set(m.id, role);
                    isBonusMap.set(m.id, isBonus);
                });
            }
        });

        const roots: OrgNode[] = [];
        const orgNodeMap = new Map<string, OrgNode>();

        // 2. Criar os OrgNodes
        allMembros.forEach(m => {
            const orgNode: OrgNode = {
                id: m.id,
                name: m.nome,
                role: rolesMap.get(m.id) || '',
                people: 0,
                first: false,
                last: false,
                isBonus: isBonusMap.get(m.id) || false,
                avatar: m.fotoUrl || null,
                children: []
            };
            orgNodeMap.set(m.id, orgNode);
        });

        // 3. Montar a hierarquia via membroGestorId
        allMembros.forEach(m => {
            const node = orgNodeMap.get(m.id)!;
            if (m.membroGestorId && orgNodeMap.has(m.membroGestorId)) {
                // Adiciona como filho do gestor
                const gestorNode = orgNodeMap.get(m.membroGestorId)!;
                if (!gestorNode.children) gestorNode.children = [];
                gestorNode.children.push(node);
            } else {
                // Sem pai = raiz
                roots.push(node);
            }
        });

        // Função recursiva para atualizar contagem e status
        const updateHierarchyMetadata = (nodes: OrgNode[], isRoot: boolean) => {
            nodes.forEach((node, index) => {
                node.first = isRoot && index === 0;
                node.last = !node.children || node.children.length === 0;

                if (node.children && node.children.length > 0) {
                    updateHierarchyMetadata(node.children, false);
                    node.people = this.countDescendants(node.children);
                } else {
                    node.people = 0;
                    node.children = undefined;
                }
            });
        };

        updateHierarchyMetadata(roots, true);
        this.orgData = roots;
    }

    private countDescendants(nodes: OrgNode[]): number {
        return nodes.reduce((acc, node) => {
            const childCount = node.children ? this.countDescendants(node.children) : 0;
            return acc + 1 + childCount;
        }, 0);
    }

    private countChildrenMembers(node: TreeNode): number {
        if (!node.children) return 0;
        return node.children.reduce((acc, child) => {
            const childMembros = child.data?.membros?.length || 0;
            return acc + childMembros + this.countChildrenMembers(child);
        }, 0);
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

    // Removido addChildLevel pois a árvore de Níveis é flat

    editLevel(node: TreeNode) {
        this.editingNode = node;
        this.parentForNewNode = null;
        this.currentLevelMembers = node.data.membros || [];
        this.showMemberSearch = false;

        const data = node.data;

        // Helper to parse potential string enums
        const parseTipoValor = (val: any): number => {
            if (typeof val === 'number') return val;
            if (val === 'Percentual') return TipoValor.Percentual;
            if (val === 'Fixo' || val === 'ValorFixo') return TipoValor.Fixo;
            if (val === 'Misto') return TipoValor.Misto;
            return Number(val) || TipoValor.Percentual;
        };

        const resolvedTipoValorVal = data.tipoValor ?? data.TipoValor;
        const resolvedTipoValor = parseTipoValor(resolvedTipoValorVal);
        const inferredTipoComissao = this.inferTipoComissao(data, resolvedTipoValor);

        const parseRegraLiberacao = (val: any): number => {
            const root = RegraLiberacao.Diretamente;
            if (!val) return root;
            if (typeof val === 'number') return val;
            if (val === 'Diretamente') return RegraLiberacao.Diretamente;
            if (val === 'Percentual' || val === 'PercentualPago') return RegraLiberacao.Percentual;
            if (val === 'Parcela' || val === 'ParcelasPagas') return RegraLiberacao.Parcela;
            return Number(val) || root;
        };

        const regraLiberacaoVal = data.regraLiberacao ?? data.RegraLiberacao;
        const regraLiberacao = parseRegraLiberacao(regraLiberacaoVal);

        const tipoBonificacao = data.tipoBonificacao ?? data.TipoBonificacao;
        const prioridadePagamento = data.prioridadePagamento ?? data.PrioridadePagamento;
        const parcelaInicialLiberacao = data.parcelaInicialLiberacao ?? data.ParcelaInicialLiberacao;
        const metaVendasMinima = data.metaVendasMinima ?? data.MetaVendasMinima;
        const origemPagamentoId = data.origemPagamentoId ?? data.OrigemPagamentoId;
        const liberacaoAutomatica = data.liberacaoAutomaticaQuitacao ?? data.LiberacaoAutomaticaQuitacao;

        this.levelForm.patchValue({
            nomeNivel: data.nomeNivel ?? data.NomeNivel,
            prioridade: data.prioridade ?? data.Prioridade,
            tipoValor: resolvedTipoValor,
            percentual: data.percentual ?? data.Percentual,
            valorFixo: data.valorFixo ?? data.ValorFixo,
            tipoComissao: inferredTipoComissao,
            regraLiberacao: regraLiberacao,
            prioridadePagamento: prioridadePagamento ?? 2,
            tipoBonificacao: tipoBonificacao ? Number(tipoBonificacao) : null,
            origemPagamentoId: origemPagamentoId,
            metaVendasMinima: metaVendasMinima,
            parcelaInicialLiberacao: parcelaInicialLiberacao,
            liberacaoAutomaticaQuitacao: !!liberacaoAutomatica,
            numeroParcelas: data.numeroParcelas ?? data.NumeroParcelas
        }, { emitEvent: false });


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
    openBulkMemberDialog(parentNode: TreeNode | null, gestorPreSelecionadoId?: string) {
        this.parentForNewNode = parentNode;
        this.selectedMembersForBulk = [];
        this.bulkMemberSearch = '';
        this.selectedBulkMemberType = 'usuario';
        this.membroGestorIdForNewMember = gestorPreSelecionadoId || null;

        // Preencher a lista de gestores potenciais (qualquer membro já alocado)
        const allActive = this.getAllActiveMembersDetail();
        this.membrosDisponiveisParaGestor = allActive.map(m => ({
            label: `${m.nome} (${m.levelName})`,
            value: m.id
        }));

        // Load initial list se vazio
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

    getAllActiveMembersDetail(): { id: string, nome: string, levelName: string }[] {
        const details: { id: string, nome: string, levelName: string }[] = [];
        this.treeData.forEach(node => {
            if (node.data && node.data.membros) {
                node.data.membros.forEach((m: any) => {
                    details.push({
                        id: m.id,
                        nome: m.nome,
                        levelName: node.label || 'Nível'
                    });
                });
            }
        });
        return details;
    }

    // Helper to get all active member IDs from the tree
    getAllActiveMemberIds(): Set<string> {
        const activeIds = new Set<string>();
        this.getAllActiveMembersDetail().forEach(d => activeIds.add(d.id));
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
            // Remove o membro (usando filter para criar novo array)
            this.selectedMembersForBulk = this.selectedMembersForBulk.filter(m => m.id !== member.id);
        } else {
            // Adiciona apenas se não existir (evita duplicatas)
            if (!this.selectedMembersForBulk.some(m => m.id === member.id)) {
                this.selectedMembersForBulk = [...this.selectedMembersForBulk, member];
            }
        }
    }

    isBulkMemberSelected(member: any): boolean {
        return this.selectedMembersForBulk.some(m => m.id === member.id);
    }

    toggleAllBulkMembers() {
        // Verifica se TODOS os membros únicos estão selecionados
        const allSelected = this.filteredMembersForBulk.every(m =>
            this.selectedMembersForBulk.some(s => s.id === m.id)
        );

        if (allSelected) {
            // Desmarca todos
            this.selectedMembersForBulk = [];
        } else {
            // Seleciona todos (usa filteredMembersForBulk que é a lista única sem duplicatas)
            this.selectedMembersForBulk = [...this.filteredMembersForBulk];
        }
    }

    saveBulkMembers() {
        if (this.selectedMembersForBulk.length === 0) return;

        // Se o usuário iniciou o modal vazio (ex: clicou num membro pra add subordinado),
        // ele DEVE ter um nível de destino. Como ainda não fizemos um dropdown de nível no modal,
        // garantimos que o parentForNewNode exista (veremos isso no HTML depois, forçando a seleção de nível caso seja null).
        if (!this.parentForNewNode) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Atenção',
                detail: 'Selecione em qual nível hierárquico estes integrantes entrarão.'
            });
            return;
        }

        // Create member objects from selections
        const newMembers: EstruturaComissaoMembro[] = this.selectedMembersForBulk.map(m => ({
            id: crypto.randomUUID(),
            idNivel: this.parentForNewNode!.data?.id || '',
            nome: (m as any).nome,
            usuarioId: this.selectedBulkMemberType === 'usuario' ? m.id : undefined,
            equipeId: this.selectedBulkMemberType === 'equipe' ? m.id : undefined,
            membroGestorId: this.membroGestorIdForNewMember || undefined, // Preenchido no dropdown
        }));

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
        const isBonus = value.tipoComissao >= TipoComissao.BonusPorPercentual || value.tipoComissao >= 4;

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
                children: [], // Níveis são flat agora
                type: isBonus ? 'bonus' : 'person'
            };

            // Adiciona o novo nível diretamente na raiz
            this.treeData = [...this.treeData, newNode];
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

            const invalidFields = [];
            const controls = this.form.controls;
            for (const name in controls) {
                if (controls[name].invalid) {
                    invalidFields.push(name);
                }
            }
            this.messageService.add({
                severity: 'warn',
                summary: 'Atenção',
                detail: `Preencha os campos obrigatórios: ${invalidFields.join(', ')}`
            });
            return;
        }

        try {
            this.saving.set(true);
            const formValue = this.form.value;
            const levelsRequest = this.mapTreeDataToRequests(this.treeData);

            const request: UpdateEstruturaComissaoRequest = {
                ...formValue,
                id: this.estruturaId || '',
                versao: this.versaoAtual,
                tipoComissao: formValue.tipoComissao ?? TipoComissao.Percentual,
                valorComissao: formValue.valorComissao ?? 0,
                niveis: levelsRequest
            };

            if (this.isEditMode()) {
                this.estruturaService.update(this.estruturaId!, request).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Atualizado com sucesso' });
                        setTimeout(() => this.router.navigate(['/comissoes/estruturas']), 1500);
                    },
                    error: (err) => {

                        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao salvar' });
                        this.saving.set(false);
                    }
                });
            } else {
                this.estruturaService.create(request as any).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Criado com sucesso' });
                        setTimeout(() => this.router.navigate(['/comissoes/estruturas']), 1500);
                    },
                    error: (err) => {

                        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao criar' });
                        this.saving.set(false);
                    }
                });
            }
        } catch (error) {

            this.messageService.add({ severity: 'error', summary: 'Erro Interno', detail: 'Ocorreu um erro ao processar os dados.' });
            this.saving.set(false);
        }
    }

    private mapTreeDataToRequests(nodes: TreeNode[]): CreateEstruturaComissaoNivelRequest[] {
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

                // Tratamento para evitar envio de string vazia "" para campos Guid?
                idGrupo: data.idGrupo || undefined,

                tipoComissao: data.tipoComissao !== null && data.tipoComissao !== undefined ? Number(data.tipoComissao) : null,
                regraLiberacao: data.regraLiberacao ? Number(data.regraLiberacao) : RegraLiberacao.Diretamente,
                prioridadePagamento: data.prioridade || 2,

                numeroParcelas: data.numeroParcelas,

                origemPagamentoId: data.origemPagamentoId || undefined,

                metaVendasMinima: data.metaVendasMinima,
                parcelaInicialLiberacao: data.parcelaInicialLiberacao,
                liberacaoAutomaticaQuitacao: !!data.liberacaoAutomaticaQuitacao,

                regrasParcelamento: this.generateRegrasParcelamento(data),

                membros: data.membros ? data.membros.map((m: any) => ({
                    id: m.id,
                    nome: m.nome,
                    usuarioId: m.usuarioId ?? undefined,
                    equipeId: m.equipeId ?? undefined,
                    membroGestorId: m.membroGestorId ?? undefined
                })) : []
            };

            result.push(req);
        }
        return result;
    }

    private inferTipoBonificacao(data: any): number | undefined {
        if (data.tipoBonificacao) return Number(data.tipoBonificacao);
        if (data.TipoBonificacao) return Number(data.TipoBonificacao);

        const tipoComissao = Number(data.tipoComissao ?? data.TipoComissao);
        if (tipoComissao === TipoComissao.BonusPorPercentual) return TipoBonificacao.PorParcelamento;
        if (tipoComissao === TipoComissao.BonusLivre) return TipoBonificacao.Livre;
        if (tipoComissao === TipoComissao.BonusMeta) return TipoBonificacao.PorMeta;

        return undefined;
    }

    private inferTipoComissao(data: any, resolvedTipoValor?: number): number {
        const rawBonificacao = data.tipoBonificacao ?? data.TipoBonificacao;
        if (!rawBonificacao) return this.fallbackTipoComissao(data, resolvedTipoValor);

        let tipoBonificacao: number | null = null;
        if (typeof rawBonificacao === 'number') {
            tipoBonificacao = rawBonificacao;
        } else {
            // Handle string enums from API
            if (rawBonificacao === 'PorParcelamento') tipoBonificacao = TipoBonificacao.PorParcelamento;
            else if (rawBonificacao === 'Livre') tipoBonificacao = TipoBonificacao.Livre;
            else if (rawBonificacao === 'PorMeta') tipoBonificacao = TipoBonificacao.PorMeta;
            else tipoBonificacao = Number(rawBonificacao) || null;
        }

        if (tipoBonificacao === TipoBonificacao.PorParcelamento) return TipoComissao.BonusPorPercentual;
        if (tipoBonificacao === TipoBonificacao.Livre) return TipoComissao.BonusLivre;
        if (tipoBonificacao === TipoBonificacao.PorMeta) return TipoComissao.BonusMeta;

        return this.fallbackTipoComissao(data, resolvedTipoValor);
    }

    private fallbackTipoComissao(data: any, resolvedTipoValue?: number): number {
        const val = data.tipoComissao ?? data.TipoComissao;

        if (val !== undefined && val !== null) {
            if (typeof val === 'number') return val;

            // Handle string names from API
            if (val === 'Percentual') return TipoComissao.Percentual;
            if (val === 'ValorFixo') return TipoComissao.ValorFixo;
            if (val === 'Misto') return TipoComissao.Misto;
            if (val === 'BonusPorPercentual') return TipoComissao.BonusPorPercentual;
            if (val === 'BonusLivre') return TipoComissao.BonusLivre;
            if (val === 'BonusMeta') return TipoComissao.BonusMeta;

            const num = Number(val);
            if (!isNaN(num)) return num;
        }

        let finalTipoValor = resolvedTipoValue;
        if (!finalTipoValor) {
            const tVal = data.tipoValor ?? data.TipoValor;
            if (tVal === 'Percentual') finalTipoValor = TipoValor.Percentual;
            else if (tVal === 'Fixo' || tVal === 'ValorFixo') finalTipoValor = TipoValor.Fixo;
            else finalTipoValor = Number(tVal) || TipoValor.Percentual;
        }

        return finalTipoValor === TipoValor.Percentual ? TipoComissao.Percentual : TipoComissao.ValorFixo;
    }

    private generateRegrasParcelamento(data: any): any[] {
        const tipoComissao = Number(data.tipoComissao);
        if (tipoComissao < TipoComissao.BonusPorPercentual) return [];

        // Se já tem regras no data (ex: vindo da API), mantém elas? 
        // Na UI simplificada, vamos reconstruir a partir dos campos do modal.
        const numParcelas = data.prioridade || 1;
        const percentual = data.percentual;
        const valorFixo = data.valorFixo;

        return [{
            parcelasMin: 1,
            parcelasMax: 99,
            formaCalculo: percentual !== null && percentual !== undefined ? EFormaCalculoBonificacao.Percentual : EFormaCalculoBonificacao.ValorFixo,
            numeroParcelasBonus: numParcelas,
            prioridadePagamento: data.prioridadePagamento || 2,
            percentual: percentual,
            valorFixo: valorFixo
        }];
    }

    cancel() {
        this.router.navigate(['/comissoes/estruturas']);
    }

    openMemberSelectionForAll() {
        this.selectedMembersForBulk = [];
        this.bulkMemberSearch = '';

        // Seleciona automaticamente o primeiro nível da árvore como destino
        // Se não houver níveis, força o usuário a criar um primeiro
        if (this.treeData.length > 0) {
            this.parentForNewNode = this.treeData[0]; // Primeiro nível raiz
        } else {
            this.messageService.add({
                severity: 'warn',
                summary: 'Atenção',
                detail: 'Crie um nível hierárquico antes de adicionar integrantes.'
            });
            return;
        }

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
