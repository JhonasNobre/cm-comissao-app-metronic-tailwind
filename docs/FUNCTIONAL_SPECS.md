# 📋 Especificações Funcionais - CRUDs

Este documento descreve as regras de negócio e restrições dos CRUDs implementados, conforme definido nas Sprints 01 e 02.

---

## 1. 👤 Usuários (SCRUM-5)

### Campos Obrigatórios
- **Nome Completo** (mínimo 3 caracteres)
- **CPF** (válido, formato: 000.000.000-00)
- **Email** (válido, único no sistema)
- **Perfil de Acesso** (seleção obrigatória)
- **Equipe** (seleção única por empresa)

### Regras de Validação
- ✅ **CPF único**: Não pode haver dois usuários com o mesmo CPF
- ✅ **Email único**: Não pode haver dois usuários com o mesmo email
- ✅ **Soft Delete**: Usuários nunca são deletados permanentemente, apenas inativados
- ⚠️ **Usuário SUPORTE CLICKMENOS**: Protegido contra exclusão/modificação

### Regras de Equipe
> **Regra Crítica (SCRUM-26):**  
> "Um usuário pode pertencer a mais de uma equipe, grupo e empresa. **Porém dentro de uma empresa só pode fazer parte de uma equipe.** (Não se aplica a gestores)"

- Um usuário **comum** só pode estar em **uma equipe** por empresa
- **Gestores** podem ter múltiplas equipes (exceção à regra acima)
- No formulário de cadastro, a seleção de equipe é única (dropdown simples)

### Herança de Configurações
As configurações seguem a hierarquia: **Usuário > Equipe > Perfil**

Se o usuário não tiver configuração específica, herda da Equipe. Se a Equipe não tiver, herda do Perfil.

**Configurações Herdáveis:**
- Limite de desconto máximo (%)
- Quantidade máxima de reservas simultâneas
- Restrição de horário de acesso

### Restrição de Horário (SCRUM-15)
Permite restringir quando o usuário pode acessar o sistema:

- **Dias da semana permitidos**: Segunda a Domingo (checkboxes)
- **Horário de início e fim**: Formato 24h (ex: 08:00 - 18:00)
- **Bloqueio em feriados nacionais**: Checkbox
- **UF de feriados**: Para considerar feriados estaduais
- **Código IBGE do município**: Para feriados municipais

**Comportamento:**
- Se configurado, o sistema deve validar antes de gerar tokens
- Logout automático ao atingir horário limite
- Alerta de expiração 5 minutos antes

### Notificações
- ✅ Email de verificação enviado ao criar usuário
- ⚠️ Email de reativação (futuro)
- ⚠️ Alertas de expiração de acesso (futuro)

---

## 2. 👥 Equipes (SCRUM-14)

### Campos Obrigatórios
- **Nome da Equipe** (mínimo 3 caracteres)
- **Perfil de Acesso** (seleção obrigatória)

### Campos Opcionais
- Limite de desconto máximo (substitui o do perfil)
- Quantidade máxima de reservas
- Restrição de horário

### Regras de Negócio
- ✅ Uma equipe **sempre** tem um perfil de acesso associado
- ✅ Membros da equipe herdam as permissões do perfil da equipe
- ✅ Configurações da equipe sobrescrevem as do perfil (herança)
- ⚠️ Se a equipe for deletada, os usuários precisam ser reatribuídos (validação pendente)

### Multitenancy
- ✅ Equipes são isoladas por empresa (`id_empresa`)
- ✅ Um gestor pode ver equipes de múltiplas empresas

---

## 3. 🔐 Perfis de Acesso (SCRUM-13)

### Campos Obrigatórios
- **Nome do Perfil** (mínimo 3 caracteres)
- **Limite de Desconto Máximo** (percentual de 0 a 100)
- **Quantidade Máxima de Reservas** (número inteiro ≥ 0)
- **Permissões** (ao menos uma permissão deve ser selecionada)

### Sistema de Permissões Granulares

#### Recursos (Controláveis)
Cada recurso do sistema pode ter permissões:
- Usuários
- Equipes
- Perfis de Acesso
- Empresas
- Vendas (futuro)
- Comissões (futuro)

#### Ações (CRUD)
- **CRIAR**: Pode criar novos registros
- **LER**: Pode visualizar registros
- **ATUALIZAR**: Pode editar registros existentes
- **EXCLUIR**: Pode deletar registros

#### Níveis de Acesso (Escopo)
- **DADOS_USUARIO** (SELF): Acesso apenas aos próprios dados
- **DADOS_EQUIPE**: Acesso aos dados da equipe do usuário
- **TODOS**: Acesso a todos os dados da empresa

**Exemplo Prático:**
```
Recurso: Usuários
Ação: LER
Escopo: DADOS_EQUIPE
→ Pode visualizar apenas usuários da mesma equipe
```

### Perfil Padrão
- ✅ Checkbox "Perfil Padrão"
- Se marcado, é atribuído automaticamente a novos usuários/equipes
- Apenas um perfil pode ser padrão por empresa

