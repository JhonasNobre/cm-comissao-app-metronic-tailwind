# 🔐 Guia de Configuração do Keycloak - Frontend

Este guia detalha como configurar o **frontend** no Keycloak **existente** (que já roda para a API).

> [!IMPORTANT]
> **Você NÃO precisa iniciar outro Keycloak!** Use o mesmo que já está rodando para a API (`cm-keycloak` na porta 8080).

> [!WARNING]
> **Mudança Planejada (Futuro):**
> - **Atual:** `imobiliaria_{UUID}` e `id_imobiliaria`
> - **Futuro:** `empresa_{UUID}` e `id_empresa`
> - Quando a mudança acontecer, este guia será atualizado

---

## 📋 Pré-requisitos

- ✅ **Keycloak já rodando** (container `cm-keycloak` da API)
- ✅ **Porta 8080** acessível
- ✅ **Realm `clickmenos`** já criado (pela API)

---

## 🚀 Passo 1: Verificar Keycloak da API

### 1.1. Confirmar que está rodando

Verifique no Docker Desktop ou via comando:

```bash
docker ps | findstr keycloak
```

Você deve ver:
```
cm-keycloak    Up (healthy)    8080:8080
```

### 1.2. Acessar Console Admin

Acesse: **http://localhost:8080/admin**

**Login:**
- **Username:** `admin`
- **Password:** `admin` (ou a senha configurada na API)

---

## 🏢 Passo 2: Selecionar Realm

1. No menu superior esquerdo, selecione o realm **`clickmenos`** (já deve existir)
2. Se não existir, crie conforme documentação da API

---

## 🔌 Passo 3: Criar Client do Frontend

> [!NOTE]
> O client `cm-comissao-api` (backend) já deve existir. Você vai criar apenas o client do **frontend**.

### 3.1. Verificar se já existe

1. No menu lateral, vá em **"Clients"**
2. Procure por `clickmenos-frontend`
3. Se **já existir**, pule para o Passo 4
4. Se **não existir**, continue:

### 3.2. Criar Client

1. Clique em **"Create client"**
2. **General Settings:**
   - **Client type:** `OpenID Connect`
   - **Client ID:** `clickmenos-frontend`
3. Clique em **"Next"**

### 3.3. Capability Config

4. **Authentication flow:**
   - ✅ **Standard flow** (ON)
   - ✅ **Direct access grants** (ON)
   - ⬜ **Implicit flow** (OFF)
   - ⬜ **Service accounts roles** (OFF)
   - **Client authentication:** ⬜ OFF (public client)
5. Clique em **"Next"**

### 3.4. Login Settings

6. Preencha:
   - **Root URL:** `http://localhost:4200`
   - **Home URL:** `http://localhost:4200`
   - **Valid redirect URIs:** `http://localhost:4200/*`
   - **Valid post logout redirect URIs:** `http://localhost:4200/*`
   - **Web origins:** `http://localhost:4200`
7. Clique em **"Save"**

### 3.5. Configurar PKCE

8. Clique no client `clickmenos-frontend` que você acabou de criar
9. Vá na aba **"Advanced"**
10. Role até **"Advanced settings"**
11. Configure:
    - **Proof Key for Code Exchange Code Challenge Method:** `S256`
12. Clique em **"Save"**

---

## 👥 Passo 4: Verificar/Criar Roles

> [!NOTE]
> As roles são compartilhadas entre API e Frontend. Verifique se já existem.

### 4.1. Verificar Roles Existentes

1. No menu lateral, vá em **"Realm roles"**
2. Veja quais roles já existem

### 4.2. Criar Roles Necessárias

Se as roles abaixo **NÃO existirem**, crie-as:

#### Role: `Admin`

1. Clique em **"Create role"**
2. Preencha:
   - **Role name:** `Admin`
   - **Description:** `Administrador do sistema`
3. Clique em **"Save"**

#### Role: `Gestor`

1. Clique em **"Create role"**
2. Preencha:
   - **Role name:** `Gestor`
   - **Description:** `Gestor de equipe`
3. Clique em **"Save"**

#### Role: `Vendedor`

1. Clique em **"Create role"**
2. Preencha:
   - **Role name:** `Vendedor`
   - **Description:** `Vendedor`
3. Clique em **"Save"**

> [!IMPORTANT]
> **Compatibilidade com Backend:**
> - O backend verifica a role `admin-clickmenos` em alguns lugares
> - Mas também aceita `Admin` conforme documentação
> - Se houver problemas de autorização, pode ser necessário criar também `admin-clickmenos`

---

## 🏘️ Passo 5: Verificar Grupo (Multitenancy)

> [!NOTE]
> O backend extrai `id_imobiliaria` do grupo do usuário no formato: `imobiliaria_{UUID}`

### 5.1. Verificar Grupo Existente

1. No menu lateral, vá em **"Groups"**
2. Confirme que existe um grupo com formato: `imobiliaria_{UUID}`
   - Exemplo: `imobiliaria_550e8400-e29b-41d4-a716-446655440000`

### 5.2. Criar Novo Grupo (se necessário)

Se precisar criar um grupo para uma nova imobiliária:

