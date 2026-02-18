# Skill: Tabela com Paginacao

A tabela paginada e o padrao dominante nas paginas admin/curator do frontend. Combina `validateSearch` com Zod para manter o estado de paginacao e filtros na URL, `useQuery` para buscar dados paginados da API, um componente `Table` com `DropdownMenu` por linha para acoes e o componente `<Pagination>` no footer para navegacao entre paginas. Toda mudanca de filtro ou pagina e feita via `navigate({ search: (prev) => ({...prev, key: value}) })`, nunca via estado local.

---

## Estrutura do Arquivo

```
frontend/
  src/
    routes/
      _private/
        [role]/
          [entity]/
            index.tsx                             <-- rota com validateSearch + useQuery + Pagination
            -components/
              table-[entities].tsx                 <-- Table + TableRow com DropdownMenu
              table-[entities]-skeleton.tsx        <-- Skeleton pareado com a tabela
    components/
      common/
        pagination.tsx                            <-- componente de paginacao reutilizavel
      ui/
        table.tsx                                 <-- componente base Table (shadcn)
        pagination.tsx                            <-- primitivos de paginacao (shadcn)
    lib/
      entities.ts                                 <-- Meta, Paginated<T>
      utils.ts                                    <-- MetaDefault
```

- A rota vive em `routes/_private/[role]/[entity]/index.tsx`.
- O componente de tabela e seus subcomponentes ficam na pasta `-components/` adjacente.
- O componente `Pagination` em `components/common/pagination.tsx` e compartilhado por todas as paginas admin.

---

## Template

```typescript
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useSearch } from '@tanstack/react-router';
import z from 'zod';

import { Table{{Entities}} } from './-components/table-{{entities}}';
import { Table{{Entities}}Skeleton } from './-components/table-{{entities}}-skeleton';
import { Pagination } from '@/components/common/pagination';
import { API } from '@/lib/api';
import type { I{{Entity}}, Paginated } from '@/lib/entities';
import { MetaDefault } from '@/lib/utils';

export const Route = createFileRoute('/_private/{{role}}/{{entities}}/')({
  component: RouteComponent,
  validateSearch: z
    .object({
      search: z.string().optional(),
      page: z.coerce.number().default(1),
      per_page: z.coerce.number().default(50),
      // filtros adicionais aqui
    })
    .loose(),
});

function RouteComponent(): React.JSX.Element {
  const search = useSearch({
    from: '/_private/{{role}}/{{entities}}/',
  });

  const pagination = useQuery({
    queryKey: ['/{{entities}}', search],
    queryFn: async (): Promise<Paginated<I{{Entity}}>> => {
      const response = await API.get<Paginated<I{{Entity}}>>('/{{entities}}', {
        params: { ...search },
      });
      return response.data;
    },
  });

  const headers = ['Coluna 1', 'Coluna 2', 'Status', 'Acoes'];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header da pagina */}
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <h1 className="text-2xl font-medium">{{Entities}}</h1>
        <div className="flex gap-2">
          {/* Botoes de acao: Report, Create, etc */}
        </div>
      </div>

      {/* Conteudo da tabela */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {pagination.status === 'pending' && <Table{{Entities}}Skeleton />}
        {pagination.status === 'success' && (
          <Table{{Entities}} headers={headers} data={pagination.data?.data || []} />
        )}
      </div>

      {/* Paginacao */}
      <div className="shrink-0 border-t p-2">
        <Pagination meta={pagination.data?.meta ?? MetaDefault} />
      </div>
    </div>
  );
}
```

### Template da Tabela

```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EllipsisIcon, EyeIcon, Trash2 } from 'lucide-react';

interface Table{{Entities}}Props {
  data: Array<I{{Entity}}>;
  headers: Array<string>;
}

export function Table{{Entities}}({ data, headers }: Table{{Entities}}Props): React.ReactElement {
  return (
    <Table>
      <TableHeader className="sticky top-0 bg-background">
        <TableRow>
          {headers.map((head) => (
            <TableHead key={head}><span>{head}</span></TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <Table{{Entity}}Row item={item} key={item.id} />
        ))}
      </TableBody>
    </Table>
  );
}

function Table{{Entity}}Row({ item }: { item: I{{Entity}} }): React.ReactElement {
  const viewRef = React.useRef<HTMLButtonElement | null>(null);
  const deleteRef = React.useRef<HTMLButtonElement | null>(null);

  return (
    <TableRow>
      {/* Celulas de dados */}
      <TableCell className="w-20">
        <DropdownMenu>
          <DropdownMenuTrigger><EllipsisIcon /></DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => viewRef.current?.click()}>
              <EyeIcon /> Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => deleteRef.current?.click()}>
              <Trash2 /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Triggers ocultos para Sheets/Dialogs */}
        <SheetView{{Entity}} {{entity}}Id={item.id} ref={viewRef} />
        <DialogDelete{{Entity}} {{entity}}Id={item.id} ref={deleteRef} />
      </TableCell>
    </TableRow>
  );
}
```

