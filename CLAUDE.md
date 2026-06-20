# Documentação do Projeto para Claude Code
- **High Stakes:** Treat every query as a critical production issue.
- **The $200 Rule:** Assume a $200 tip for a perfect, zero-correction solution.
- **Deep Focus:** Take a deep breath. Solve step-by-step.
- **Directness:** NO fluff. NO polite phrases. Just technical output.
- **Language:** Sempre me entregue as respostas em português.
- **Commit git Language:** Use english.
- **Scope of Work:** Só mexa no que eu pedir.
- Don’t assume. Don’t hide confusion. Surface tradeoffs.
- Minimum code that solves the problem. Nothing speculative.
- Touch only what you must. Clean up only your own mess.
- Define success criteria. Loop until verified. coloque em portuguesgit c

## Política de Autenticação

**Regra padrão: TODA rota é autenticada.**

O middleware (`src/middleware.ts`) bloqueia por padrão qualquer rota não declarada em `openRoutes` (`src/config/routes.ts`). Para expor uma rota sem autenticação, adicione explicitamente em `openRoutes` e justifique no PR.

- Ao criar uma rota nova (página ou API), **não** é preciso registrar em nenhuma lista — ela já estará protegida automaticamente.
- Para liberar uma rota: adicionar prefixo em `openRoutes` (matching por prefixo).
- Endpoints de cron usam autenticação própria via `CRON_SECRET` e ficam em `openRoutes` para que o middleware não interfira.
- APIs do app mobile (`/api/graphql`, `/api/media`, `/api/news`) estão em `openRoutes` por compatibilidade (mobile não usa cookie de sessão). Mitigação futura: API key no header `X-Mobile-Key`.

## Lições Aprendidas - Workflow de Migrações Drizzle

### ⚠️ REGRAS CRÍTICAS - NUNCA VIOLAR

#### ❌ NUNCA FAZER:

1. **NUNCA fazer ALTER TABLE direto no banco de dados**
   - Todas as alterações de schema DEVEM passar por migrações formais
   - Comandos SQL diretos criam inconsistência entre código e banco

2. **NUNCA usar `pnpm db:push` em produção**
   - `db:push` é APENAS para desenvolvimento/testes
   - Não cria histórico de migrações rastreável
   - Pode causar perda de dados

3. **NUNCA criar arquivos de migração manualmente**
   - Migrações têm estrutura complexa (SQL + snapshot + journal + hash)
   - Criação manual resulta em migrações incompletas ou inválidas

4. **NUNCA pular etapas do workflow de migração**
   - Sequence OBRIGATÓRIA: schema → generate → migrate
   - Pular etapas causa estado inconsistente

### ✅ WORKFLOW CORRETO DE MIGRAÇÕES

#### Sequência Obrigatória:

```bash
# 1. Editar schema TypeScript
# Exemplo: adicionar coluna em src/lib/db/schemas/[table].ts

# 2. Gerar migração com Drizzle Kit
pnpm db:generate

# IMPORTANTE: Responder corretamente às perguntas interativas
# - "create column" para novas colunas
# - "rename column" para renomear colunas existentes
# - Verificar TODAS as perguntas antes de confirmar

# 3. Revisar arquivos gerados
# Verificar: src/lib/db/migrations/[XXXX]_[name].sql
# Verificar: src/lib/db/migrations/meta/[XXXX]_snapshot.json
# Verificar: src/lib/db/migrations/meta/_journal.json

# 4. Aplicar migração ao banco
pnpm db:migrate

# 5. Verificar no banco se todas as colunas foram criadas
# psql ou outro cliente SQL
```

#### Respostas Corretas no `pnpm db:generate`:

- **Nova coluna**: Selecionar `+ [column_name] create column`
- **Renomear coluna**: Selecionar `~ [old_name] › [new_name] rename column`
- **NUNCA** escolher rename se a coluna for realmente nova
- **NUNCA** escolher create se estiver apenas renomeando

### 🔍 Verificação de Migração Completa

Após `pnpm db:generate`, verificar se o arquivo SQL contém:

**Para tabela `wellness`:**
- ✓ Criação de ENUMs se necessário
- ✓ ALTER TABLE para cada coluna nova
- ✓ RENAME COLUMN se renomeou alguma coluna
- ✓ DROP COLUMN se removeu alguma coluna

