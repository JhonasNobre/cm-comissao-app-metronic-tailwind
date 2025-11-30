# 🏢 Clickmenos - Sistema de Gestão de Comissões

Frontend do sistema de gestão de comissões imobiliárias, construído com **Angular 20** e **Metronic Tailwind**.

---

## 🎯 Visão Geral

Sistema web para gestão de comissões de corretores de imóveis com:
- ✅ Autenticação centralizada via **Keycloak** (OIDC/PKCE)
- ✅ **Multitenancy** (isolamento por imobiliária)
- ✅ **RBAC** (controle de acesso baseado em roles)
- ✅ CRUD completo: Usuários, Equipes, Perfis, Comissões, Produtos

---

## 🛠️ Tech Stack

| Categoria | Tecnologia | Versão |
|-----------|------------|--------|
| **Framework** | Angular | 20.1.0 |
| **UI Template** | Metronic Tailwind | Latest |
| **CSS Framework** | Tailwind CSS | 4.1.11 |
| **Autenticação** | Keycloak (OIDC) | 23.0 |
| **OAuth2 Library** | angular-oauth2-oidc | 17.0.2 |
| **HTTP Client** | @angular/common/http | 20.1.0 |
| **State Management** | RxJS | 7.8.0 |

---

## 📦 Pré-requisitos

Certifique-se de ter instalado:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** 9+ (incluído com Node.js)
- **Angular CLI** 20+ (`npm install -g @angular/cli`)
- **Docker Desktop** (para Keycloak local) ([Download](https://www.docker.com/products/docker-desktop))

### Verificar instalações:

```bash
node --version    # Deve exibir: v18.x ou superior
npm --version     # Deve exibir: 9.x ou superior
ng version        # Deve exibir: Angular CLI 20.x
docker --version  # Deve exibir: Docker version 24.x
```

---

## 🚀 Instalação e Configuração

### 1️⃣ Clonar o repositório

```bash
cd c:\Users\Jhonas\source\repos\ClickMenosComissao\cm-comissao-app-metronic-tailwind
```

### 2️⃣ Instalar dependências

```bash
npm install
```

### 3️⃣ Configurar Frontend no Keycloak

> [!IMPORTANT]
> **Use o Keycloak que já está rodando para a API!** Não inicie outro.

O frontend usa o **mesmo Keycloak** da API (`cm-keycloak` na porta 8080).

Siga o guia: [docs/setup/KEYCLOAK_SETUP.md](docs/setup/KEYCLOAK_SETUP.md)

**TL;DR:**
1. Acesse: http://localhost:8080/admin (login: `admin` / `admin`)
2. No realm `clickmenos`, crie o client `clickmenos-frontend`
3. Configure redirect URIs: `http://localhost:4200/*`
4. Habilite PKCE (S256)

### 4️⃣ Iniciar o servidor de desenvolvimento

```bash
npm start
```

Acesse: **http://localhost:4200**

---

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── core/                    # Serviços core, guards, interceptors
│   │   ├── auth/                # Autenticação (Keycloak)
│   │   ├── interceptors/        # HTTP interceptors
│   │   ├── models/              # Interfaces TypeScript
│   │   └── services/            # Serviços base (API, HTTP)
│   ├── layouts/                 # Layouts (header, sidebar, footer)
│   ├── pages/                   # Páginas da aplicação
│   │   ├── auth/                # Login, callback
│   │   ├── usuarios/            # CRUD Usuários
│   │   ├── equipes/             # CRUD Equipes
│   │   ├── perfis/              # CRUD Perfis de Acesso
│   │   ├── comissoes/           # CRUD Comissões
│   │   └── produtos/            # CRUD Produtos
│   ├── partials/                # Componentes parciais (Metronic)
│   └── shared/                  # Componentes compartilhados
├── environments/                # Configurações por ambiente
└── public/                      # Assets estáticos (do Metronic)
```

---

## 🔐 Autenticação

O sistema usa **Keycloak** com **PKCE flow** (Authorization Code + Proof Key for Code Exchange).

### Fluxo de Login:

1. Usuário clica em "Login"
2. Redirecionado para Keycloak (`http://localhost:8080`)
3. Após autenticação, retorna com `code`
4. Frontend troca `code` por `access_token` (JWT)
5. Token armazenado em `localStorage`
6. Token enviado em toda requisição: `Authorization: Bearer {token}`

### Usuário de Teste:

- **Username:** `jhonas.teste`
- **Password:** `teste123`
- **Role:** `gestor-imobiliaria`
- **Imobiliária:** `Imobiliaria_1`

---

## 🏗️ Arquitetura

### Multitenancy

Cada usuário pertence a **um grupo** no Keycloak representando sua imobiliária:

```
Grupo: /Imobiliaria_1
Atributo: id_imobiliaria = 1
```

O backend extrai `id_imobiliaria` do token JWT e filtra **automaticamente** todos os dados.

### RBAC (Roles)

| Role | Descrição | Permissões |
|------|-----------|------------|
| `admin-clickmenos` | Super admin | Acesso total, todas imobiliárias |
| `gestor-imobiliaria` | Gestor | CRUD completo na sua imobiliária |
| `corretor` | Corretor | Visualização e edição limitada |

---

## 🧪 Testes

### Testes Unitários (Jasmine/Karma)

```bash
npm test
```

### Testes E2E (Futuro - Cypress)

```bash
npm run e2e
```

---

## 📚 Documentação Adicional

- **[Guia de Migração](docs/MIGRATION_NOTES.md)** - Diferenças Bootstrap → Tailwind
- **[Configuração Keycloak](docs/setup/KEYCLOAK_SETUP.md)** - Setup completo do Keycloak
- **[Referência da API](../cm-comissao-api/docs/START_HERE.md)** - Documentação do backend

---

## 🔗 URLs Importantes

| Ambiente | URL |
|----------|-----|
| **Frontend (Dev)** | http://localhost:4200 |
| **Backend API** | https://localhost:5001 |
| **Swagger (API)** | https://localhost:5001/swagger |
| **Keycloak Admin** | http://localhost:8080/admin |
| **Keycloak Realm** | http://localhost:8080/realms/clickmenos |

---

## 🤝 Contribuindo

1. Sempre atualizar `docs/ai-context.yml` em mudanças significativas
2. Seguir padrões do Angular Style Guide
3. Usar Tailwind classes (evitar CSS customizado)
4. Testar antes de commit
5. Documentar mudanças arquiteturais

---

## 📝 Notas Importantes

- ⚠️ **Multitenancy é crítico:** Backend filtra automaticamente por `id_imobiliaria`
- ⚠️ **Token JWT:** Expira em 5 minutos (refresh automático implementado)
- ⚠️ **CORS:** Keycloak deve ter `http://localhost:4200` nos Web Origins

---

## 📞 Suporte

- 📧 Email: suporte@vintenovetech.com
- 🐛 Issues: [GitHub Issues](https://github.com/VinteNoveTech/clickmenos-frontend/issues)

---

**Desenvolvido com ❤️ pela equipe VinteNove Tech**
