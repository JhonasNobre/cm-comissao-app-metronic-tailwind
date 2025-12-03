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
      { path: 'users/new', loadComponent: () => import('./features/users/components/user-form/user-form.component').then(m => m.UserFormComponent) },
      { path: 'users/:id', loadComponent: () => import('./features/users/components/user-form/user-form.component').then(m => m.UserFormComponent) },
      { path: 'users/:id/details', loadComponent: () => import('./features/users/components/user-profile/user-profile.component').then(m => m.UserProfileComponent) },
      { path: 'companies', loadComponent: () => import('./features/companies/components/company-list/company-list.component').then(m => m.CompanyListComponent) },
      { path: 'companies/new', loadComponent: () => import('./features/companies/components/company-form/company-form.component').then(m => m.CompanyFormComponent) },
      { path: 'companies/:id', loadComponent: () => import('./features/companies/components/company-form/company-form.component').then(m => m.CompanyFormComponent) },
      { path: 'teams', loadComponent: () => import('./features/teams/components/team-list/team-list.component').then(m => m.TeamListComponent) },
      { path: 'teams/new', loadComponent: () => import('./features/teams/components/team-form/team-form.component').then(m => m.TeamFormComponent) },
      { path: 'teams/:id', loadComponent: () => import('./features/teams/components/team-form/team-form.component').then(m => m.TeamFormComponent) },
      { path: 'access-profiles', loadComponent: () => import('./features/access-profiles/components/access-profile-list/access-profile-list.component').then(m => m.AccessProfileListComponent) },
      { path: 'access-profiles/new', loadComponent: () => import('./features/access-profiles/components/access-profile-form/access-profile-form.component').then(m => m.AccessProfileFormComponent) },
      { path: 'access-profiles/:id', loadComponent: () => import('./features/access-profiles/components/access-profile-form/access-profile-form.component').then(m => m.AccessProfileFormComponent) },
      { path: 'test', loadComponent: () => import('./features/testing/components/test-page/test-page.component').then(m => m.TestPageComponent) },
    ],
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/components/login/login.component').then(m => m.LoginComponent)
  }
];
