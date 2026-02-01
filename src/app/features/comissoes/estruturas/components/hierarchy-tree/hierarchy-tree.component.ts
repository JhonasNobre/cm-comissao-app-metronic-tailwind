import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrgNode } from '../../models/org-node.model';
import { MemberCardComponent } from '../member-card/member-card.component';

interface NodePosition {
    node: OrgNode;
    x: number;
    y: number;
    parentX?: number;
    parentY?: number;
}

@Component({
    selector: 'app-hierarchy-tree',
    standalone: true,
    imports: [CommonModule, MemberCardComponent],
    template: `
        <div class="hierarchy-tree-container relative overflow-auto" #container>
            <!-- SVG para linhas conectoras -->
            <svg class="absolute top-0 left-0 w-full h-full pointer-events-none" 
                 [attr.width]="containerWidth" 
                 [attr.height]="containerHeight"
                 style="z-index: 0;">
                @for (line of lines; track $index) {
                    <path [attr.d]="line.path" 
                          fill="none" 
                          [attr.stroke]="line.isBonus ? '#fbbf24' : '#d1d5db'"
                          stroke-width="2"
                          stroke-linecap="round"/>
                }
            </svg>

            <!-- Nós posicionados -->
            <div class="relative" [style.width.px]="containerWidth" [style.height.px]="containerHeight" style="z-index: 1;">
                @for (pos of positions; track pos.node.id) {
                    <div class="absolute" 
                         [style.left.px]="pos.x" 
                         [style.top.px]="pos.y"
                         [style.transform]="'translateX(-50%)'">
                        <app-member-card 
                            [node]="pos.node"
                            [expanded]="isExpanded(pos.node.id)"
                            (toggleExpand)="onToggleExpand(pos.node.id)"
                            (addSubordinates)="onAddSubordinates($event)"
                            (removeFromStructure)="onRemove($event)">
                        </app-member-card>
                    </div>
                }
            </div>

            <!-- Empty State -->
            @if (!data || positions.length === 0) {
                <div class="flex flex-col items-center justify-center py-20 text-gray-400">
                    <i class="ki-filled ki-people text-4xl mb-3"></i>
                    <p class="text-sm">Nenhum integrante adicionado ainda</p>
                </div>
            }

            <!-- Zoom Controls -->
            <div class="absolute top-4 right-4 flex flex-col gap-2 z-10">
                <button type="button" 
                        class="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50"
                        (click)="zoomIn()">
                    <i class="ki-filled ki-plus text-gray-600 text-sm"></i>
                </button>
                <button type="button" 
                        class="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50"
                        (click)="zoomOut()">
                    <i class="ki-filled ki-minus text-gray-600 text-sm"></i>
                </button>
            </div>
        </div>
    `,
    styles: [`
        .hierarchy-tree-container {
            min-height: 400px;
            background: linear-gradient(to bottom, #f8fafc 1px, transparent 1px),
                        linear-gradient(to right, #f8fafc 1px, transparent 1px);
            background-size: 20px 20px;
            border-radius: 8px;
        }
    `]
})
export class HierarchyTreeComponent implements OnChanges, AfterViewInit {
    @ViewChild('container') containerRef!: ElementRef<HTMLDivElement>;

    @Input() data: OrgNode | null = null;

    @Output() addSubordinates = new EventEmitter<OrgNode>();
    @Output() removeNode = new EventEmitter<OrgNode>();

    // Layout constants
    private readonly CARD_WIDTH = 220;
    private readonly CARD_HEIGHT = 90;
    private readonly HORIZONTAL_GAP = 40;
    private readonly VERTICAL_GAP = 80;
    private readonly PADDING = 60;

    positions: NodePosition[] = [];
    lines: { path: string; isBonus: boolean }[] = [];
    containerWidth = 800;
    containerHeight = 500;

    private expandedNodes = new Set<string>();
    private scale = 1;

