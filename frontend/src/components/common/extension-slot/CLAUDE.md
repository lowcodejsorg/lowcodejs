# Extension Slot

Componente que renderiza todos os plugins ativados para um determinado slot. É o
ponto de injeção de plugins no JSX do core.

## Arquivos

| Arquivo              | Descrição                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `extension-slot.tsx` | Componente `ExtensionSlot` + render interno `ExtensionPluginRender` com lazy import via `loadExtensionEntry` |
| `index.ts`           | Barrel — exporta `ExtensionSlot` e `ExtensionSlotContext`                                                    |

## Uso

```tsx
import { ExtensionSlot } from '@/components/common/extension-slot';

<ExtensionSlot
  id="table.actions"
  context={{ table: tableData, slug }}
/>;
```

- `id`: identificador do slot (ver catálogo em `backend/extensions/CLAUDE.md`).
  O plugin é renderizado se este id estiver em `placement.slots` do manifest
- `context`: objeto repassado como spread para cada componente de plugin. Cada
  slot define quais campos vai povoar (ver catálogo)

## Comportamento

1. Lê extensões ativas via `useExtensionsActiveList`
2. Filtra por `type === PLUGIN && slots.includes(id)`
3. Aplica `tableScope`: se `context.table._id` existe, mantém apenas plugins
   cujo `tableScope.mode === 'all'` ou cujo `tableScope.tableIds` inclui o id da
   tabela. Se não há tabela em foco, todos passam
4. Para cada plugin restante, lazy-importa
   `frontend/extensions/<pkg>/plugins/<id>/index.tsx` e renderiza com
   `<Suspense fallback={null}>` e o `context` como props
5. Se a entry React não existe no bundle (manifest registrado mas sem código),
   renderiza `null` — não quebra o slot

## Slots instalados

| Slot id             | Local                                                                                      | Context                |
| ------------------- | ------------------------------------------------------------------------------------------ | ---------------------- |
| `table.actions`     | `routes/_private/tables/$slug/index.lazy.tsx` (toolbar de ações)                           | `{ table, slug }`      |
| `table.filters`     | `components/common/filters/filter-sidebar.tsx` (topo da listagem)                          | `{ table, fields }`    |
| `table.row.actions` | `components/common/table-views/table-row-actions-menu.tsx` (dropdown da linha de registro) | `{ table, row, slug }` |

## Convenções para autores de plugin

- O componente é `export default` no `index.tsx`
- Recebe os campos do `context` como props — tipar conforme o slot
- **Recebe também `slot: string`** — o id do slot atual, injetado
  automaticamente pelo `<ExtensionSlot>`. Útil para plugins registrados em
  múltiplos slots renderizarem UI diferente em cada um (ex: `Button` vs
  `DropdownMenuItem`)
- Usa o design system (`@/components/ui/*`) para coerência visual
- Sem chamadas síncronas pesadas no render (use Suspense quando precisar de
  dados — TanStack Query funciona normalmente)
- O componente só é montado quando o plugin está habilitado E o `tableScope`
  permite — não precisa fazer essas verificações internamente