1. Clique em **"Create group"**
2. **Name:** `imobiliaria_{UUID}` 
   - **Importante:** Use um UUID válido (pode gerar em https://www.uuidgenerator.net/)
   - Exemplo: `imobiliaria_a1b2c3d4-e5f6-7890-abcd-ef1234567890`
3. Clique em **"Create"**

> [!WARNING]
> **Mudança Futura:**
> - O formato atual é: `imobiliaria_{UUID}`
> - Em breve será alterado para: `empresa_{UUID}`
> - Quando isso acontecer, todos os grupos existentes precisarão ser renomeados

---

## 👤 Passo 6: Verificar/Configurar Usuário de Teste

### 6.1. Verificar se usuário existe

1. No menu lateral, vá em **"Users"**
2. Procure por `jhonas.teste` ou outro usuário de teste
3. Se já existe, vá para **6.2**
4. Se não existe, crie conforme documentação da API

### 6.2. Atribuir Role ao Usuário

1. Clique no usuário (ex: `jhonas.teste`)
2. Vá na aba **"Role mapping"**
3. Clique em **"Assign role"**
4. Filtre por **"Filter by realm roles"**
5. Selecione a role adequada (ex: `Gestor` ou `Admin`)
6. Clique em **"Assign"**

### 6.3. Adicionar ao Grupo

1. Vá na aba **"Groups"**
2. Clique em **"Join group"**
3. Selecione o grupo `imobiliaria_{UUID}`
4. Clique em **"Join"**

---

## 🔧 Passo 7: Configurar Client Scopes (Mappers)

Para que o token JWT contenha as informações necessárias, configure os mappers:

### 7.1. Mapear Groups no Token

1. Vá em **"Client scopes"** no menu lateral
2. Procure um scope chamado `roles` ou crie um novo
3. Vá na aba **"Mappers"**
4. Verifique se existe um mapper **"groups"**
5. Se não existir, clique em **"Add mapper"** → **"By configuration"** → **"Group Membership"**
6. Configure:
   - **Name:** `groups`
   - **Token Claim Name:** `groups`
   - **Full group path:** ✅ ON
   - **Add to ID token:** ✅ ON
   - **Add to access token:** ✅ ON
   - **Add to userinfo:** ✅ ON
7. Clique em **"Save"**

### 7.2. Mapear Roles no Token

1. Ainda em **"Client scopes"** → **"Mappers"**
2. Verifique se existe um mapper para roles
3. Se não existir, clique em **"Add mapper"** → **"By configuration"** → **"User Realm Role"**
4. Configure:
   - **Name:** `realm-roles`
   - **Token Claim Name:** `realm_access.roles`
   - **Add to ID token:** ✅ ON
   - **Add to access token:** ✅ ON
   - **Add to userinfo:** ✅ ON
5. Clique em **"Save"**

### 7.3. Vincular Scope ao Client Frontend

1. Vá em **"Clients"** → `clickmenos-frontend`
2. Vá na aba **"Client scopes"**
3. Clique em **"Add client scope"**
4. Selecione o scope que contém os mappers (ex: `roles`)
5. Escolha **"Default"**
6. Clique em **"Add"**

---

## ✅ Passo 8: Testar Configuração

### 8.1. Obter Token de Teste

Teste se o token contém as informações corretas:

```bash
curl -X POST http://localhost:8080/realms/clickmenos/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=clickmenos-frontend" \
  -d "grant_type=password" \
  -d "username=jhonas.teste" \
  -d "password=<SENHA_DO_USUARIO>"
```

### 8.2. Decodificar Token

1. Copie o `access_token` da resposta
2. Cole em: **https://jwt.io**
3. Verifique se o token contém:

```json
{
  "realm_access": {
    "roles": ["Admin", "Gestor", "ou Vendedor"]
  },
  "groups": ["/imobiliaria_550e8400-e29b-41d4-a716-446655440000"]
}
```

> [!IMPORTANT]
> **O que o Backend espera:**
> - **Claim `groups`:** valor como `imobiliaria_{UUID}` (pode vir com ou sem `/` no início)
> - **Claim `realm_access.roles`:** array com roles do usuário
> - O backend extrai o UUID fazendo: `groupsClaim.Replace("imobiliaria_", "").Replace("/", "")`

---

## 🎉 Conclusão

Configuração do frontend no Keycloak concluída! Agora você tem:

✅ Client `clickmenos-frontend` configurado (PKCE, redirect URIs)
✅ Roles criadas (`Admin`, `Gestor`, `Vendedor`)
✅ Grupos no formato `imobiliaria_{UUID}`
✅ Mappers configurados (groups, roles)
✅ Token JWT com informações necessárias

---

## 🔄 Próximos Passos

1. ✅ Keycloak configurado para frontend
2. 📝 Prosseguir para Fase 3: Implementar autenticação no Angular
3. 🔧 Criar `AuthService`, `AuthGuard`, `HttpInterceptor`
4. 🧪 Testar login end-to-end

---

## 📝 Notas sobre Mudança Futura

Quando a migração de `imobiliaria` → `empresa` acontecer:

### Backend (API)
- Alterar `TenantService.cs`:
  ```csharp
  // De:
  if (groupsClaim.StartsWith("imobiliaria_"))
  
  // Para:
  if (groupsClaim.StartsWith("empresa_"))
  ```
- Renomear coluna no banco: `id_imobiliaria` → `id_empresa`
- Atualizar migrations

### Keycloak
- Renomear todos os grupos:
  - De: `imobiliaria_{UUID}`
  - Para: `empresa_{UUID}`

### Frontend
- Atualizar textos na UI
- Variáveis/funções com "imobiliaria" → "empresa"

---

**Configuração completa! 🚀**
