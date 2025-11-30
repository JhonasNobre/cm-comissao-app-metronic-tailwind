# 🧪 Plano de Testes - Autenticação e Integração

Este documento detalha como testar o frontend e a API após a atualização para a nomenclatura `empresa`.

---

## 🎯 Objetivo

Validar que:
1. ✅ Frontend autentica corretamente via Keycloak
2. ✅ Token JWT contém `groups` com formato `empresa_{UUID}`
3. ✅ API extrai `id_empresa` corretamente do token
4. ✅ Multitenancy funciona (filtro por empresa)
5. ✅ Roles e permissões funcionam

---

##  Pré-requisitos

- ✅ **API** rodando na branch atualizada (`empresa` nomenclature)
- ✅ **Frontend** com código atualizado (push já feito)
- ✅ **Keycloak** com grupos migrados para `empresa_{UUID}`
- ✅ **Usuário de teste** configurado no grupo correto

---

## 📋 Checklist de Configuração do Keycloak

Antes de testar, confirme que o Keycloak está configurado:

### 1. Deletar Grupos Antigos

```md
- [ ] Acessar Keycloak Admin (http://localhost:8080/admin)
- [ ] Ir em Groups
- [ ] Deletar todos os grupos `imobiliaria_*`
```

### 2. Criar Novo Grupo

```md
- [ ] Criar grupo: `empresa_550e8400-e29b-41d4-a716-446655440000` (ou outro UUID)
- [ ] Anotar o UUID para testes
```

### 3. Atualizar Usuário de Teste

```md
- [ ] Remover usuário do grupo antigo (se aplicável)
- [ ] Adicionar usuário ao grupo `empresa_{UUID}`
- [ ] Verificar que usuário tem role atribuída (Admin, Gestor ou Vendedor)
```

### 4. Verificar Client Frontend

```md
- [ ] Client `clickmenos-frontend` existe
- [ ] PKCE habilitado (S256)
- [ ] Redirect URIs configuradas: http://localhost:4200/*
- [ ] Scopes: profile, email, roles, web-origins
```

---

## 🧪 Testes do Frontend

### Teste 1: Verificar Compilação

```bash
cd cm-comissao-app-metronic-tailwind
npm install
npm start
```

**Resultado esperado:**
- ✅ Sem erros de compilação
- ✅ Aplicação sobe em `http://localhost:4200`

---

### Teste 2: Testar Redirect para Keycloak

1. Acesse: `http://localhost:4200`
2. Deve redirecionar automaticamente para Keycloak
3. Faça login com `jhonas.teste` / `teste123`

**Resultado esperado:**
- ✅ Redirecionamento para Keycloak funciona
- ✅ Login bem-sucedido
- ✅ Redirecionamento de volta para frontend

---

### Teste 3: Inspecionar Token JWT

No navegador (F12 → Console):

```javascript
// Ver token
localStorage.getItem('access_token')

// Decodificar em jwt.io
```

**Verificar que o token contém:**

```json
{
  "realm_access": {
    "roles": ["Admin", "Gestor", "ou Vendedor"]
  },
  "groups": ["/empresa_550e8400-e29b-41d4-a716-446655440000"]
}
```

**Resultado esperado:**
- ✅ Claim `groups` com formato `/empresa_{UUID}`
- ✅ Claim `realm_access.roles` com role do usuário

---

### Teste 4: Testar AuthService

No console do navegador:

```javascript
// Obter serviço (se tiver acesso via DevTools Angular)
// Ou criar um componente de debug

authService.isAuthenticated() // deve retornar true
authService.getIdEmpresa()    // deve retornar UUID da empresa
authService.getUserRoles()    // deve retornar array de roles
auth Service.isAdmin()        // true/false conforme role
```

**Resultado esperado:**
- ✅ `getIdEmpresa()` retorna UUID correto
- ✅ `getUserRoles()` retorna roles do usuário
- ✅ Métodos de verificação de role funcionam

---

## 🔌 Testes da API

### Teste 5: Chamar Endpoint Protegido

No Postman ou curl:

```bash
# 1. Obter token
curl -X POST http://localhost:8080/realms/clickmenos/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=cm-comissao-api" \
  -d "client_secret=SEU_SECRET_AQUI" \
  -d "grant_type=password" \
  -d "username=jhonas.teste" \
  -d "password=teste123"

# 2. Usar token para chamar API
curl -X GET https://localhost:5001/api/v1/usuarios \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resultado esperado:**
- ✅ API aceita o token
- ✅ Retorna apenas usuários da empresa do usuário logado
- ✅ Multitenancy funciona (não retorna dados de outras empresas)

---

### Teste 6: Verificar Logs da API

NO terminal da API, procure por logs como:

```
[INF] Usuário autenticado. ID Empresa extraído: 550e8400-e29b-41d4-a716-446655440000
```

**Resultado esperado:**
- ✅ API extrai `id_empresa` corretamente do token
- ✅ Filtros de multitenancy são aplicados

---

## 🔄 Teste Integrado (Frontend + API)

### Teste 7: Chamada do Frontend para API

1. Frontend autenticado
2. Fazer uma chamada à API (ex: listar usuários)
3. Verificar que:
   - Token é anexado automaticamente (HTTP Interceptor)
   - API retorna dados filtrados por empresa
   - Não há erros 401/403

**Código de exemplo (se tiver um componente criado):**

```typescript
// No componente
constructor(private http: HttpClient) {}

ngOnInit() {
  this.http.get('https://localhost:5001/api/v1/usuarios').subscribe({
    next: (data) => console.log('Usuários:', data),
    error: (err) => console.error('Erro:', err)
  });
}
```

**Resultado esperado:**
- ✅ Requisição inclui header `Authorization: Bearer ...`
- ✅ API retorna 200 OK
- ✅ Dados filtrados pela empresa do usuário

---

## ✅ Checklist Final

```md
- [ ] Frontend compila sem erros
- [ ] Login no Keycloak funciona
- [ ] Token contém `groups` com `empresa_{UUID}`
- [ ] AuthService extrai `id_empresa` corretamente
- [ ] API aceita token do frontend
- [ ] Multitenancy funciona (filtro por empresa)
- [ ] HTTP Interceptor anexa token automaticamente
- [ ] Logout funciona
```

---

## 🐛 Troubleshooting

### Erro: "Claim groups não encontrado"

**Causa:** Mapper de groups não configurado no Keycloak

**Solução:**
1. Keycloak → Client scopes → roles → Mappers
2. Adicionar mapper "Group Membership"
3. Token Claim Name: `groups`
4. Full group path: ON

---

### Erro: "Grupo de empresa não encontrado"

**Causa:** Usuário não está no grupo `empresa_{UUID}`

**Solução:**
1. Keycloak → Users → jhonas.teste → Groups
2. Join grupo `empresa_{UUID}`

---

### Erro 401 na API

**Causa:** Token inválido ou expirado

**Solução:**
1. Verificar se Keycloak está rodando
2. Fazer logout e login novamente
3. Verificar configuração do realm na API

---

### Erro 403 na API

**Causa:** Usuário sem permissão

**Solução:**
1. Verificar roles do usuário no Keycloak
2. Verificar que API está validando roles corretamente

---

**Boa sorte nos testes! 🚀**
