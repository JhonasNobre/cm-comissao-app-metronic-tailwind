# Frontend Architecture Guide

## 📋 Propósito

Este documento define a arquitetura, estrutura de pastas e convenções de código do frontend Angular. **Leia este guia antes de criar novos arquivos para garantir consistência.**

## 🏗️ Estrutura de Pastas

```
src/app/
├── core/                    # Código transversal (singleton)
│   ├── guards/             # Route guards
│   ├── interceptors/       # HTTP interceptors
│   └── services/           # Serviços globais singleton
│
├── features/               # Módulos de negócio (domínio)
│   ├── [feature-name]/
│   │   ├── components/    # Componentes específicos da feature
│   │   ├── services/      # Serviços específicos da feature
│   │   └── models/        # Models/Interfaces da feature
│   │
│   ├── auth/              # Autenticação
│   ├── users/             # Gestão de usuários
│   └── testing/           # Componentes de teste
│
├── shared/                 # Componentes reutilizáveis
│   ├── components/        # Componentes 100% genéricos
│   ├── directives/        # Diretivas compartilhadas
│   └── pipes/             # Pipes personalizados
│
├── pages/                  # Páginas simples de visualização
│   ├── dashboard/         # Dashboard
│   ├── not-found/         # 404 (futuro)
│   └── maintenance/       # Manutenção (futuro)
│
├── layouts/                # Template Metronic (NÃO MEXER)
│   ├── header/
│   ├── sidebar/
│   └── footer/
│
└── partials/               # Componentes do template (NÃO MEXER)
```

## 🎯 Onde Colocar Cada Arquivo?

### ✅ Use `features/[feature-name]/`

**Quando:** O código tem **lógica de negócio** específica de um domínio

**Exemplos:**
- CRUD de usuários → `features/users/`
- Autenticação/Login → `features/auth/`
- Gestão de produtos → `features/products/`
- Relatórios → `features/reports/`

**Estrutura interna:**
```
features/users/
├── components/
│   ├── user-list/
│   │   ├── user-list.component.ts
│   │   └── user-list.component.html
│   └── user-form/
├── services/
│   └── user.service.ts
└── models/
    └── user.model.ts
```

### ✅ Use `shared/`

**Quando:** O componente é **100% genérico** e usado em **2+ features diferentes**

**Exemplos:**
- Botão customizado genérico
- Modal de confirmação reutilizável
- Card genérico
- Breadcrumb
- Paginação

**NÃO coloque em shared:**
- ❌ Componentes com lógica de negócio
- ❌ Componentes usados em apenas 1 feature
- ❌ Componentes do template Metronic

### ✅ Use `pages/`

**Quando:** É uma **página de visualização simples**, sem lógica de negócio complexa

**Exemplos:**
- Dashboard (agregação de dados)
- Página 404
- Página de manutenção
- Sobre / Contato

### ✅ Use `core/`

**Quando:** É código **transversal** usado em múltiplas features

**`core/guards/`** - Route guards
```typescript
// Exemplo: auth.guard.ts, admin.guard.ts
export const authGuard: CanActivateFn = (route, state) => { ... };
```

**`core/interceptors/`** - HTTP interceptors
```typescript
// Exemplo: auth.interceptor.ts, error.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => { ... };
```

**`core/services/`** - Serviços globais singleton
```typescript
// Exemplo: auth.service.ts, metronic-init.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService { ... }
```

**⚠️ NÃO coloque em core:**
- ❌ Models específicos de features (vão para `features/[name]/models/`)
- ❌ Serviços específicos de features (vão para `features/[name]/services/`)

## 📝 Convenções de Nomenclatura

### Arquivos
- **Componentes:** `kebab-case.component.ts` (ex: `user-list.component.ts`)
- **Serviços:** `kebab-case.service.ts` (ex: `user.service.ts`)
- **Guards:** `kebab-case.guard.ts` (ex: `auth.guard.ts`)
- **Models:** `kebab-case.model.ts` (ex: `user.model.ts`)
- **Pipes:** `kebab-case.pipe.ts` (ex: `cpf-format.pipe.ts`)

### Features
- Nome da pasta em **kebab-case singular**: `users/`, `auth/`, `products/`
- Nome da feature no código em **PascalCase**: `UsersModule`, `AuthService`

## 🔄 Fluxo de Criação

### Criar uma nova Feature

1. Criar estrutura de pastas:
```bash
mkdir features/[feature-name]
mkdir features/[feature-name]/components
mkdir features/[feature-name]/services
mkdir features/[feature-name]/models
```

2. Criar componente principal:
```bash
# Dentro de features/[feature-name]/components/
ng generate component [component-name] --standalone
```

3. Criar service (se necessário):
```typescript
// features/[feature-name]/services/[name].service.ts
@Injectable({ providedIn: 'root' })
export class [Name]Service { }
```

4. Criar models:
```typescript
// features/[feature-name]/models/[name].model.ts
export interface [Name] { }
```

5. Adicionar rota em `app.routes.ts`:
```typescript
{
  path: '[feature-name]',
  loadComponent: () => import('./features/[feature-name]/components/[...].component')
    .then(m => m.[Component]Component)
}
```

### Criar um Componente Shared

1. Criar em `shared/components/[component-name]/`
2. Deve ser **completamente genérico** (sem lógica de negócio)
3. Usar `@Input()` e `@Output()` para comunicação
4. Exportar para uso em múltiplas features

## 🚫 Regras Importantes

### ❌ NÃO MEXER
- **`layouts/`** - Template Metronic original
- **`partials/`** - Componentes do template Metronic

Se precisar customizar algo do template, **criar uma cópia** em `shared/` ou na feature específica.

### ✅ Imports Relativos

Dentro de uma feature, use **imports relativos**:
```typescript
// ✅ BOM (dentro de features/users/)
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';

// ❌ RUIM
import { UserService } from '../../../users/services/user.service';
```

### ✅ Standalone Components

Todos os novos componentes devem ser **standalone**:
```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './example.component.html'
})
```

## 📚 Exemplos Práticos

### Exemplo 1: Criar CRUD de Produtos

**Estrutura:**
```
features/products/
├── components/
│   ├── product-list/
│   │   ├── product-list.component.ts
│   │   └── product-list.component.html
│   ├── product-form/
│   └── product-detail/
├── services/
│   └── product.service.ts
└── models/
    └── product.model.ts
```

**Rota:**
```typescript
{ path: 'products', loadComponent: () => import('./features/products/...') }
```

### Exemplo 2: Criar Botão Reutilizável

**Estrutura:**
```
shared/components/button/
├── button.component.ts
├── button.component.html
└── button.component.scss
```

**Uso:**
```typescript
// Em qualquer feature
import { ButtonComponent } from '../../../shared/components/button/button.component';
```

### Exemplo 3: Criar Guard de Admin

**Local:** `core/guards/admin.guard.ts`

```typescript
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  return authService.hasRole('Admin');
};
```

## 🎯 Checklist antes de Criar Arquivo

- [ ] Identifiquei se é: feature, shared, page ou core?
- [ ] Se for feature: criei a pasta com estrutura completa?
- [ ] Se for shared: é realmente usado em 2+ lugares?
- [ ] Usei nomenclatura em kebab-case?
- [ ] Criei como standalone component?
- [ ] Atualizei as rotas (se necessário)?
- [ ] Usei imports relativos dentro da feature?

---

**Última atualização:** 2025-12-01  
**Mantenha este guia atualizado** ao fazer mudanças na arquitetura!