### Restrição de Horário
- Pode ter restrição de horário (herdada por usuários/equipes)
- Funciona da mesma forma que em Usuários

---

## 4. 🏢 Empresas

### Campos Obrigatórios
- **Nome da Empresa** (mínimo 3 caracteres)
- **CNPJ** (válido, formato: 00.000.000/0000-00)

### Regras de Validação
- ✅ **CNPJ único**: Não pode haver duas empresas com o mesmo CNPJ
- ✅ **Soft Delete**: Empresas são inativadas, não deletadas
- ⚠️ Ao deletar, verificar se há usuários/equipes vinculados (futuro)

### Multitenancy
Cada empresa é completamente isolada:
- Usuários de `Empresa A` não veem dados de `Empresa B`
- Exceção: Admin Clickmenos vê todas as empresas

---

## 5. 🎯 Regras Transversais

### Soft Delete (Exclusão Lógica)
Todas as entidades principais utilizam **soft delete**:
- Registro não é removido fisicamente do banco
- Campo `RemovidoEm` é preenchido com a data/hora
- Registros removidos não aparecem em listagens padrão
- Possibilita reativação futura

### Multitenancy
- ✅ Todas as operações são filtradas por `id_empresa`
- ✅ Extração automática do `id_empresa` a partir do token JWT
- ✅ Grupo Keycloak no formato: `empresa_{UUID}`

### Auditoria
Todas as entidades possuem campos de auditoria:
- `CriadoEm` (datetime)
- `AtualizadoEm` (datetime, nullable)
- `RemovidoEm` (datetime, nullable - para soft delete)

---

## 6. 🚧 Validações Pendentes (Backlog Sprint 02)

### SCRUM-14: Validações de Negócio
- [ ] Validar se desconto aplicado não ultrapassa limite do perfil
- [ ] Validar se quantidade de reservas não ultrapassa máximo permitido
- [ ] Implementar Domain Service para regras complexas

### SCRUM-15: Middleware de Controle de Horário
- [ ] Middleware para validar horário de acesso antes de processar requisições
- [ ] Integração com calendário de feriados (API externa)
- [ ] Sistema de notificações de expiração


---

## 7. 🔮 Funcionalidades Futuras (Sprints 02+)

### SCRUM-46: Grupos de Equipes (Novo Conceito)
**Status:** Não implementado  
**Descrição:** Agrupamento lógico de equipes para facilitar gestão

**Impacto nos CRUDs Atuais:**
- [ ] **Equipes:** Adicionar campo opcional `GrupoId` (FK)
- [ ] **Perfis:** Adicionar recurso "Grupos de Equipes" nas permissões
- [ ] **Usuários:** Visualizar grupo da equipe (read-only)

**Regras Esperadas:**
- Um grupo pode ter múltiplas equipes
- Uma equipe pode pertencer a apenas um grupo (ou nenhum)
- Grupos são isolados por empresa (multitenancy)

---

### SCRUM-47: Estrutura de Comissão (Integração Futura)

**Descrição:** Módulo de cálculo e distribuição de comissões

**Impacto nos CRUDs Atuais:**
- [ ] **Equipes:** Serão usadas no rateio de comissões
- [ ] **Perfis:** Novos recursos para gerenciar estruturas de comissão
- [ ] **Usuários:** Receberão comissões baseadas em estrutura/equipe

**Campos Futuros (Usuários/Equipes):**
- `ParticipaNaComissao` (bool)
- `PercentualComissao` (decimal?, se individualizado)
- Relacionamento com `EstruturaDeComissaoNivel`

**Regras de Negócio Futuras:**
- Prioridade de pagamento (níveis dentro da equipe)
- Validação: Soma dos percentuais não pode exceder 100%
- Gatilhos de liberação (parcela específica, percentual recebido)

---

### SCRUM-26: Painel Administrativo

**Descrição:** Dashboard de gestão avançada

**Funcionalidades que Usam os CRUDs:**
1. **Gestão de Usuários:**
   - [ ] Filtros avançados (equipe, perfil, status, data de criação)
   - [ ] Exportação em lote (Excel/CSV)
   - [ ] Ações em lote (ativar/desativar múltiplos)
   - [ ] Histórico de alterações (auditoria visual)

2. **Gestão de Equipes:**
   - [ ] Visualização hierárquica (Grupo > Equipe > Usuários)
   - [ ] Transferência de membros entre equipes (wizard)
   - [ ] Relatório de produtividade por equipe

3. **Aprovação de Perfis:**
   - [ ] Workflow de aprovação para novos perfis
   - [ ] Status: Rascunho → Pendente → Aprovado/Reprovado
   - [ ] Histórico de aprovações

**Impacto nos CRUDs:**
- [ ] **Perfis:** Adicionar campo `Status` (Enum: Rascunho, Aprovado, etc.)
- [ ] **Perfis:** Adicionar campos `AprovadoPorId`, `AprovadoEm`
- [ ] **Usuários/Equipes:** Endpoints de exportação e bulk actions

---

### SCRUM-40: Painel do Corretor

