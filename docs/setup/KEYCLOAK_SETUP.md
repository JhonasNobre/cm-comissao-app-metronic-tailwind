# 🔐 Guia de Configuração do Keycloak

Este guia detalha como configurar o Keycloak para o sistema Clickmenos.

---

## 📋 Pré-requisitos

- **Docker Desktop** instalado e rodando
- **Porta 8080** disponível (Keycloak)
- **Porta 5433** disponível (PostgreSQL do Keycloak)

---

## 🚀 Passo 1: Iniciar Containers

### 1.1. Iniciar Docker Compose

Na pasta raiz do projeto frontend (`cm-comissao-app-metronic-tailwind/`):

```bash
docker-compose up -d
```

### 1.2. Verificar Status

```bash
docker-compose ps
```

Você deve ver:

```
NAME                          STATUS
clickmenos-keycloak          Up (healthy)
clickmenos-frontend-postgres Up (healthy)
```

### 1.3. Aguardar Inicialização

O Keycloak pode levar **1-2 minutos** para inicializar completamente. Aguarde até que o healthcheck mostre `(healthy)`.

---

## 🔐 Passo 2: Acessar Console Admin

### 2.1. Abrir Browser

Acesse: **http://localhost:8080/admin**

### 2.2. Fazer Login

- **Username:** `admin`
- **Password:** `admin`

---

## 🏢 Passo 3: Criar Realm

### 3.1. Criar Realm "clickmenos"

1. No menu lateral esquerdo, clique no dropdown do realm (padrão: **master**)
2. Clique em **"Create Realm"**
3. Preencha:
   - **Realm name:** `clickmenos`
   - **Enabled:** ✅ ON
4. Clique em **"Create"**

---

## 🔌 Passo 4: Criar Clients

### 4.1. Client: clickmenos-frontend (Frontend Angular)

#### Criar Client

1. No menu lateral, vá em **"Clients"**
2. Clique em **"Create client"**
3. **General Settings:**
   - **Client type:** `OpenID Connect`
   - **Client ID:** `clickmenos-frontend`
4. Clique em **"Next"**

#### Capability Config

5. **Authentication flow:**
   - ✅ **Standard flow** (ON)
   - ✅ **Direct access grants** (ON)
   - ⬜ **Implicit flow** (OFF)
   - ⬜ **Service accounts roles** (OFF)
6. Clique em **"Next"**

#### Login Settings

7. Preencha:
   - **Root URL:** `http://localhost:4200`
   - **Home URL:** `http://localhost:4200`
   - **Valid redirect URIs:** `http://localhost:4200/*`
   - **Valid post logout redirect URIs:** `http://localhost:4200/*`
   - **Web origins:** `http://localhost:4200`
8. Clique em **"Save"**

#### Advanced Settings (PKCE)

9. Na aba **"Advanced"**, role até **"Advanced settings"**:
   - **Proof Key for Code Exchange Code Challenge Method:** `S256`
10. Clique em **"Save"**

---

### 4.2. Client: clickmenos-backend (Backend API)

#### Criar Client

1. Vá em **"Clients"** → **"Create client"**
2. **General Settings:**
   - **Client type:** `OpenID Connect`
   - **Client ID:** `clickmenos-backend`
3. Clique em **"Next"**

#### Capability Config

4. **Authentication flow:**
   - ⬜ **Standard flow** (OFF)
   - ⬜ **Direct access grants** (OFF)
   - ⬜ **Implicit flow** (OFF)
   - ⬜ **Service accounts roles** (OFF)
   - ✅ **OAuth 2.0 Device Authorization Grant** (OFF)
   - **Client authentication:** ✅ ON (Bearer-only client)
5. Clique em **"Next"**
6. Clique em **"Save"**

---

## 👥 Passo 5: Criar Roles

### 5.1. Criar Roles do Realm

1. No menu lateral, vá em **"Realm roles"**
2. Clique em **"Create role"**

#### Role: admin-clickmenos

3. Preencha:
   - **Role name:** `admin-clickmenos`
   - **Description:** `Super administrador do sistema Clickmenos`
4. Clique em **"Save"**

#### Role: gestor-imobiliaria

5. Clique em **"Create role"** novamente
6. Preencha:
   - **Role name:** `gestor-imobiliaria`
   - **Description:** `Gestor de uma imobiliária`
7. Clique em **"Save"**

#### Role: corretor

8. Clique em **"Create role"** novamente
9. Preencha:
   - **Role name:** `corretor`
   - **Description:** `Corretor de imóveis`
10. Clique em **"Save"**

---

## 🏘️ Passo 6: Criar Grupos (Multitenancy)

### 6.1. Criar Grupo "Imobiliaria_1"

1. No menu lateral, vá em **"Groups"**
2. Clique em **"Create group"**
3. Preencha:
   - **Name:** `Imobiliaria_1`
4. Clique em **"Create"**

### 6.2. Adicionar Atributo `id_imobiliaria`

