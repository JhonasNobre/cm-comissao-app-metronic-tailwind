# 🔄 Notas de Migração: Bootstrap → Tailwind

Documentação das mudanças ao migrar do **Metronic v8.3.2 (Bootstrap)** para **Metronic Tailwind**.

---

## 📊 Comparativo Geral

| Aspecto | Projeto Antigo | Projeto Novo |
|---------|----------------|--------------|
| **Template** | Metronic v8.3.2 Demo1 | Metronic Tailwind |
| **Framework CSS** | Bootstrap 5 | Tailwind CSS 4 |
| **Angular** | 18.1.4 | 20.1.0 |
| **Node** | 18.x | 18.x |
| **TypeScript** | 5.4.x | 5.8.3 |
| **OAuth2 Library** | angular-oauth2-oidc 15.x | angular-oauth2-oidc 17.x |

---

## 🎨 Mudanças de Estilo

### Bootstrap → Tailwind: Mapeamento de Classes

#### Layout & Grid

| Bootstrap | Tailwind | Exemplo |
|-----------|----------|---------|
| `container` | `container mx-auto` | Container centralizado |
| `row` | `flex flex-wrap` | Grid row |
| `col-md-6` | `w-full md:w-1/2` | Coluna 50% em MD+ |
| `d-flex` | `flex` | Display flex |
| `justify-content-between` | `justify-between` | Space between |
| `align-items-center` | `items-center` | Vertical center |

#### Botões

| Bootstrap | Tailwind |
|-----------|----------|
| `btn btn-primary` | `btn btn-primary` (Metronic custom) |
| `btn btn-sm` | `btn btn-sm` |
| `btn btn-success` | `btn btn-success` |

> **Nota:** Metronic Tailwind mantém classes `btn-*` customizadas via Tailwind plugins.

#### Formulários

| Bootstrap | Tailwind |
|-----------|----------|
| `form-control` | `input` (Metronic custom) |
| `form-label` | `label` |
| `form-select` | `select` |
| `was-validated` | Classes customizadas Tailwind |

#### Cards

| Bootstrap | Tailwind (Metronic) |
|-----------|---------------------|
| `card` | `card` |
| `card-header` | `card-header` |
| `card-body` | `card-body` |
| `card-footer` | `card-footer` |

#### Tipografia

| Bootstrap | Tailwind |
|-----------|----------|
| `h1`, `h2`, ... `h6` | `text-3xl`, `text-2xl`, ... `text-sm` |
| `text-muted` | `text-gray-600` |
| `fw-bold` | `font-bold` |
| `text-center` | `text-center` |

#### Espaçamento

| Bootstrap | Tailwind |
|-----------|----------|
| `mt-3` | `mt-3` (equivalente: `mt-[0.75rem]`) |
| `mb-5` | `mb-5` |
| `p-4` | `p-4` |
| `px-3` | `px-3` |

**Importante:** Metronic Tailwind usa escala customizada, mas equivalências são mantidas.

---

## 🚨 Breaking Changes

### 1. **DataTables**

**Antigo (Bootstrap):**
```html
<table datatable [dtOptions]="dtOptions" class="table table-striped">
```

**Novo (Tailwind):**
```html
<table class="table table-rounded border border-gray-300">
  <!-- Metronic Tailwind tem componentes de tabela nativos -->
</table>
```

**Solução:** Criar componente `DataTableComponent` reutilizável com Tailwind.

---

### 2. **Modals**

**Antigo (Bootstrap):**
```typescript
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
```

**Novo (Tailwind):**
Metronic Tailwind usa componentes de modal customizados baseados em Tailwind + Headless UI.

**Solução:** Usar `ModalComponent` do Metronic Tailwind ou criar wrapper.

---

### 3. **Dropdowns**

**Antigo (Bootstrap):**
```html
<div ngbDropdown>
  <button ngbDropdownToggle>Menu</button>
  <div ngbDropdownMenu>...</div>
</div>
```

**Novo (Tailwind):**
```html
<div class="dropdown" data-kt-menu="true">
  <button class="btn" data-kt-menu-trigger>Menu</button>
  <div class="menu">...</div>
</div>
```

**Solução:** Usar sistema `data-kt-menu` do Metronic.

---

### 4. **Alerts & Toasts**

**Antigo (Bootstrap):**
```html
<div class="alert alert-success">Sucesso!</div>
```

**Novo (Tailwind):**
```html
<div class="alert alert-success">Sucesso!</div>
```

Classes `alert-*` são mantidas via plugins Tailwind do Metronic.