    ngAfterViewInit() {
        this.calculateLayout();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['data']) {
            this.calculateLayout();
        }
    }

    calculateLayout(): void {
        if (!this.data) {
            this.positions = [];
            this.lines = [];
            return;
        }

        // Inicialmente expandir todos os nós
        this.expandAllNodes(this.data);

        // Calcular posições
        this.positions = [];
        this.lines = [];

        const nodeWidths = this.calculateNodeWidths(this.data);
        this.positionNode(this.data, this.PADDING, this.PADDING, nodeWidths);

        // Calcular tamanho do container
        if (this.positions.length > 0) {
            const maxX = Math.max(...this.positions.map(p => p.x)) + this.CARD_WIDTH / 2 + this.PADDING;
            const maxY = Math.max(...this.positions.map(p => p.y)) + this.CARD_HEIGHT + this.PADDING;
            this.containerWidth = Math.max(800, maxX);
            this.containerHeight = Math.max(400, maxY);
        }
    }

    private expandAllNodes(node: OrgNode): void {
        this.expandedNodes.add(node.id);
        if (node.children) {
            node.children.forEach(child => this.expandAllNodes(child));
        }
    }

    private calculateNodeWidths(node: OrgNode): Map<string, number> {
        const widths = new Map<string, number>();
        this.calculateWidthRecursive(node, widths);
        return widths;
    }

    private calculateWidthRecursive(node: OrgNode, widths: Map<string, number>): number {
        if (!node.children || node.children.length === 0 || !this.expandedNodes.has(node.id)) {
            widths.set(node.id, this.CARD_WIDTH);
            return this.CARD_WIDTH;
        }

        const childrenWidth = node.children.reduce((sum, child) => {
            return sum + this.calculateWidthRecursive(child, widths) + this.HORIZONTAL_GAP;
        }, -this.HORIZONTAL_GAP);

        const nodeWidth = Math.max(this.CARD_WIDTH, childrenWidth);
        widths.set(node.id, nodeWidth);
        return nodeWidth;
    }

    private positionNode(node: OrgNode, x: number, y: number, widths: Map<string, number>): void {
        const nodeWidth = widths.get(node.id) || this.CARD_WIDTH;
        const centerX = x + nodeWidth / 2;

        this.positions.push({ node, x: centerX, y });

        if (node.children && node.children.length > 0 && this.expandedNodes.has(node.id)) {
            const childY = y + this.CARD_HEIGHT + this.VERTICAL_GAP;
            let childX = x;

            // Linha vertical do pai para o nível dos filhos
            const lineStartY = y + this.CARD_HEIGHT;
            const lineMidY = y + this.CARD_HEIGHT + this.VERTICAL_GAP / 2;

            node.children.forEach((child, index) => {
                const childWidth = widths.get(child.id) || this.CARD_WIDTH;
                const childCenterX = childX + childWidth / 2;

                // Criar linha conectora (bezier curve)
                const path = this.createConnectorPath(centerX, lineStartY, childCenterX, childY);
                this.lines.push({ path, isBonus: child.isBonus || false });

                this.positionNode(child, childX, childY, widths);
                childX += childWidth + this.HORIZONTAL_GAP;
            });
        }
    }

    private createConnectorPath(x1: number, y1: number, x2: number, y2: number): string {
        const midY = (y1 + y2) / 2;
        // Bezier curve suave
        return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
    }

    isExpanded(nodeId: string): boolean {
        return this.expandedNodes.has(nodeId);
    }

    onToggleExpand(nodeId: string): void {
        if (this.expandedNodes.has(nodeId)) {
            this.expandedNodes.delete(nodeId);
        } else {
            this.expandedNodes.add(nodeId);
        }
        this.calculateLayout();
    }

    onAddSubordinates(node: OrgNode): void {
        this.addSubordinates.emit(node);
    }

    onRemove(node: OrgNode): void {
        this.removeNode.emit(node);
    }

    zoomIn(): void {
        this.scale = Math.min(this.scale + 0.1, 1.5);
        this.applyZoom();
    }

    zoomOut(): void {
        this.scale = Math.max(this.scale - 0.1, 0.5);
        this.applyZoom();
    }

    private applyZoom(): void {
        if (this.containerRef?.nativeElement) {
            this.containerRef.nativeElement.style.transform = `scale(${this.scale})`;
            this.containerRef.nativeElement.style.transformOrigin = 'top left';
        }
    }
}
