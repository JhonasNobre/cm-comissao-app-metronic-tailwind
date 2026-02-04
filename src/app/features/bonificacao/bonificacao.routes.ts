import { Routes } from '@angular/router';
import { BonusListComponent } from './components/bonus-list/bonus-list.component';
import { BonusStructureListComponent } from './components/bonus-structure-list/bonus-structure-list.component';
import { BonusStructureFormComponent } from './components/bonus-structure-form/bonus-structure-form.component';
import { ManualBonusFormComponent } from './components/manual-bonus-form/manual-bonus-form.component';

export const BONIFICACAO_ROUTES: Routes = [
    {
        path: '',
        component: BonusListComponent,
        title: 'Gestão de Bônus'
    },
    {
        path: 'estruturas',
        component: BonusStructureListComponent,
        title: 'Estruturas de Bonificação'
    },
    {
        path: 'estruturas/nova',
        component: BonusStructureFormComponent,
        title: 'Nova Estrutura'
    },
    {
        path: 'estruturas/editar/:id',
        component: BonusStructureFormComponent,
        title: 'Editar Estrutura'
    },
    {
        path: 'manual',
        component: ManualBonusFormComponent,
        title: 'Lançamento Manual'
    }
];
