import { Routes } from '@angular/router';
import { LayoutComponent } from './layouts/layout.component';
import { IndexComponent as DashboardComponent } from './pages/dashboard/index.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardComponent },
      { path: 'users', loadComponent: () => import('./features/users/components/user-list/user-list.component').then(m => m.UserListComponent) },
      { path: 'companies', loadComponent: () => import('./features/companies/components/company-list/company-list.component').then(m => m.CompanyListComponent) },
      { path: 'companies/new', loadComponent: () => import('./features/companies/components/company-form/company-form.component').then(m => m.CompanyFormComponent) },
      { path: 'companies/:id', loadComponent: () => import('./features/companies/components/company-form/company-form.component').then(m => m.CompanyFormComponent) },
      { path: 'test', loadComponent: () => import('./features/testing/components/test-page/test-page.component').then(m => m.TestPageComponent) },
    ],
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/components/login/login.component').then(m => m.LoginComponent)
  }
];
