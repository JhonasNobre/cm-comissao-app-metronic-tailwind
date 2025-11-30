import { Routes } from '@angular/router';
import { LayoutComponent } from './layouts/layout.component';
import { IndexComponent as DashboardComponent } from './pages/dashboard/index.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: DashboardComponent },
      { path: 'test', loadComponent: () => import('./pages/test-page/test-page.component').then(m => m.TestPageComponent) },
      { path: 'profile/default', loadComponent: () => import('./pages/profile-default/profile-default.component').then(m => m.ProfileDefaultComponent) },
    ],
  }
];
