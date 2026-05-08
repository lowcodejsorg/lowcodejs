# Template: PLUGIN

Use quando o usuário quer um botão pequeno em um placeholder existente do core.

## 1. `backend/extensions/<pkg>/plugins/<id>/manifest.json`

```json
{
  "id": "<id>",
  "type": "PLUGIN",
  "name": "<Nome humano>",
  "description": "<O que faz>",
  "version": "1.0.0",
  "author": "<seu nome ou time>",
  "icon": "<NomeLucideIcon>",
  "placement": {
    "slots": ["<slot.id>"]
  },
  "requires": {
    "lowcodejs": ">=1.0.0"
  }
}
```

Slots válidos hoje: `table.actions`, `table.filters`, `table.row.actions`.
Veja `frontend/src/components/common/extension-slot/CLAUDE.md` para o context
de cada slot.

`placement.slots` é um array — um plugin pode ser registrado em múltiplos
slots ao mesmo tempo (ex: `["table.actions", "tables-page.row.actions"]` para
um botão que aparece tanto na toolbar da tabela quanto no dropdown de cada
linha em `/tables`). O entry React é montado uma vez por slot e recebe o
context daquele slot.

## 2. `frontend/extensions/<pkg>/plugins/<id>/index.tsx`

### Plugin do slot `table.actions`

```tsx
import { /* SeuIcon */ } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ITable } from '@/lib/interfaces';

interface Props {
  table?: ITable;
  slug?: string;
}

export default function MyPlugin({ table, slug: _slug }: Props): React.JSX.Element {
  const label = table ? `Ação em ${table.name}` : 'Ação';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="shadow-none p-1 h-auto"
          onClick={() => {
            // TODO: lógica
          }}
          data-test-id="plugin-<id>"
        >
          {/* <SeuIcon className="size-4" /> */}
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
```

### Plugin do slot `table.row.actions` (item de dropdown)

```tsx
import { /* SeuIcon */ } from 'lucide-react';
import React from 'react';

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import type { IRow, ITable } from '@/lib/interfaces';

interface Props {
  table?: ITable;
  row: IRow;
  slug: string;
}

export default function MyRowPlugin({ row }: Props): React.JSX.Element {
  return (
    <DropdownMenuItem
      className="inline-flex space-x-1 w-full cursor-pointer"
      onClick={() => {
        // TODO: ação na row específica (use row._id, etc.)
      }}
    >
      {/* <SeuIcon className="size-4" /> */}
      <span>Minha ação</span>
    </DropdownMenuItem>
  );
}
```

### Plugin do slot `table.filters`

```tsx
import React from 'react';

import { Field, FieldLabel } from '@/components/ui/field';
import type { IFilterField, ITable } from '@/lib/interfaces';

interface Props {
  table?: ITable;
  fields: IFilterField[];
}

export default function MyFilterPlugin({ table: _t, fields: _f }: Props): React.JSX.Element {
  return (
    <Field>
      <FieldLabel>Meu filtro custom</FieldLabel>
      {/* TODO: inputs */}
    </Field>
  );
}
```

## 3. (Opcional) Backend custom

Se o plugin precisa de API custom, crie controller seguindo o padrão de
`backend/extensions/core/tools/clone-table/clone-table.controller.ts` —
sempre com `ExtensionActiveMiddleware`.

## 4. CLAUDE.md do pacote

Atualize `backend/extensions/<pkg>/CLAUDE.md` adicionando uma linha na tabela
"Plugins":

```markdown
| `<id>` | `<slot>` | <descrição curta> |
```

E `frontend/extensions/<pkg>/CLAUDE.md` na tabela "Entries".

## 5. Smoke test

1. Restart backend → log deve mostrar a extensão carregada
2. `/extensions` (MASTER) → ativar (se `pkg !== 'core'`)
3. Abrir uma tabela → o slot correspondente deve renderizar o plugin
4. Para plugin de `table.actions`: aparece na toolbar antes do botão Registro
5. Para plugin de `table.filters`: aparece no topo da listagem do FilterSidebar
6. Para plugin de `table.row.actions`: aparece no dropdown de cada linha

## 6. Configurar escopo por tabela (opcional)

Se o plugin só faz sentido em algumas tabelas, em `/extensions` o MASTER
configura `tableScope: specific` e seleciona as tabelas. O `<ExtensionSlot>`
filtra automaticamente.
