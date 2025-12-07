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
      { path: 'teams', loadComponent: () => import('./features/teams/components/team-list/team-list.component').then(m => m.TeamListComponent) },
      { path: 'access-profiles', loadComponent: () => import('./features/access-profiles/components/access-profile-list/access-profile-list.component').then(m => m.AccessProfileListComponent) },
      { path: 'access-profiles/new', loadComponent: () => import('./features/access-profiles/components/access-profile-form/access-profile-form.component').then(m => m.AccessProfileFormComponent) },
      { path: 'access-profiles/:id', loadComponent: () => import('./features/access-profiles/components/access-profile-form/access-profile-form.component').then(m => m.AccessProfileFormComponent) },
      { path: 'holidays', loadComponent: () => import('./features/holidays/components/holiday-list/holiday-list.component').then(m => m.HolidayListComponent) },

      // Comissões
      { path: 'comissoes/estruturas', loadComponent: () => import('./features/comissoes/estruturas/estruturas-list/estruturas-list.component').then(m => m.EstruturasListComponent) },
      { path: 'comissoes/estruturas/nova', loadComponent: () => import('./features/comissoes/estruturas/estrutura-form/estrutura-form.component').then(m => m.EstruturaFormComponent) },
      { path: 'comissoes/estruturas/editar/:id', loadComponent: () => import('./features/comissoes/estruturas/estrutura-form/estrutura-form.component').then(m => m.EstruturaFormComponent) },

      // Placeholders Comissões
      {
        path: 'comissoes/regras',
        loadComponent: () => import('./pages/general/status-page/status-page.component').then(m => m.StatusPageComponent),
        data: { title: 'Regras de Comissão', description: 'O módulo de regras de comissão está em desenvolvimento.', icon: 'ki-scroll', status: 200 }
      },
      {
        path: 'comissoes/calculo',
        loadComponent: () => import('./pages/general/status-page/status-page.component').then(m => m.StatusPageComponent),
        data: { title: 'Cálculo de Comissões', description: 'O módulo de cálculo e fechamento de comissões está em desenvolvimento.', icon: 'ki-calculator', status: 200 }
      },

      // Configurações
      {
        path: 'config/integracoes',
        loadComponent: () => import('./pages/general/status-page/status-page.component').then(m => m.StatusPageComponent),
        data: { title: 'Integrações', description: 'Configurações de integração com sistemas externos em breve.', icon: 'ki-technology-2', status: 200 }
      },

      // Páginas de Erro / Status
      {
        path: 'error/404',
        loadComponent: () => import('./pages/general/status-page/status-page.component').then(m => m.StatusPageComponent),
        data: { status: 404, title: 'Página não encontrada', description: 'A página que você está procurando não existe.', icon: 'ki-file-deleted' }
      },
      {
        path: 'error/403',
        loadComponent: () => import('./pages/general/status-page/status-page.component').then(m => m.StatusPageComponent),
        data: { status: 403, title: 'Acesso Negado', description: 'Você não tem permissão para acessar esta página.', icon: 'ki-lock-2', showButton: true, buttonText: 'Voltar ao Início' }
      },
      {
        path: 'error/maintenance',
        loadComponent: () => import('./pages/general/status-page/status-page.component').then(m => m.StatusPageComponent),
        data: { status: 503, title: 'Em Manutenção', description: 'Estamos realizando melhorias no sistema. Volte em breve.', icon: 'ki-tools' }
      },

      { path: 'test', loadComponent: () => import('./features/testing/components/test-page/test-page.component').then(m => m.TestPageComponent) },
    ],

  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/components/login/login.component').then(m => m.LoginComponent)
  }
];
