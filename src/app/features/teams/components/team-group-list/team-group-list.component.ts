import { Component, Injector, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Observable } from 'rxjs';
import { BaseListComponent } from '../../../../shared/components/base/base-list/base-list.component';
import { TeamGroupService, TeamGroup } from '../../services/team-group.service';
import { TeamGroupFormDialogComponent } from '../team-group-form/team-group-form-dialog.component';
import { GenericPTableComponent } from '../../../../shared/components/ui/generic-p-table/generic-p-table.component';
import { ColumnHeader } from '../../../../shared/models/column-header.model';

@Component({
    selector: 'app-team-group-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        GenericPTableComponent,
        ConfirmDialogModule
    ],
    templateUrl: './team-group-list.component.html'
})
export class TeamGroupListComponent extends BaseListComponent<TeamGroup> implements OnInit {

    // Obrigatório pelo BaseListComponent
    protected storageKey = 'team-groups-table';
    columns: ColumnHeader<TeamGroup>[] = [];

    constructor(
        injector: Injector,
        private teamGroupService: TeamGroupService
    ) {
        super();
    }

    override ngOnInit(): void {
        super.ngOnInit();
        this.initializeColumns();
    }

    private initializeColumns(): void {
        this.columns = [
            { field: 'nome', header: 'Nome' },
            { field: 'descricao', header: 'Descrição' }
        ];
    }

    // Obrigatório pelo BaseListComponent: Buscar dados
    protected override loadData(params: any): Observable<TeamGroup[]> {
        return this.teamGroupService.list(params);
    }

    protected override getObjectName(object?: TeamGroup): string | undefined {
        return object?.nome || 'Grupo';
    }

    // Sobrescrevendo openDialog para usar nosso componente customizado
    override openDialog(object?: TeamGroup) {
        const ref = this.dialogService.open(TeamGroupFormDialogComponent, {
            header: object?.id ? 'Editar Grupo' : 'Novo Grupo',
            width: '500px',
            contentStyle: { "max-height": "500px", "overflow": "auto" },
            data: object
        });

        if (ref) {
            ref.onClose.subscribe((result: TeamGroup) => {
                if (result) {
                    this.handleSave(result, result.id);
                }
            });
        }
    }

    // Métodos chamados pelo GenericPTable (Event Emitters)
    onAddClick() {
        this.openDialog();
    }

    onEditClick(group: TeamGroup) {
        this.openDialog(group);
    }

    onDeleteClick(group: TeamGroup) {
        this.onRemover(group);
    }

    // Sobrescrevendo métodos de CRUD para usar o service correto
    protected override onAdd(object: TeamGroup): Observable<any> {
        return this.teamGroupService.create(object);
    }

    protected override onEdit(object: TeamGroup, id: string | number): Observable<any> {
        return this.teamGroupService.update(object, String(id));
    }

    protected override onDelete(id: string | number): Observable<void> {
        return this.teamGroupService.delete(String(id));
    }
}
