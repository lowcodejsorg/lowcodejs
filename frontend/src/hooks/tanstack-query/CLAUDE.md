# TanStack Query Hooks

Hooks de API organizados por recurso, usando TanStack Query para queries e
mutations.

## Arquivos de infraestrutura

| Arquivo             | Descricao                                         |
| ------------------- | ------------------------------------------------- |
| `_query-keys.ts`    | Factory hierarquica de query keys por recurso     |
| `_query-options.ts` | `queryOptions` reutilizaveis para loaders e hooks |

## Hooks por recurso

### Authentication

| Arquivo                           | Operacao |
| --------------------------------- | -------- |
| `use-authentication-sign-in.tsx`  | Login    |
| `use-authentication-sign-out.tsx` | Logout   |
| `use-authentication-sign-up.tsx`  | Registro |

### Tables

| Arquivo                         | Operacao                           |
| ------------------------------- | ---------------------------------- |
| `use-table-create.tsx`          | Criar tabela                       |
| `use-table-read.tsx`            | Ler tabela por slug + listar todas |
| `use-tables-read-paginated.tsx` | Listar tabelas paginado            |
| `use-table-update.tsx`          | Atualizar tabela                   |
| `use-clone-table.tsx`           | Clonar tabela                      |

### Fields

| Arquivo                | Operacao    |
| ---------------------- | ----------- |
| `use-field-create.tsx` | Criar campo |
| `use-field-read.tsx`   | Ler campo   |

### Rows

| Arquivo                                    | Operacao                           |
| ------------------------------------------ | ---------------------------------- |
| `use-table-row-create.tsx`                 | Criar registro                     |
| `use-table-row-read.tsx`                   | Ler registro                       |
| `use-table-row-read-paginated.tsx`         | Listar registros paginado          |
| `use-table-row-update.tsx`                 | Atualizar registro                 |
| `use-row-update-evaluation.tsx`            | Atualizar avaliacao de registro    |
| `use-row-update-reaction.tsx`              | Atualizar reacao de registro       |
| `use-row-update-restore.tsx`               | Restaurar registro da lixeira      |
| `use-row-update-trash.tsx`                 | Mover registro para lixeira        |
| `use-relationship-rows-read-paginated.tsx` | Listar registros de relacionamento |

### Groups

| Arquivo                        | Operacao                    |
| ------------------------------ | --------------------------- |
| `use-group-create.tsx`         | Criar grupo                 |
| `use-group-read.tsx`           | Ler grupo                   |
| `use-group-read-list.tsx`      | Listar todos os grupos      |
| `use-group-read-paginated.tsx` | Listar grupos paginado      |
| `use-group-update.tsx`         | Atualizar grupo             |
| `use-group-field-create.tsx`   | Criar campo de grupo        |
| `use-group-field-update.tsx`   | Atualizar campo de grupo    |
| `use-group-row-create.tsx`     | Criar registro de grupo     |
| `use-group-row-delete.tsx`     | Excluir registro de grupo   |
| `use-group-row-update.tsx`     | Atualizar registro de grupo |

### Menus

| Arquivo                       | Operacao              |
| ----------------------------- | --------------------- |
| `use-menu-create.tsx`         | Criar menu            |
| `use-menu-read.tsx`           | Ler menu              |
| `use-menu-read-list.tsx`      | Listar todos os menus |
| `use-menu-read-paginated.tsx` | Listar menus paginado |
| `use-menu-update.tsx`         | Atualizar menu        |
| `use-menu-dynamic.tsx`        | Menu dinamico         |

### Users

| Arquivo                       | Operacao                 |
| ----------------------------- | ------------------------ |
| `use-user-create.tsx`         | Criar usuario            |
| `use-user-read.tsx`           | Ler usuario              |
| `use-user-read-paginated.tsx` | Listar usuarios paginado |
| `use-user-update.tsx`         | Atualizar usuario        |

### Profile

| Arquivo                  | Operacao                     |
| ------------------------ | ---------------------------- |
| `use-profile-read.tsx`   | Ler perfil do usuario logado |
| `use-profile-update.tsx` | Atualizar perfil             |

### Settings

| Arquivo                  | Operacao                |
| ------------------------ | ----------------------- |
| `use-setting-read.tsx`   | Ler configuracoes       |
| `use-setting-update.tsx` | Atualizar configuracoes |

### Permissions

| Arquivo                   | Operacao          |
| ------------------------- | ----------------- |
| `use-permission-read.tsx` | Listar permissoes |

### Pages

| Arquivo             | Operacao            |
| ------------------- | ------------------- |
| `use-page-read.tsx` | Ler pagina por slug |

## Padrao de query keys (`_query-keys.ts`)

Factory hierarquica onde cada recurso tem niveis:
`all > lists/details > list(params)/detail(id)`.

```ts
queryKeys.tables.all; // ['tables']
queryKeys.tables.list({}); // ['tables', 'list', {...}]
queryKeys.tables.detail(s); // ['tables', 'detail', slug]
```

Isso permite invalidacao granular (ex: invalidar todas as listas sem afetar
detalhes).

## Padrao de query options (`_query-options.ts`)

Funcoes que retornam `queryOptions({...})` reutilizaveis tanto em hooks quanto
em loaders de rota do TanStack Router. Cada option define `queryKey`, `queryFn`,
`enabled` e `staleTime`.

## Padrao de mutation (create/update/delete)

1. Recebe props com callbacks `onSuccess` e `onError`
2. Usa `useMutation` com `mutationFn` que chama `API.post/put/delete`
3. No `onSuccess`: atualiza cache com `setQueryData` e/ou `invalidateQueries`
4. Retorna `UseMutationResult` tipado

## Padrao de leitura (read)

1. Usa `useQuery` ou `useSuspenseQuery` com options de `_query-options.ts`
2. Retorna `UseQueryResult` tipado
3. Hooks paginados recebem params com `page` e `perPage`

## Convencoes

- **Nomenclatura**: `use-{recurso}-{operacao}.tsx` (ex: `use-table-create.tsx`)
- **Prefixo `_`**: arquivos de infraestrutura compartilhada (`_query-keys.ts`,
  `_query-options.ts`)
- **Tipos**: payloads em `@/lib/payloads`, interfaces em `@/lib/interfaces`
- **API client**: todas as chamadas via `API` (axios instance) de `@/lib/api`
- **Toast**: feedback via `toastSuccess`/`toastError` de `@/lib/toast`
- **Cache**: mutations atualizam cache manualmente com `setQueryData` antes de
  invalidar listas
