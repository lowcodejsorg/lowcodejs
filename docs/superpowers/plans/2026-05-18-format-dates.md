# Format Dates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralizar a formatação de `createdAt`/`updatedAt` em 6 arquivos do frontend usando um único utilitário, padronizando o formato `"18 de mai de 2026 às 07:16:13"`.

**Architecture:** Criar `frontend/src/lib/format-date.ts` com a função `formatDate`. Cada arquivo remove seus imports inline de `date-fns` e passa a importar `formatDate`. Nenhuma lógica de negócio muda — só a apresentação das datas.

**Tech Stack:** date-fns 4.1.0, TypeScript 5.7, React 19, path alias `@/*` → `src/*`

---

## Mapa de Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `frontend/src/lib/format-date.ts` |
| Modificar | `frontend/src/routes/_private/notifications/index.lazy.tsx` |
| Modificar | `frontend/src/routes/_private/users/-table-users.tsx` |
| Modificar | `frontend/src/routes/_private/logs/-table-history.tsx` |
| Modificar | `frontend/src/routes/_private/menus/-table-menus.tsx` |
| Modificar | `frontend/src/routes/_private/tables/-table-tables.tsx` |
| Modificar | `frontend/src/routes/_private/logs/-json-dialog.tsx` |

---

## Task 1: Criar utilitário `formatDate`

**Files:**
- Create: `frontend/src/lib/format-date.ts`

- [ ] **Step 1: Criar o arquivo**

```typescript
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '-';
  try {
    return format(new Date(value), "dd 'de' MMM 'de' yyyy 'às' HH:mm:ss", {
      locale: ptBR,
    });
  } catch {
    return '-';
  }
}
```

- [ ] **Step 2: Verificar compilação TypeScript**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

Expected: sem erros relacionados ao novo arquivo.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/format-date.ts
git commit -m "feat: add formatDate utility for consistent date display"
```

---

## Task 2: Atualizar `notifications/index.lazy.tsx`

**Files:**
- Modify: `frontend/src/routes/_private/notifications/index.lazy.tsx`

Contexto: este arquivo tem uma função local `formatDateTime` (linhas 23–26) que usa `toLocaleString('pt-BR')` sem segundos. Deve ser removida e substituída por `formatDate`.

- [ ] **Step 1: Adicionar import de `formatDate`**

Adicionar na seção de imports do arquivo (junto aos outros imports `@/`):

```typescript
import { formatDate } from '@/lib/format-date';
```

- [ ] **Step 2: Remover a função local `formatDateTime`**

Remover completamente as linhas:

```typescript
function formatDateTime(value: string): string {
  const date = new Date(value);
  return date.toLocaleString('pt-BR');
}
```

- [ ] **Step 3: Substituir chamada na JSX**

Localizar (linha ~151):
```tsx
{formatDateTime(notification.createdAt)}
```

Substituir por:
```tsx
{formatDate(notification.createdAt)}
```

- [ ] **Step 4: Verificar compilação**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "notifications"
```

Expected: sem saída (sem erros).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/routes/_private/notifications/index.lazy.tsx
git commit -m "fix: use formatDate in notifications table (remove toLocaleString)"
```

---

## Task 3: Atualizar `users/-table-users.tsx`

**Files:**
- Modify: `frontend/src/routes/_private/users/-table-users.tsx`

Contexto: linhas 3–4 importam `format` e `ptBR` usados somente na célula `createdAt`. O formato atual usa `'as'` sem acento e omite segundos.

- [ ] **Step 1: Remover imports de date-fns e adicionar formatDate**

Remover:
```typescript
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
```

Adicionar (junto aos outros imports `@/`):
```typescript
import { formatDate } from '@/lib/format-date';
```

- [ ] **Step 2: Substituir célula `createdAt`**

Localizar (linha ~320):
```tsx
cell: ({ row }): React.ReactElement => {
  const date = row.original.createdAt;
  return (
    <span className="text-sm text-muted-foreground">
      {date
        ? format(new Date(date), "dd 'de' MMM 'de' yyyy 'as' HH:mm", {
            locale: ptBR,
          })
        : 'N/A'}
    </span>
  );
},
```

Substituir por:
```tsx
cell: ({ row }): React.ReactElement => {
  const date = row.original.createdAt;
  return (
    <span className="text-sm text-muted-foreground">
      {formatDate(date)}
    </span>
  );
},
```

- [ ] **Step 3: Verificar compilação**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "table-users"
```

Expected: sem saída.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/routes/_private/users/-table-users.tsx
git commit -m "fix: use formatDate in users table (add accent, add seconds)"
```

---

## Task 4: Atualizar `logs/-table-history.tsx`

**Files:**
- Modify: `frontend/src/routes/_private/logs/-table-history.tsx`

Contexto: o formato atual já está correto (`'às' HH:mm:ss`), mas é inline. Centralizar usando `formatDate`.

- [ ] **Step 1: Remover imports de date-fns e adicionar formatDate**

Remover:
```typescript
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
```

Adicionar (junto aos outros imports `@/`):
```typescript
import { formatDate } from '@/lib/format-date';
```

- [ ] **Step 2: Substituir célula `createdAt`**

Localizar (linha ~101):
```tsx
cell: ({ row }): React.ReactElement => {
  const date = row.original.createdAt;
  if (!date) {
    return <span className="text-sm text-muted-foreground">N/A</span>;
  }
  return (
    <span className="text-sm text-muted-foreground">
      {format(new Date(date), "dd 'de' MMM 'de' yyyy 'às' HH:mm:ss", {
        locale: ptBR,
      })}
    </span>
  );
},
```

Substituir por:
```tsx
cell: ({ row }): React.ReactElement => {
  const date = row.original.createdAt;
  return (
    <span className="text-sm text-muted-foreground">
      {formatDate(date)}
    </span>
  );
},
```

- [ ] **Step 3: Verificar compilação**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "table-history"
```