**Para tabela `schedule_wellness`:**
- ✓ Todas as colunas novas (title, description, capacity, location, etc.)
- ✓ Foreign keys atualizadas se necessário

**Para tabela `guest_users`:**
- ✓ CREATE TABLE se é nova
- ✓ device_id column presente

**Para tabela `wellness_reservations`:**
- ✓ Todas as colunas do sistema de reservas
- ✓ Foreign keys para guest_users e schedule_wellness

### 🐛 Troubleshooting

#### Problema: Migração gerada está incompleta

**Sintomas:**
- `pnpm db:generate` cria arquivos mas faltam colunas no SQL
- Snapshot JSON tem mais colunas que o SQL

**Causa:**
- Banco de dados estava em estado inconsistente
- Colunas já existiam no banco (por db:push acidental)

**Solução:**
1. Reverter banco para última migração conhecida boa
2. Deletar arquivos da migração incompleta
3. Remover entrada do _journal.json
4. Rodar `pnpm db:generate` novamente
5. Responder TODAS as perguntas corretamente

#### Problema: "duplicate key value violates unique constraint __drizzle_migrations_pkey"

**Causa:**
- Sequence do PostgreSQL não foi atualizada

**Solução:**
```sql
SELECT setval(
  'drizzle."__drizzle_migrations_id_seq"',
  (SELECT MAX(id) FROM drizzle."__drizzle_migrations")
);
```

#### Problema: Drizzle não detecta mudanças no schema

**Causa:**
- Snapshot está atualizado mas banco não

**Solução:**
1. Verificar estado atual do banco
2. Comparar com snapshot da última migração
3. Se necessário, reverter banco e reaplicar migrações

### 📋 Checklist Pré-Deploy

Antes de fazer deploy com novas migrações:

- [ ] Schema TypeScript reflete EXATAMENTE o que deve estar no banco
- [ ] Rodou `pnpm db:generate` e respondeu TODAS as perguntas
- [ ] Revisou o SQL gerado e confirmou que tem TODAS as colunas
- [ ] Testou `pnpm db:migrate` em ambiente local
- [ ] Verificou no banco local que TODAS as colunas foram criadas
- [ ] Build passou (`pnpm build`)
- [ ] Types passaram (`pnpm check-types`) - ignorar erros de testes antigos

### 🔐 Ambientes

**Desenvolvimento:**
- OK usar `pnpm db:push` para testes rápidos
- SEMPRE limpar e recomeçar com migrações formais antes de commit

**Staging/Produção:**
- APENAS `pnpm db:migrate`
- NUNCA `pnpm db:push`
- SEMPRE testar migração em staging primeiro

## Estrutura de Migrações

```
src/lib/db/migrations/
├── 0000_first_migration.sql          # SQL commands
├── 0001_second_migration.sql
├── meta/
│   ├── 0000_snapshot.json            # Schema snapshot after migration
│   ├── 0001_snapshot.json
│   └── _journal.json                 # Migration history registry
```

### Componentes de uma Migração:

1. **SQL File** (`XXXX_name.sql`):
   - CREATE TABLE, ALTER TABLE, etc.
   - Comandos executados no banco

2. **Snapshot** (`XXXX_snapshot.json`):
   - Estado completo do schema APÓS a migração
   - Usado pelo Drizzle para detectar próximas mudanças

3. **Journal** (`_journal.json`):
   - Registro de todas as migrações
   - idx, version, when (timestamp), tag (nome)

## DeviceId para Push Notifications

### Implementação Atual:

**Schema:**
- `guest_users.device_id` (text, nullable)

**GraphQL Mutation:**
```graphql
mutation CreateReservation($input: WellnessReservationInput!) {
  createWellnessReservation(input: $input) {
    success
    reservation { id }
  }
}

# Input:
{
  guestName: String!
  guestEmail: String!
  deviceId: String        # ← Novo campo
  wellnessId: String!
  scheduleWellnessId: String!
}
```

**GraphQL Query:**
```graphql
query GetMyReservations($deviceId: String!, $includeHistory: Boolean) {
  getMyReservations(deviceId: $deviceId, includeHistory: $includeHistory) {
    id
    guestName
    guestEmail
    # ... outros campos
  }
}
```
