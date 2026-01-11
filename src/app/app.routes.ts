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

      // Feature Users, etc... (Mantendo imports dinâmicos para lazy loading)
      { path: 'users', loadComponent: () => import('./features/users/components/user-list/user-list.component').then(m => m.UserListComponent) },
      // ... outras rotas de user omitidas para brevidade se não forem essenciais para o fluxo, mas vou manter as que vi antes se possível.
      // Melhor manter só o essencial de Comissões se eu não tiver o backup das outras.
      // O user tem o arquivo original no diff anterior. Vou restaurar todas que vi no diff.
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

      {
        path: 'comissoes/lista',
        loadComponent: () => import('./features/comissoes/comissoes-list/comissoes-list.component').then(m => m.ComissoesListComponent)
      },
      {
        path: 'comissoes/parcelas',
        loadComponent: () => import('./features/comissoes/parcelas-list/parcelas-list.component').then(m => m.ParcelasListComponent)
      },
      {
        path: 'admin/comissoes',
        loadComponent: () => import('./features/comissoes/comissoes-admin-list/comissoes-admin-list.component').then(m => m.ComissoesAdminListComponent)
      },
      {
        path: 'comissoes/detalhes/:id',
        loadComponent: () => import('./features/comissoes/detalhes/comissao-detalhes.component').then(m => m.ComissaoDetalhesComponent)
      },
      // Nova rota de Vendas Pendentes
      {
        path: 'vendas/pendentes',
        loadComponent: () => import('./features/vendas/lista/vendas-lista.component').then(m => m.VendasListaComponent)
      },
      // Compatibilidade com Menu Antigo (Redirecionamento)
      {
        path: 'comissoes/vendas',
        redirectTo: 'vendas/pendentes',
        pathMatch: 'full'
      },

      // Placeholders Comissões
      {
        path: 'comissoes/regras',
        loadComponent: () => import('./pages/general/status-page/status-page.component').then(m => m.StatusPageComponent),
        data: { title: 'Regras de Comissão', description: 'O módulo de regras de comissão está em desenvolvimento.', icon: 'pi pi-verified', status: 200 }
      },
      {
        path: 'comissoes/calculo',
        loadComponent: () => import('./pages/general/status-page/status-page.component').then(m => m.StatusPageComponent),
        data: { title: 'Cálculo de Comissões', description: 'O módulo de cálculo e fechamento de comissões está em desenvolvimento.', icon: 'pi pi-calculator', status: 200 }
      },

      // Configurações e Erro
      {
        path: 'config/integracoes',
        loadComponent: () => import('./features/imobtech-integration/components/configuration-form/configuration-form.component').then(m => m.ConfigurationFormComponent),
        data: { title: 'Integração Imobtech', description: 'Gerencie a integração com o sistema Imobtech.', icon: 'pi pi-cog', status: 200 }
      },
      // Imobtech Remessas
      {
        path: 'imobtech/remessas',
        loadComponent: () => import('./features/imobtech-integration/components/remessa-list/remessa-list.component').then(m => m.RemessaListComponent),
        data: { title: 'Remessas Imobtech', description: 'Gerencie remessas e pagamentos Imobtech', icon: 'ki-filled ki-file-sheet', status: 200 }
      },
      {
        path: 'imobtech/diagnostico',
        loadComponent: () => import('./features/imobtech-integration/pages/imobtech-diagnostic/imobtech-diagnostic.component').then(m => m.ImobtechDiagnosticComponent),
        data: { title: 'Laboratório Imobtech', description: 'Diagnóstico e teste dos serviços Imobtech', icon: 'pi pi-bolt', status: 200 }
      },
      { path: 'error/404', loadComponent: () => import('./pages/general/status-page/status-page.component').then(m => m.StatusPageComponent), data: { status: 404, title: ' Página não encontrada' } },

      { path: 'test', loadComponent: () => import('./features/testing/components/test-page/test-page.component').then(m => m.TestPageComponent) },
    ],
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/change-password',
    loadComponent: () => import('./features/auth/components/change-password/change-password.component').then(m => m.ChangePasswordComponent)
  },
  { path: '**', redirectTo: 'error/404' }
];