Expected: sem saída.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/routes/_private/logs/-table-history.tsx
git commit -m "fix: use formatDate in logs history table"
```

---

## Task 5: Atualizar `menus/-table-menus.tsx`

**Files:**
- Modify: `frontend/src/routes/_private/menus/-table-menus.tsx`

Contexto: linhas 3–4 importam `format` e `ptBR` usados somente na célula `createdAt`. O formato usa `'as'` sem acento e omite segundos.

- [ ] **Step 1: Remover imports de date-fns e adicionar formatDate**

Remover:
```typescript
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
```

Adicionar (junto aos outros imports `@/`):
```typescript
import { formatDate } from '@/lib/format-date';
```

- [ ] **Step 2: Substituir célula `createdAt`**

Localizar (linha ~574):
```tsx
cell: ({ getValue }): React.ReactElement => {
  const date = getValue() as string | undefined;
  return (
    <span className="text-sm text-muted-foreground">
      {date
        ? format(new Date(date), "dd 'de' MMM 'de' yyyy 'as' HH:mm", {
            locale: ptBR,
          })
        : 'N/A'}
    </span>
  );
},
```

Substituir por:
```tsx
cell: ({ getValue }): React.ReactElement => {
  const date = getValue() as string | undefined;
  return (
    <span className="text-sm text-muted-foreground">
      {formatDate(date)}
    </span>
  );
},
```

- [ ] **Step 3: Verificar compilação**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "table-menus"
```

Expected: sem saída.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/routes/_private/menus/-table-menus.tsx
git commit -m "fix: use formatDate in menus table (add accent, add seconds)"
```

---

## Task 6: Atualizar `tables/-table-tables.tsx`

**Files:**
- Modify: `frontend/src/routes/_private/tables/-table-tables.tsx`

Contexto: linhas 4–5 importam `format` e `ptBR` usados somente na célula `createdAt`. O formato usa `'as'` sem acento e omite segundos.

- [ ] **Step 1: Remover imports de date-fns e adicionar formatDate**

Remover:
```typescript
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
```

Adicionar (junto aos outros imports `@/`):
```typescript
import { formatDate } from '@/lib/format-date';
```

- [ ] **Step 2: Substituir célula `createdAt`**

Localizar (linha ~384):
```tsx
cell: ({ getValue }): React.ReactElement => {
  const date = getValue() as string | undefined;
  return (
    <span className="text-sm text-muted-foreground">
      {date
        ? format(new Date(date), "dd 'de' MMM 'de' yyyy 'as' HH:mm", {
            locale: ptBR,
          })
        : 'N/A'}
    </span>
  );
},
```

Substituir por:
```tsx
cell: ({ getValue }): React.ReactElement => {
  const date = getValue() as string | undefined;
  return (
    <span className="text-sm text-muted-foreground">
      {formatDate(date)}
    </span>
  );
},
```

- [ ] **Step 3: Verificar compilação**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "table-tables"
```

Expected: sem saída.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/routes/_private/tables/-table-tables.tsx
git commit -m "fix: use formatDate in tables list (add accent, add seconds)"
```

---

## Task 7: Atualizar `logs/-json-dialog.tsx`

**Files:**
- Modify: `frontend/src/routes/_private/logs/-json-dialog.tsx`

Contexto: linhas 1–2 importam `format` e `ptBR` usados somente no bloco `dateDisplay` (linhas 51–57). O formato já está correto mas é inline.

- [ ] **Step 1: Remover imports de date-fns e adicionar formatDate**

Remover:
```typescript
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
```

Adicionar imediatamente após os imports do React (o arquivo não tem outros imports `@/` no topo, adicionar antes de `import { ActionBadge }`):
```typescript
import { formatDate } from '@/lib/format-date';
```

- [ ] **Step 2: Substituir bloco de formatação de data**

Localizar (linha ~50):
```typescript
let dateDisplay = '—';
if (entry.createdAt) {
  dateDisplay = format(
    new Date(entry.createdAt),
    "dd 'de' MMM 'de' yyyy 'às' HH:mm:ss",
    { locale: ptBR },
  );
}
```

Substituir por:
```typescript
const dateDisplay = formatDate(entry.createdAt);
```

- [ ] **Step 3: Verificar compilação**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "json-dialog"
```

Expected: sem saída.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/routes/_private/logs/-json-dialog.tsx
git commit -m "fix: use formatDate in log json dialog"
```

---

## Verificação Final

- [ ] **Verificação TypeScript global**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero erros.

- [ ] **Lint**

```bash
cd frontend && npm run lint
```

Expected: zero erros.

- [ ] **Checklist visual** (rodar `npm run dev` e verificar cada página):
  - `/users` — coluna "Criado em" mostra `18 de mai de 2026 às 07:16:13`
  - `/menus` — coluna "Criado em" mostra mesmo formato
  - `/tables` — coluna "Criado em" mostra mesmo formato
  - `/logs` — coluna "Criado em" mostra mesmo formato
  - `/logs` — clicar no ícone JSON de um log → campo data no dialog mostra mesmo formato
  - `/notifications` — coluna de data na página de notificações mostra mesmo formato
  - Sino de notificações (bell dropdown) — ainda mostra tempo relativo (não alterado)
  - Tabelas dinâmicas com campo DATE — ainda respeitam `field.format` configurado (não alterado)
