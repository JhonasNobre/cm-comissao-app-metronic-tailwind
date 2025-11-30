# 🔐 Guia de Configuração do Keycloak

Este guia detalha como configurar o **frontend** no Keycloak **existente** (que já roda para a API).

---

## 📋 Pré-requisitos

- ✅ **Keycloak já rodando** (container `cm-keycloak` da API)
- ✅ **Porta 8080** acessível
- ✅ **Realm `clickmenos`** já criado (pela API)

> [!IMPORTANT]
> **Você NÃO precisa iniciar outro Keycloak!** Use o mesmo que já está rodando para a API.

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

### 3.1. Client: clickmenos-frontend

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
   - **Client authentication:** ⬜ OFF (public client)
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

9. Clique no client `clickmenos-frontend` que você acabou de criar
10. Vá na aba **"Advanced"**
11. Role até **"Advanced settings"**:
    - **Proof Key for Code Exchange Code Challenge Method:** `S256`
12. Clique em **"Save"**

---

## 👥 Passo 4: Verificar Roles

> [!NOTE]
> As roles já devem existir (criadas pela configuração da API). Apenas verifique se estão lá.

1. No menu lateral, vá em **"Realm roles"**
2. Confirme que existem:
   - ✅ `admin-clickmenos`
   - ✅ `gestor-imobiliaria`
   - ✅ `corretor`

Se não existirem, crie-as conforme documentação da API.

---

## 🏘️ Passo 5: Verificar Grupos

> [!NOTE]
> O grupo `Imobiliaria_1` já deve existir. Apenas verifique.

1. No menu lateral, vá em **"Groups"**
2. Confirme que existe o grupo **`Imobiliaria_1`**
3. Clique nele e verifique se tem o atributo:
   - **Key:** `id_imobiliaria`
   - **Value:** `1`

---

## 👤 Passo 6: Verificar/Criar Usuário de Teste

Se já existe um usuário de teste na API, você pode usar o mesmo. Caso contrário:

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
