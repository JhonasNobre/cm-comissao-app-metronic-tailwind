import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BaseListComponent } from '../../../../shared/components/base/base-list/base-list.component';
import { GenericPTableComponent } from '../../../../shared/components/ui/generic-p-table/generic-p-table.component';
import { State } from '../../models/state.model';
import { StateService } from '../../services/state.service';
import { ColumnHeader } from '../../../../shared/models/column-header.model';
import { Observable } from 'rxjs';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-state-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        GenericPTableComponent,
        TooltipModule
    ],
    templateUrl: './state-list.component.html'
})
export class StateListComponent extends BaseListComponent<State> {
    private stateService = inject(StateService);
    private route = inject(ActivatedRoute);

    protected storageKey = 'state-list-search';
    columns: ColumnHeader<State>[] = [
        { field: 'uf', header: 'UF' },
        { field: 'nome', header: 'Nome' },
        { field: 'codigoIbge', header: 'Código IBGE' }
    ];

    protected loadData(params: any): Observable<State[]> {
        return this.stateService.list();
    }

    onViewCities(state: State): void {
        this.router.navigate([state.uf, 'cidades'], { relativeTo: this.route });
    }

    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.stateService.importExcel(file).subscribe({
                next: () => {
                    this.showSuccess('Importação realizada com sucesso!');
                    this.load(); // Reload list
                },
                error: (err) => {
                    this.showError('Erro ao importar arquivo.');
                    console.error(err);
                }
            });
            // Clear input
            event.target.value = '';
        }
    }
}