**Descrição:** Dashboard individual do corretor

**Uso dos CRUDs:**
- Exibir dados do próprio usuário (perfil, limites, equipe)
- Exibir membros da equipe
- Exibir alçadas e permissões herdadas

**Novos Endpoints Necessários:**
- `GET /api/v1/usuarios/me` (dados do usuário logado)
- `GET /api/v1/usuarios/me/equipe` (membros da equipe)
- `GET /api/v1/usuarios/me/permissoes` (permissões efetivas)

---

### SCRUM-41: Painel da Imobiliária (Gestores)

**Descrição:** Dashboard para gestores aprovarem comissões

**Uso dos CRUDs:**
- Filtrar usuários/equipes por status de comissões
- Visualizar estrutura organizacional (equipes + membros)
- Aprovar ou rejeitar comissões geradas

**Validações Futuras:**
- Apenas gestores com perfil adequado podem aprovar
- Validar permissão de aprovação (novo recurso/ação)

---

### SCRUM-51 a 60: Integração UAU (Vendas)

**Descrição:** Integração com sistema legado UAU

**Impacto Indireto nos CRUDs:**
- **Empresa:** Feature flag `IntegracaoUauHabilitada` (config por empresa)
- **Usuários:** Podem ter mapeamento para `CodigoVendedorUau`
- **Equipes:** Podem ter mapeamento para `CodigoEquipeUau`

**Novos Campos (Futuro):**
- `Usuario.CodigoExternoUau` (string?)
- `Equipe.CodigoExternoUau` (string?)
- Necessário para sincronização bidirecional

---

### SCRUM-61 a 71: Integração Imobtech (Pagadoria)

**Descrição:** Integração para pagamentos via Imobtech

**Impacto nos CRUDs:**
- **Empresa:** Feature flag `IntegracaoImobtechHabilitada`
- **Usuários:** Dados bancários necessários para pagamentos
  - [ ] `Banco` (string)
  - [ ] `Agencia` (string)
  - [ ] `Conta` (string)
  - [ ] `TipoConta` (Enum: Corrente, Poupança)
  - [ ] `ChavePix` (string?)

**Validações Futuras:**
- Dados bancários obrigatórios se usuário participa de comissões
- Validação de formato (agência, conta, chave Pix)

---

### Melhorias de UX/UI (Backlog)

#### Histórico de Alterações
- [ ] Implementar rastreamento de mudanças em Usuários/Equipes/Perfis
- [ ] Exibir "quem alterou" e "quando" (similar ao auditoria, mas visual)

#### Notificações
- [ ] Notificar usuário quando for adicionado a uma equipe
- [ ] Notificar quando limites/permissões forem alterados
- [ ] Notificar quando perfil da equipe mudar

#### Importação/Exportação
- [ ] Importar usuários em massa (CSV/Excel)
- [ ] Exportar relatórios de usuários/equipes
- [ ] Template de importação com validações

---

## 8. ⚠️ Pontos de Atenção para Futuras Implementações

### 1. Múltiplas Equipes para Gestores
**Questão em aberto:** SCRUM-26 diz "não se aplica a gestores", mas não especifica como implementar.

**Opções:**
- A) Gestores têm checkbox "PermiteMultiplasEquipes" e o formulário mostra um multi-select
- B) Gestores são vinculados a equipes por um relacionamento N:N separado
- C) Gestores não pertencem a equipes, apenas gerenciam

**Recomendação:** Aguardar esclarecimento antes da Sprint 03.

---

### 2. Validação de Desconto em Tempo Real
Atualmente, o sistema permite definir limites mas não os valida no momento da venda.

**Implementação Futura:**
- Middleware/Interceptor que valida desconto antes de processar venda
- Buscar limite efetivo (Usuário → Equipe → Perfil)
- Retornar erro 403 se exceder

---

### 3. Controle de Reservas Simultâneas
Similar ao desconto, precisa de validação em tempo real.

**Implementação Futura:**
- Hook ao criar/atualizar venda/reserva
- Contar reservas ativas do usuário
- Bloquear se atingir `QuantidadeMaximaReservas`

---

### 4. Sincronização Bidirecional (UAU/Imobtech)
Se sistemas externos também gerenciam usuários/equipes:

**Cenários a considerar:**
- Usuário é editado no UAU → Sincronizar para Clickmenos
- Equipe é deletada no UAU → Inativar no Clickmenos?
- Conflito de dados (nome diferente em cada sistema)

**Estratégia Sugerida:**
- Clickmenos como "source of truth"
- Sincronização unidirecional (Clickmenos → Legado)
- Apenas códigos externos são preservados

---

## 9. 📚 Referências

- [Sprint 01 Cards](../../../docs/cm-comissao/api/sprints/sprint-01-cards.md)
- [Sprint 02 Cards](../../../docs/cm-comissao/api/sprints/sprint-02-cards.md)
- [API Backend - START_HERE](../../../cm-comissao-api/docs/START_HERE.md)

---

**Última atualização:** 2025-12-03  
**Versão:** 1.0