---

## 🔧 Mudanças Técnicas

### Angular 18 → 20

#### Standalone Components (Padrão)

**Antigo:**
```typescript
@NgModule({
  declarations: [UsuariosComponent],
  imports: [CommonModule, FormsModule]
})
export class UsuariosModule {}
```

**Novo (Standalone - Recomendado):**
```typescript
@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html'
})
export class UsuariosComponent {}
```

#### Injeção de Dependências

**Antigo:**
```typescript
constructor(private http: HttpClient) {}
```

**Novo (Opcional - inject function):**
```typescript
private http = inject(HttpClient);
```

---

### OAuth2 (15.x → 17.x)

**Mudanças principais:**
- API de configuração levemente diferente
- Melhor suporte para PKCE
- Tipos TypeScript mais estritos

**Configuração permanece similar:**
```typescript
this.oauthService.configure({
  issuer: 'http://localhost:8080/realms/clickmenos',
  clientId: 'clickmenos-frontend',
  responseType: 'code',
  scope: 'openid profile email',
  requireHttps: false
});
```

---

## 📝 Estratégia de Migração

### Fase 1: Configuração Base ✅
- [x] Atualizar `package.json`
- [x] Criar `README.md`
- [x] Estruturar `docs/`

### Fase 2: Autenticação
- [ ] Criar `AuthService` (copiar e adaptar do projeto antigo)
- [ ] Criar `AuthGuard`
- [ ] Criar `HttpInterceptor`

### Fase 3: Layout
- [ ] Traduzir menu para PT-BR
- [ ] Adaptar sidebar (copiar estrutura do antigo)
- [ ] Adaptar header (user info, logout)

### Fase 4: Componentes Compartilhados
- [ ] `DataTableComponent` (reescrever com Tailwind)
- [ ] `ModalComponent` (usar Metronic Tailwind)
- [ ] `LoadingComponent`
- [ ] `ErrorComponent`

### Fase 5: Módulos CRUD (um por vez)
Para cada módulo:
1. Copiar `service.ts` (sem mudanças, apenas ajustar imports)
2. Copiar models/interfaces (sem mudanças)
3. Copiar lógica TypeScript dos components
4. **Reescrever templates HTML** (Bootstrap → Tailwind)

---

## 🎯 Checklist de Migração de Componente

Ao migrar cada módulo CRUD, seguir:

- [ ] **1. Service:** Copiar e ajustar imports
- [ ] **2. Models:** Copiar interfaces TypeScript
- [ ] **3. Component TS:** Copiar lógica, ajustar standalone imports
- [ ] **4. Template HTML:** 
  - [ ] Substituir classes Bootstrap por Tailwind
  - [ ] Atualizar estrutura de formulários
  - [ ] Adaptar modals
  - [ ] Ajustar datatables
- [ ] **5. Roteamento:** Adicionar em `app.routes.ts`
- [ ] **6. Menu:** Adicionar item no sidebar
- [ ] **7. Testar:** CRUD completo funcionando

---

## 🔍 Componentes Tailwind do Metronic

O Metronic Tailwind oferece componentes prontos via classes customizadas:

### Buttons
```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-success btn-sm">Small Success</button>
```

### Cards
```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Título</h3>
  </div>
  <div class="card-body">Conteúdo</div>
</div>
```

### Tables
```html
<table class="table table-rounded table-striped border">
  <thead>
    <tr class="fw-bold text-muted">
      <th>Nome</th>
      <th>Email</th>
    </tr>
  </thead>
  <tbody>...</tbody>
</table>
```

### Forms
```html
<div class="mb-3">
  <label class="form-label">Nome</label>
  <input type="text" class="form-control" />
</div>
```

---

## 📚 Referências

- **Metronic Tailwind Docs:** [metronic_guide.md](metronic_guide.md)
- **Tailwind CSS Docs:** https://tailwindcss.com/docs
- **Angular 20 Docs:** https://angular.dev
- **Projeto Antigo:** `../cm-comissao-app-metronic/`

---

## ✅ Status da Migração

| Módulo | Status | Observações |
|--------|--------|-------------|
| **Autenticação** | 🟡 Em andamento | - |
| **Layout Base** | ⚪ Pendente | - |
| **Usuários** | ⚪ Pendente | - |
| **Equipes** | ⚪ Pendente | - |
| **Perfis** | ⚪ Pendente | - |
| **Comissões** | ⚪ Pendente | - |
| **Produtos** | ⚪ Pendente | - |

**Última atualização:** 30/11/2025
