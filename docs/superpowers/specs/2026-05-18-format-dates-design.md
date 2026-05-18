# Design: Formatação Centralizada de Datas (createdAt / updatedAt)

**Data:** 2026-05-18  
**Status:** Aprovado

## Contexto

Datas `createdAt` e `updatedAt` são exibidas em 6 locais (tabelas e páginas de detalhe) com formatos inconsistentes:
- Alguns usam `'as'` sem acento em vez de `'às'`
- Alguns omitem segundos (`HH:mm` em vez de `HH:mm:ss`)
- Um usa `toLocaleString('pt-BR')` em vez de `date-fns`
- Cada arquivo repete a lógica inline — sem utilitário centralizado

**Formato alvo:** `18 de mai de 2026 às 07:16:13`  
**String date-fns:** `"dd 'de' MMM 'de' yyyy 'às' HH:mm:ss"` com `{ locale: ptBR }`

## Fora de Escopo

- `notification-bell.tsx` — usa tempo relativo (`formatRelativeTime`), padrão UX diferente e intencional
- `TableRowDateCell` — continua respeitando `field.format` configurado por campo (decisão do usuário)
- Formulários (`-create-form.tsx`, `-update-form.tsx`, etc.)
- CSV export (`-csv.ts`)
- `updatedAt` — não encontrado em nenhum render, nada a fazer

## Solução

### 1. Criar utilitário centralizado

**Arquivo:** `frontend/src/lib/format-date.ts`

```typescript
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '-'
  try {
    return format(new Date(value), "dd 'de' MMM 'de' yyyy 'às' HH:mm:ss", { locale: ptBR })
  } catch {
    return '-'
  }
}
```

### 2. Atualizar os 6 locais

| # | Arquivo | Linha | Campo | Ação |
|---|---|---|---|---|
| 1 | `routes/_private/notifications/index.lazy.tsx` | ~151 | `createdAt` | Substituir `toLocaleString` + remover `formatDateTime` local |
| 2 | `routes/_private/users/-table-users.tsx` | ~321 | `createdAt` | Substituir format inline |
| 3 | `routes/_private/logs/-table-history.tsx` | ~102 | `createdAt` | Centralizar (já correto) |
| 4 | `routes/_private/menus/-table-menus.tsx` | ~574 | `createdAt` | Substituir format inline |
| 5 | `routes/_private/tables/-table-tables.tsx` | ~384 | `createdAt` | Substituir format inline |
| 6 | `routes/_private/logs/-json-dialog.tsx` | ~52 | `createdAt` | Centralizar (já correto) |

Em cada arquivo:
- Remover import `format` do `date-fns` se não usado em outro lugar
- Remover import `ptBR` se não usado em outro lugar
- Adicionar `import { formatDate } from '@/lib/format-date'`
- Substituir a expressão de formatação por `formatDate(row.createdAt)` (ou nome equivalente)

## Arquivos Críticos

- **Novo:** `frontend/src/lib/format-date.ts`
- **Editados (6):**
  - `frontend/src/routes/_private/notifications/index.lazy.tsx`
  - `frontend/src/routes/_private/users/-table-users.tsx`
  - `frontend/src/routes/_private/logs/-table-history.tsx`
  - `frontend/src/routes/_private/menus/-table-menus.tsx`
  - `frontend/src/routes/_private/tables/-table-tables.tsx`
  - `frontend/src/routes/_private/logs/-json-dialog.tsx`

## Verificação

1. Abrir tabela de usuários — coluna `Criado em` mostra `18 de mai de 2026 às 07:16:13`
2. Abrir tabela de menus — mesma formatação
3. Abrir tabela de tabelas — mesma formatação
4. Abrir logs de histórico — mesma formatação
5. Abrir dialog JSON de log — campo createdAt no detalhe mostra mesmo formato
6. Abrir página de notificações — coluna de data mostra mesmo formato
7. Confirmar que `notification-bell.tsx` ainda mostra tempo relativo (não alterado)
8. Confirmar que campos DATE dinâmicos em tabelas customizadas ainda respeitam `field.format`