---

## Exemplo Real

```typescript
// routes/_private/administrator/artisans/index.tsx
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useSearch } from '@tanstack/react-router';
import z from 'zod';

import { TableAdministratorArtisans } from './-components/table-artisans';
import { Pagination } from '@/components/common/pagination';
import { DialogArtisansReport } from '@/components/common/dialog-artisans-report';
import { SheetAdministratorArtisanCreate } from './-components/sheet-create-artisan/sheet-create-artisan';
import { API } from '@/lib/api';
import type { IArtisan, Paginated } from '@/lib/entities';
import { MetaDefault } from '@/lib/utils';

export const Route = createFileRoute('/_private/administrator/artisans/')({
  component: RouteComponent,
  validateSearch: z
    .object({
      search: z.string().optional(),
      page: z.coerce.number().default(1),
      per_page: z.coerce.number().default(50),
    })
    .loose(),
});

function RouteComponent(): React.JSX.Element {
  const search = useSearch({
    from: '/_private/administrator/artisans/',
  });

  const pagination = useQuery({
    queryKey: ['/artisans', search],
    queryFn: async (): Promise<Paginated<IArtisan>> => {
      const response = await API.get<Paginated<IArtisan>>('/artisans', {
        params: { ...search },
      });
      return response.data;
    },
  });

  const headers = [
    'Artesao',
    'Contato',
    'Aldeia/Comunidade',
    'Status na plataforma',
    'Status de cadastro',
    'Solicitacao de cadastro',
    'Acoes',
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <h1 className="text-2xl font-medium">Artesoes</h1>
        <div className="flex gap-2">
          <DialogArtisansReport />
          <SheetAdministratorArtisanCreate />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        <TableAdministratorArtisans headers={headers} data={pagination.data?.data || []} />
      </div>

      <div className="shrink-0 border-t p-2">
        <Pagination meta={pagination.data?.meta ?? MetaDefault} />
      </div>
    </div>
  );
}
```

**Leitura do exemplo:**

1. `validateSearch` define o schema Zod com `.loose()` para permitir parametros extras sem erro. `z.coerce.number()` converte a query string (sempre string) para numero automaticamente.
2. `useSearch({ from: '/_private/administrator/artisans/' })` retorna o objeto de busca tipado pelo Zod, ja validado e com defaults aplicados.
3. A `queryKey` inclui o objeto `search` inteiro -- isso garante que qualquer mudanca de filtro, pagina ou busca invalide o cache automaticamente.
4. O `queryFn` faz spread de `search` em `params`, enviando todos os filtros diretamente para a API sem transformacao manual.
5. O layout segue o padrao de tres faixas: header (`shrink-0`), conteudo (`flex-1 min-h-0 overflow-auto`) e footer (`shrink-0 border-t`).
6. O componente `Pagination` recebe `meta` e atualiza a URL via `navigate({ search: (prev) => ({...prev, page}) })` internamente, usando `from: '/_private'` para funcionar em qualquer rota privada.

---

## Variante: Filtros com Select

```typescript
// routes/_private/curator/artisans/index.tsx (trecho)
export const Route = createFileRoute('/_private/curator/artisans/')({
  component: RouteComponent,
  validateSearch: z
    .object({
      search: z.string().optional(),
      page: z.coerce.number().default(1),
      per_page: z.coerce.number().default(50),
      village_id: z.string().optional(),
      ethnicity: z.string().optional(),
    })
    .loose(),
});

// No componente, o filtro atualiza a URL:
<Select
  value={search.village_id}
  onValueChange={(value) => {
    navigate({
      search: (prev) => ({
        ...prev,
        village_id: value === 'ALL' ? undefined : value,
        page: 1,  // Reset para pagina 1 ao mudar filtro
      }),
    });
  }}
/>
```

## Variante: Filtros com Enum

```typescript
// routes/_private/administrator/piece-requests/index.tsx (trecho)
validateSearch: z
  .object({
    search: z.string().optional(),
    page: z.coerce.number().default(1),
    per_page: z.coerce.number().default(50),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED']).optional(),
    type: z.enum(['CREATE', 'UPDATE', 'DELETE']).optional(),
  })
  .loose(),
```

---

## Tipos de Dados

```typescript
// lib/entities.ts
export interface Meta {
  total: number;
  page: number;
  per_page: number;
  last_page: number;
  first_page: number;
}

export interface Paginated<Entity> {
  data: Array<Entity>;
  meta: Meta;
}

// lib/utils.ts
export const MetaDefault: Meta = {
  total: 1,
  per_page: 50,
  page: 1,
  last_page: 1,
  first_page: 1,
};
```

---

## Componente Pagination

