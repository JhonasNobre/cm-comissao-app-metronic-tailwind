import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'estruturas',
        pathMatch: 'full'
    },
    {
        path: 'estruturas',
        loadComponent: () =>
            import('./estruturas/estruturas-list/estruturas-list.component').then(
                (m) => m.EstruturasListComponent
            ),
    },
    {
        path: 'estruturas/nova',
        loadComponent: () =>
            import('./estruturas/estrutura-form/estrutura-form.component').then(
                (m) => m.EstruturaFormComponent
            ),
    },
    {
        path: 'estruturas/editar/:id',
        loadComponent: () =>
            import('./estruturas/estrutura-form/estrutura-form.component').then(
                (m) => m.EstruturaFormComponent
            ),
    },
    {
        path: 'parcelas',
        loadComponent: () =>
            import('./parcelas-list/parcelas-list.component').then(
                (m) => m.ParcelasListComponent
            ),
    },
    {
        path: 'detalhes/:id',
        loadComponent: () =>
            import('./detalhes/comissao-detalhes.component').then(
                (m) => m.ComissaoDetalhesComponent
            ),
    },
    {
        path: 'legacy-test',
        loadComponent: () =>
            import('./legacy-test/legacy-test.component').then(
                (m) => m.LegacyTestComponent
            ),
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ComissoesRoutingModule { }
