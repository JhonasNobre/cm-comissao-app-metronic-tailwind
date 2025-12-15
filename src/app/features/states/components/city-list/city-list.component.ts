import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BaseListComponent } from '../../../../shared/components/base/base-list/base-list.component';
import { GenericPTableComponent } from '../../../../shared/components/ui/generic-p-table/generic-p-table.component';
import { City } from '../../models/city.model';
import { StateService } from '../../services/state.service';
import { ColumnHeader } from '../../../../shared/models/column-header.model';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-city-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        GenericPTableComponent
    ],
    templateUrl: './city-list.component.html'
})
export class CityListComponent extends BaseListComponent<City> implements OnInit {
    private stateService = inject(StateService);
    private route = inject(ActivatedRoute);

    protected storageKey = 'city-list-search';
    uf: string = '';

    columns: ColumnHeader<City>[] = [
        { field: 'nome', header: 'Nome' },
        { field: 'codigoIbge', header: 'Código IBGE' }
    ];

    override ngOnInit(): void {
        this.uf = this.route.snapshot.paramMap.get('uf') || '';
        super.ngOnInit();
    }

    protected loadData(params: any): Observable<City[]> {
        if (!this.uf) return new Observable(observer => observer.next([]));
        return this.stateService.listCities(this.uf);
    }
}
