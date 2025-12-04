import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { AccessProfileService } from '../../services/access-profile.service';
import { AccessProfile } from '../../models/access-profile.model';
import { GenericPTableComponent } from '../../../../shared/components/ui/generic-p-table/generic-p-table.component';
import { ColumnHeader } from '../../../../shared/models/column-header.model';
import { BaseListComponent } from '../../../../shared/components/base/base-list/base-list.component';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
    selector: 'app-access-profile-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        GenericPTableComponent,
        TranslocoModule
    ],
    templateUrl: './access-profile-list.component.html'
})
export class AccessProfileListComponent extends BaseListComponent<AccessProfile> {
    private service = inject(AccessProfileService);
    private route = inject(ActivatedRoute);

    protected storageKey = 'access-profile-list';

    columns: ColumnHeader<AccessProfile>[] = [
        { field: 'nome', header: 'Nome' },
        { field: 'limiteDescontoMaximo', header: 'Limite Desconto (%)' },
        { field: 'quantidadeMaximaReservas', header: 'Max. Reservas' },
        { field: 'ehPadrao', header: 'Padrão', displayAs: 'yesNo' }
    ];

    protected loadData(params: any): Observable<AccessProfile[]> {
        return this.service.list(params);
    }

    protected override onDelete(id: string): Observable<void> {
        return this.service.delete(id);
    }

    protected override onAdd(object: AccessProfile): Observable<any> {
        // Not used for routing based add, but required by abstract
        return new Observable();
    }

    protected override onEdit(object: AccessProfile, id: string): Observable<any> {
        // Not used for routing based edit, but required by abstract
        return new Observable();
    }

    // Override openDialog to navigate instead
    override openDialog(object?: AccessProfile) {
        if (object?.id) {
            this.router.navigate([object.id], { relativeTo: this.route });
        } else {
            this.router.navigate(['new'], { relativeTo: this.route });
        }
    }
}