5. Clique no grupo **"Imobiliaria_1"** que você acabou de criar
6. Vá na aba **"Attributes"**
7. Clique em **"Add an attribute"**
8. Preencha:
   - **Key:** `id_imobiliaria`
   - **Value:** `1`
9. Clique em **"Save"**

---

## 👤 Passo 7: Criar Usuário de Teste

### 7.1. Criar Usuário

1. No menu lateral, vá em **"Users"**
2. Clique em **"Add user"**
3. Preencha:
   - **Username:** `jhonas.teste`
   - **Email:** `jhonas.teste@clickmenos.com`
   - **First name:** `Jhonas`
   - **Last name:** `Teste`
   - **Email verified:** ✅ ON
   - **Enabled:** ✅ ON
4. Clique em **"Create"**

### 7.2. Definir Senha

5. Vá na aba **"Credentials"**
6. Clique em **"Set password"**
7. Preencha:
   - **Password:** `teste123`
   - **Password confirmation:** `teste123`
   - **Temporary:** ⬜ OFF (para não pedir troca de senha no primeiro login)
8. Clique em **"Save"**
9. Confirme clicando em **"Save password"**

### 7.3. Atribuir Role

10. Vá na aba **"Role mapping"**
11. Clique em **"Assign role"**
12. Filtre por **"Filter by realm roles"**
13. Selecione **"gestor-imobiliaria"**
14. Clique em **"Assign"**

### 7.4. Adicionar ao Grupo

15. Vá na aba **"Groups"**
16. Clique em **"Join group"**
17. Selecione **"Imobiliaria_1"**
18. Clique em **"Join"**

---

## 🔧 Passo 8: Configurar Client Scopes (Mappers)

### 8.1. Mapear Roles no Token

1. Vá em **"Client scopes"** no menu lateral
2. Clique em **"roles"**
3. Vá na aba **"Mappers"**
4. Verifique se existe um mapper chamado **"realm roles"**
   - Se não existir, clique em **"Add mapper"** → **"By configuration"** → **"User Realm Role"**
   - Configure:
     - **Name:** `realm roles`
     - **Token Claim Name:** `roles`
     - **Add to ID token:** ✅ ON
     - **Add to access token:** ✅ ON
     - **Add to userinfo:** ✅ ON
   - Clique em **"Save"**

### 8.2. Mapear Groups no Token

1. Vá em **"Client scopes"** → **"roles"** → **"Mappers"**
2. Clique em **"Add mapper"** → **"By configuration"** → **"Group Membership"**
3. Configure:
   - **Name:** `groups`
   - **Token Claim Name:** `groups`
   - **Full group path:** ✅ ON
   - **Add to ID token:** ✅ ON
   - **Add to access token:** ✅ ON
   - **Add to userinfo:** ✅ ON
4. Clique em **"Save"**

### 8.3. Mapear Atributos do Grupo no Token

1. Ainda em **"Mappers"**, clique em **"Add mapper"** → **"By configuration"** → **"User Attribute"**
2. Configure:
   - **Name:** `id_imobiliaria`
   - **User Attribute:** `id_imobiliaria`
   - **Token Claim Name:** `id_imobiliaria`
   - **Claim JSON Type:** `String`
   - **Add to ID token:** ✅ ON
   - **Add to access token:** ✅ ON
   - **Add to userinfo:** ✅ ON
3. Clique em **"Save"**

---

## ✅ Passo 9: Testar Configuração

### 9.1. Obter Token via Postman/curl

```bash
curl -X POST http://localhost:8080/realms/clickmenos/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=clickmenos-frontend" \
  -d "grant_type=password" \
  -d "username=jhonas.teste" \
  -d "password=teste123"
```

Você deve receber um `access_token`.

### 9.2. Decodificar Token

Copie o `access_token` e cole em: **https://jwt.io**

Verifique se o token contém:
- `"roles": ["gestor-imobiliaria"]`
- `"groups": ["/Imobiliaria_1"]`

---

## 🎉 Conclusão

Configuração do Keycloak concluída! Agora você pode:

✅ Fazer login com `jhonas.teste` / `teste123`
✅ Token JWT contém roles e grupos
✅ Backend extrai `id_imobiliaria` do token automaticamente

---

## 🔄 Comandos Úteis

### Parar containers
```bash
docker-compose down
```

### Reiniciar containers
```bash
docker-compose restart
```

### Ver logs do Keycloak
```bash
docker-compose logs -f keycloak
```

### Resetar tudo (CUIDADO: apaga todos os dados)
```bash
docker-compose down -v
docker-compose up -d
```

---

## 🆘 Troubleshooting

### Porta 8080 já em uso

```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Ou altere a porta no docker-compose.yml:
# ports:
#   - "8081:8080"
```

### Keycloak não inicia

```bash
# Ver logs
docker-compose logs keycloak

# Recriar container
docker-compose down
docker-compose up -d
```

### Não consigo acessar http://localhost:8080

- Aguarde 1-2 minutos após `docker-compose up`
- Verifique: `docker-compose ps` → deve mostrar `(healthy)`
- Verifique Docker Desktop → Containers devem estar rodando

---

**Configuração completa! 🚀**