```typescript
// components/common/pagination.tsx
// Usa useSearch({ from: '/_private' }) para funcionar em qualquer rota privada
// Usa navigate({ search: (prev) => ({...prev, page, per_page}) }) para atualizar URL
// Exibe: seletor de itens por pagina (10/20/30/40/50) + navegacao (first/prev/next/last)
```

---

## Regras e Convencoes

1. **Estado na URL, nunca em state local** -- paginacao (`page`, `per_page`), busca (`search`) e filtros vivem na URL via `validateSearch`. Isso permite compartilhar links e manter estado ao navegar.

2. **`.loose()` no schema Zod** -- sempre adicionar `.loose()` ao `z.object()` do `validateSearch` para permitir parametros extras sem erro de validacao.

3. **`z.coerce.number()` para parametros numericos** -- parametros de URL sao sempre strings; `z.coerce.number()` garante a conversao. Nunca use `z.number()` diretamente.

4. **Query key inclui o objeto `search`** -- a `queryKey` deve ser `['/endpoint', search]` para que mudancas em qualquer filtro invalidem o cache automaticamente.

5. **Spread de search em params** -- passe `params: { ...search }` diretamente para `API.get`. Nao transforme ou filtre manualmente os parametros.

6. **Reset de pagina ao mudar filtro** -- quando um filtro (select, busca, enum) muda, sempre incluir `page: 1` no navigate para voltar a primeira pagina.

7. **`MetaDefault` como fallback** -- sempre use `pagination.data?.meta ?? MetaDefault` para o componente `Pagination`, evitando erros quando os dados ainda nao carregaram.

8. **Layout tres faixas** -- header (`shrink-0 border-b`), conteudo (`flex-1 min-h-0 overflow-auto`), footer (`shrink-0 border-t`). Isso garante scroll apenas no conteudo central.

9. **Tabela sem logica de paginacao** -- o componente `Table` e um apresentador puro que recebe `data` e `headers`. Toda logica de paginacao e filtros fica na rota (`index.tsx`).

10. **DropdownMenu por linha** -- cada `TableRow` possui um `DropdownMenu` com acoes (visualizar, editar, excluir). As acoes abrem Sheets/Dialogs via refs ocultos (ver `029-skill-sheet-dialog-crud.md`).

---

## Checklist

- [ ] O arquivo esta em `routes/_private/[role]/[entity]/index.tsx`.
- [ ] `createFileRoute` usa o path completo com `/_private/` e barra final.
- [ ] `validateSearch` usa `z.object({...}).loose()`.
- [ ] Parametros numericos usam `z.coerce.number().default(valor)`.
- [ ] `useSearch` usa o mesmo `from` do `createFileRoute`.
- [ ] A `queryKey` inclui o objeto `search` inteiro: `['/endpoint', search]`.
- [ ] O `queryFn` faz spread de search: `params: { ...search }`.
- [ ] O layout segue o padrao tres faixas (header, conteudo, footer).
- [ ] O componente `Pagination` usa `MetaDefault` como fallback.
- [ ] O componente de tabela e separado em arquivo proprio em `-components/`.
- [ ] Cada `TableRow` tem `DropdownMenu` com acoes.
- [ ] Filtros resetam `page: 1` ao mudar valor.
- [ ] O componente de tabela nao contem logica de paginacao.

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| Filtros perdem estado ao navegar | Estado em `useState` em vez de URL | Mover para `validateSearch` + `useSearch` |
| Erro de validacao na URL | Faltou `.loose()` no schema Zod | Adicionar `.loose()` ao `z.object()` |
| Pagina nao reseta ao filtrar | Faltou `page: 1` no `navigate` do filtro | Incluir `page: 1` em todo handler de filtro |
| Cache nao atualiza ao mudar pagina | `queryKey` nao inclui `search` | Usar `['/endpoint', search]` como queryKey |
| Parametro `page` vem como string | Uso de `z.number()` em vez de `z.coerce.number()` | Trocar para `z.coerce.number()` |
| `Cannot read property 'meta' of undefined` | Acesso a `pagination.data.meta` sem fallback | Usar `pagination.data?.meta ?? MetaDefault` |
| Tabela sem scroll, pagina inteira scrolla | Layout nao usa tres faixas | Aplicar `flex-1 min-h-0 overflow-auto` no container da tabela |
| Paginacao nao funciona em rota especifica | Componente Pagination usa `from` errado | `Pagination` usa `from: '/_private'` que funciona em qualquer rota privada |

---

**Cross-references:** ver [015-skill-rota-privada.md](./015-skill-rota-privada.md), [029-skill-sheet-dialog-crud.md](./029-skill-sheet-dialog-crud.md), [017-skill-hook-query.md](./017-skill-hook-query.md), [040-skill-skeleton-loading.md](./040-skill-skeleton-loading.md).
