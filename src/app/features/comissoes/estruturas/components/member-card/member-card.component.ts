import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrgNode, getAvatarInitials } from '../../models/org-node.model';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

@Component({
    selector: 'app-member-card',
    standalone: true,
    imports: [CommonModule, TooltipModule, MenuModule],
    template: `
        <div class="member-card relative" 
             [class.member-card--first]="node.first"
             [class.member-card--bonus]="node.isBonus"
             [class.member-card--last]="node.last">
            
            <!-- Card Content -->
            <div class="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm min-w-[200px] max-w-[240px]"
                 [class.bg-yellow-50]="node.isBonus"
                 [class.border-yellow-300]="node.isBonus">
                
                <!-- Avatar -->
                <div class="flex-shrink-0">
                    @if (node.avatar) {
                        <img [src]="node.avatar" [alt]="node.name" 
                             class="w-10 h-10 rounded-full object-cover border-2 border-white shadow" />
                    } @else if (node.isBonus) {
                        <div class="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center shadow">
                            <i class="ki-filled ki-star text-white text-lg"></i>
                        </div>
                    } @else {
                        <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                            {{ getInitials(node.name) }}
                        </div>
                    }
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-semibold text-gray-900 truncate">{{ node.name }}</h4>
                    <p class="text-xs text-gray-500 truncate">{{ node.role }}</p>
                    <div class="flex items-center gap-1 mt-1 text-xs text-gray-400">
                        <i class="ki-filled ki-people text-xs"></i>
                        <span>{{ node.people }} pessoas</span>
                    </div>
                </div>

                <!-- Menu Button -->
                <button type="button" 
                        class="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        (click)="menu.toggle($event); $event.stopPropagation()"
                        pTooltip="Opções" tooltipPosition="top">
                    <i class="ki-filled ki-dots-vertical text-sm"></i>
                </button>
            </div>

            <!-- Expand/Collapse Button -->
            @if (node.children && node.children.length > 0) {
                <button type="button"
                        class="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-colors"
                        [class.bg-blue-600]="!node.isBonus"
                        [class.bg-yellow-500]="node.isBonus"
                        [class.hover:bg-blue-700]="!node.isBonus"
                        [class.hover:bg-yellow-600]="node.isBonus"
                        (click)="onToggleExpand()">
                    <i class="ki-filled text-white text-xs"
                       [class.ki-down]="expanded"
                       [class.ki-right]="!expanded"></i>
                </button>
            }
        </div>

        <!-- Context Menu -->
        <p-menu #menu [popup]="true" [model]="menuItems" appendTo="body"></p-menu>
    `,
    styles: [`
        .member-card {
            position: relative;
        }
        .member-card--first > div {
            border-left: 3px solid #3b82f6;
        }
        .member-card--bonus > div {
            border-left: 3px solid #fbbf24;
        }
    `]
})
export class MemberCardComponent {
    @Input() node!: OrgNode;
    @Input() expanded = true;

    @Output() toggleExpand = new EventEmitter<void>();
    @Output() addSubordinates = new EventEmitter<OrgNode>();
    @Output() removeFromStructure = new EventEmitter<OrgNode>();

    menuItems: MenuItem[] = [];

    ngOnInit() {
        this.menuItems = [
            {
                label: 'Adicionar subordinados',
                icon: 'pi pi-user-plus',
                command: () => this.addSubordinates.emit(this.node)
            },
            {
                label: 'Remover',
                icon: 'pi pi-trash',
                styleClass: 'text-red-600',
                command: () => this.removeFromStructure.emit(this.node)
            }
        ];
    }

    getInitials(name: string): string {
        return getAvatarInitials(name);
    }

    onToggleExpand(): void {
        this.toggleExpand.emit();
    }

    toggleMenu(event: Event): void {
        // Menu will be handled by p-menu
        event.stopPropagation();
    }
}
