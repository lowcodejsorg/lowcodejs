# Hooks de Query

Documentacao dos hooks de query do frontend LowCodeJS baseados no TanStack Query (React Query). Todos os hooks estao localizados em `src/hooks/tanstack-query/` e utilizam um padrao de query keys factory para cache consistente.

---

## Visao Geral

O projeto define 42 hooks organizados por entidade, cada um encapsulando uma operacao de API. Hooks de leitura utilizam `useQuery`, enquanto hooks de mutacao utilizam `useMutation` com invalidacao automatica de cache.

---

## Query Keys Factory

**Arquivo:** `src/hooks/tanstack-query/_query-keys.ts`

O padrao query keys factory garante chaves de cache hierarquicas, tipadas e reutilizaveis. Cada entidade possui uma estrutura padrao com `all`, `lists`, `list` e `details`/`detail`.

```ts
export const queryKeys = {
  tables: {
    all: ['tables'] as const,
    lists: () => [...queryKeys.tables.all, 'list'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.tables.lists(), params] as const,
    details: () => [...queryKeys.tables.all, 'detail'] as const,
    detail: (slug: string) => [...queryKeys.tables.details(), slug] as const,
  },
  rows: {
    all: (tableSlug: string) => ['tables', tableSlug, 'rows'] as const,
    lists: (tableSlug: string) =>
      [...queryKeys.rows.all(tableSlug), 'list'] as const,
    list: (tableSlug: string, params: Record<string, unknown>) =>
      [...queryKeys.rows.lists(tableSlug), params] as const,
    details: (tableSlug: string) =>
      [...queryKeys.rows.all(tableSlug), 'detail'] as const,
    detail: (tableSlug: string, rowId: string) =>
      [...queryKeys.rows.details(tableSlug), rowId] as const,
  },
  relationships: {
    all: ['relationships'] as const,
    rows: (fieldSlug: string, tableSlug: string, search?: string) =>
      [...queryKeys.relationships.all, fieldSlug, tableSlug, search] as const,
  },
  fields: {
    all: (tableSlug: string) => ['tables', tableSlug, 'fields'] as const,
    detail: (tableSlug: string, fieldId: string, groupSlug?: string) =>
      [...queryKeys.fields.all(tableSlug), fieldId, groupSlug] as const,
  },
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (userId: string) =>
      [...queryKeys.users.details(), userId] as const,
  },
  groups: {
    all: ['groups'] as const,
    lists: () => [...queryKeys.groups.all, 'list'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.groups.lists(), params] as const,
    details: () => [...queryKeys.groups.all, 'detail'] as const,
    detail: (groupId: string) =>
      [...queryKeys.groups.details(), groupId] as const,
  },
  menus: {
    all: ['menus'] as const,
    lists: () => [...queryKeys.menus.all, 'list'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.menus.lists(), params] as const,
    details: () => [...queryKeys.menus.all, 'detail'] as const,
    detail: (menuId: string) =>
      [...queryKeys.menus.details(), menuId] as const,
  },
  profile: {
    all: ['profile'] as const,
    detail: (sub?: string) => [...queryKeys.profile.all, sub] as const,
  },
  pages: {
    all: ['pages'] as const,
    detail: (slug: string) => [...queryKeys.pages.all, slug] as const,
  },
  permissions: {
    all: ['permissions'] as const,
  },
  settings: {
    all: ['settings'] as const,
  },
} as const;
```

### Hierarquia de Chaves

Exemplo para a entidade `tables`:

| Metodo                 | Chave Gerada                              | Uso                                   |
|------------------------|-------------------------------------------|---------------------------------------|
| `tables.all`           | `['tables']`                              | Invalidar tudo de tabelas             |
| `tables.lists()`       | `['tables', 'list']`                      | Invalidar todas as listas de tabelas  |
| `tables.list(params)`  | `['tables', 'list', { page: 1, ... }]`   | Cache de lista especifica             |
| `tables.details()`     | `['tables', 'detail']`                    | Invalidar todos os detalhes           |
| `tables.detail(slug)`  | `['tables', 'detail', 'minha-tabela']`    | Cache de detalhe especifico           |

---

## Padrao dos Hooks

### Hook de Query (Leitura)

```ts
export function useReadTable(payload: {
  slug: string;
}): UseQueryResult<ITable, Error> {
  return useQuery({
    queryKey: queryKeys.tables.detail(payload.slug),
    queryFn: async function () {
      const route = '/tables/'.concat(payload.slug);
      const response = await API.get<ITable>(route);
      return response.data;
    },
    enabled: Boolean(payload.slug),
  });
}
```

### Hook de Mutation (Escrita)

```ts
export function useCreateUser(
  props: UseUserCreateProps,
): UseMutationResult<IUser, AxiosError | Error, UserCreatePayload, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async function (payload: UserCreatePayload) {
      const response = await API.post<IUser>('/users', payload);
      return response.data;
    },
    onSuccess(data, variables) {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      props.onSuccess?.(data, variables);
    },
    onError: props.onError,
  });
}
```

### Padrao de Props de Mutation

Todos os hooks de mutacao seguem o mesmo padrao de tipagem para callbacks:

```ts
type UseHookProps = Pick<
  Omit<
    UseMutationOptions<ResponseType, AxiosError | Error, PayloadType, unknown>,
    'mutationFn' | 'onSuccess'
  >,
  'onError'
> & {
  onSuccess?: (data: ResponseType, variables: PayloadType) => void;
};
```

---

## Hooks por Entidade

### Autenticacao

| Hook                        | Tipo     | Metodo HTTP | Endpoint                     | Descricao                                                  |
|-----------------------------|----------|-------------|------------------------------|------------------------------------------------------------|
| `useAuthenticationSignIn`   | Mutation | POST + GET  | `/authentication/sign-in` + `/profile` | Faz login e busca perfil do usuario              |
| `useAuthenticationSignUp`   | Mutation | POST        | `/authentication/sign-up`    | Registra novo usuario                                      |
| `useAuthenticationSignOut`  | Mutation | POST        | `/authentication/sign-out`   | Faz logout (invalida cookie)                               |

**Detalhe do Sign-In:** O hook executa duas chamadas sequenciais -- primeiro o POST de login para definir o cookie, depois GET no `/profile` para retornar os dados do usuario.

```ts
mutationFn: async function (payload: SignInPayload) {
  await API.post('/authentication/sign-in', payload);
  const response = await API.get<IUser>('/profile');
  return response.data;
},
```

---

### Usuarios

| Hook                   | Tipo     | Metodo HTTP | Endpoint              | Descricao                          |
|------------------------|----------|-------------|-----------------------|------------------------------------|
| `useCreateUser`        | Mutation | POST        | `/users`              | Cria novo usuario                  |
| `useReadUser`          | Query    | GET         | `/users/:userId`      | Le um usuario por ID               |
| `useUserReadPaginated` | Query    | GET         | `/users/paginated`    | Lista usuarios paginados           |
| `useUpdateUser`        | Mutation | PATCH       | `/users/:userId`      | Atualiza usuario existente         |

**Invalidacao:** `useCreateUser` invalida `users.lists()`. `useUpdateUser` invalida `users.detail(id)` e `users.lists()`.

---

### Grupos de Usuarios

| Hook                    | Tipo     | Metodo HTTP | Endpoint                  | Descricao                          |
|-------------------------|----------|-------------|---------------------------|------------------------------------|
| `useCreateGroup`        | Mutation | POST        | `/user-group`             | Cria novo grupo de usuarios        |
| `useReadGroup`          | Query    | GET         | `/user-group/:groupId`    | Le um grupo por ID                 |
| `useGroupReadList`      | Query    | GET         | `/user-group`             | Lista todos os grupos              |
| `useGroupReadPaginated` | Query    | GET         | `/user-group/paginated`   | Lista grupos paginados             |
| `useUpdateGroup`        | Mutation | PATCH       | `/user-group/:groupId`    | Atualiza grupo existente           |

**Invalidacao:** `useCreateGroup` invalida `groups.all`. `useUpdateGroup` invalida `groups.detail(id)` e `groups.all`.

---

### Menus

| Hook                   | Tipo     | Metodo HTTP | Endpoint            | Descricao                                          |
|------------------------|----------|-------------|---------------------|----------------------------------------------------|
| `useCreateMenu`        | Mutation | POST        | `/menu`             | Cria novo item de menu                             |
| `useReadMenu`          | Query    | GET         | `/menu/:menuId`     | Le um menu por ID                                  |
| `useMenuReadList`      | Query    | GET         | `/menu`             | Lista todos os menus (requer autenticacao)          |
| `useMenuReadPaginated` | Query    | GET         | `/menu/paginated`   | Lista menus paginados                              |
| `useUpdateMenu`        | Mutation | PATCH       | `/menu/:menuId`     | Atualiza menu existente                            |
| `useMenuDynamic`       | Query    | -           | (composto)          | Combina menus dinamicos da API com menus estaticos  |

**Detalhe do `useMenuDynamic`:** Este hook e mais complexo -- busca menus via `useMenuReadList`, constroi uma arvore hierarquica (`buildMenuTree`), converte para o formato `MenuRoute`, e combina com menus estaticos baseados no role do usuario.

**Detalhe do `useMenuReadList`:** Utiliza o store de autenticacao para verificar se o usuario esta logado e so habilita a query quando autenticado.

```ts
const authentication = useAuthenticationStore();
const isAuthenticated = Boolean(authentication.authenticated?.sub);
// ...
enabled: options?.enabled ?? isAuthenticated,
```

---

### Tabelas

| Hook                    | Tipo     | Metodo HTTP | Endpoint              | Descricao                          |
|-------------------------|----------|-------------|-----------------------|------------------------------------|
| `useCreateTable`        | Mutation | POST        | `/tables`             | Cria nova tabela                   |
| `useReadTable`          | Query    | GET         | `/tables/:slug`       | Le uma tabela por slug             |
| `useReadTables`         | Query    | GET         | `/tables/paginated`   | Lista tabelas (retorna array)      |
| `useTablesReadPaginated`| Query    | GET         | `/tables/paginated`   | Lista tabelas paginadas (com meta) |
| `useUpdateTable`        | Mutation | PUT         | `/tables/:slug`       | Atualiza tabela existente          |
| `useCloneTable`         | Mutation | POST        | `/tools/clone-table`  | Clona tabela existente             |

**Diferenca entre `useReadTables` e `useTablesReadPaginated`:** `useReadTables` retorna `Array<ITable>` (extrai `.data` da resposta), enquanto `useTablesReadPaginated` retorna `Paginated<ITable>` (inclui metadados de paginacao).

---

### Campos (Fields)

| Hook            | Tipo  | Metodo HTTP | Endpoint                                       | Descricao                                  |
|-----------------|-------|-------------|-------------------------------------------------|--------------------------------------------|
| `useFieldRead`  | Query | GET         | `/tables/:slug/fields/:fieldId[?group=slug]`   | Le um campo por ID com filtro opcional de grupo |

**Parametros:**

```ts
interface UseFieldReadParams {
  tableSlug: string;
  fieldId: string;
  groupSlug?: string; // Filtro opcional por grupo
}
```

---

### Registros (Rows)

| Hook                        | Tipo     | Metodo HTTP | Endpoint                                  | Descricao                              |
|-----------------------------|----------|-------------|-------------------------------------------|----------------------------------------|
| `useCreateTableRow`         | Mutation | POST        | `/tables/:slug/rows`                      | Cria novo registro                     |
| `useReadTableRow`           | Query    | GET         | `/tables/:slug/rows/:rowId`               | Le um registro por ID                  |
| `useReadTableRowPaginated`  | Query    | GET         | `/tables/:slug/rows/paginated`            | Lista registros paginados              |
| `useUpdateTableRow`         | Mutation | PUT         | `/tables/:slug/rows/:rowId`               | Atualiza registro existente            |
| `useRowUpdateTrash`         | Mutation | PATCH       | `/tables/:slug/rows/:rowId/trash`         | Envia registro para a lixeira          |
| `useRowUpdateRestore`       | Mutation | PATCH       | `/tables/:slug/rows/:rowId/restore`       | Restaura registro da lixeira           |
| `useRowUpdateEvaluation`    | Mutation | POST        | `/tables/:slug/rows/:rowId/evaluation`    | Adiciona avaliacao a um registro       |
| `useRowUpdateReaction`      | Mutation | POST        | `/tables/:slug/rows/:rowId/reaction`      | Adiciona reacao a um registro          |

**Invalidacao de Rows:** Todos os hooks de mutacao invalidam tanto o detalhe do registro (`rows.detail`) quanto a lista (`rows.lists`) da tabela correspondente.

**Payload de Evaluation:**

```ts
interface RowEvaluationPayload {
  tableSlug: string;
  rowId: string;
  field: string;
  value: number;
}
```

**Payload de Reaction:**

```ts
interface RowReactionPayload {
  tableSlug: string;
  rowId: string;
  field: string;
  type: string; // 'LIKE' | 'UNLIKE'
}
```

---

### Perfil

| Hook               | Tipo     | Metodo HTTP | Endpoint   | Descricao                            |
|--------------------|----------|-------------|------------|--------------------------------------|
| `useProfileRead`   | Query    | GET         | `/profile` | Le perfil do usuario autenticado     |
| `useUpdateProfile` | Mutation | PUT         | `/profile` | Atualiza perfil do usuario           |

**Detalhe do `useProfileRead`:** A query so e habilitada quando o usuario esta autenticado e usa o `sub` como parte da chave de cache para evitar dados stale entre sessoes.

```ts
const authentication = useAuthenticationStore();
const isAuthenticated = Boolean(authentication.authenticated?.sub);

return useQuery({
  queryKey: queryKeys.profile.detail(authentication.authenticated?.sub),
  queryFn: async function () {
    const response = await API.get<IUser>('/profile');
    return response.data;
  },
  enabled: isAuthenticated,
});
```

---

### Configuracoes

| Hook               | Tipo     | Metodo HTTP | Endpoint    | Descricao                          |
|--------------------|----------|-------------|-------------|------------------------------------|
| `useSettingRead`   | Query    | GET         | `/setting`  | Le configuracoes do sistema        |
| `useUpdateSetting` | Mutation | PUT         | `/setting`  | Atualiza configuracoes do sistema  |

---

### Paginas

| Hook          | Tipo  | Metodo HTTP | Endpoint          | Descricao                    |
|---------------|-------|-------------|-------------------|------------------------------|
| `usePageRead` | Query | GET         | `/pages/:slug`    | Le uma pagina por slug       |

---

### Permissoes

| Hook                | Tipo  | Metodo HTTP | Endpoint       | Descricao                          |
|---------------------|-------|-------------|----------------|------------------------------------|
| `usePermissionRead` | Query | GET         | `/permissions` | Lista todas as permissoes          |

---

### Relacionamentos

| Hook                                | Tipo  | Metodo HTTP | Endpoint                           | Descricao                                              |
|-------------------------------------|-------|-------------|------------------------------------|---------------------------------------------------------|
| `useRelationshipRowsReadPaginated`  | Query | GET         | `/tables/:slug/rows/paginated`     | Lista registros de tabelas relacionadas com busca e paginacao |

**Parametros:**

```ts
type Params = {
  tableSlug: string;
  fieldSlug: string;
  search?: string;
  page?: number;      // padrao: 1
  perPage?: number;   // padrao: 10
  enabled?: boolean;  // padrao: true
};
```

---

## Resumo de Todos os Hooks

| #  | Hook                                | Entidade       | Tipo     | Metodo   | Endpoint                                |
|----|-------------------------------------|----------------|----------|----------|-----------------------------------------|
| 1  | `useAuthenticationSignIn`           | Auth           | Mutation | POST+GET | `/authentication/sign-in` + `/profile`  |
| 2  | `useAuthenticationSignUp`           | Auth           | Mutation | POST     | `/authentication/sign-up`               |
| 3  | `useAuthenticationSignOut`          | Auth           | Mutation | POST     | `/authentication/sign-out`              |
| 4  | `useCreateUser`                     | Users          | Mutation | POST     | `/users`                                |
| 5  | `useReadUser`                       | Users          | Query    | GET      | `/users/:id`                            |
| 6  | `useUserReadPaginated`              | Users          | Query    | GET      | `/users/paginated`                      |
| 7  | `useUpdateUser`                     | Users          | Mutation | PATCH    | `/users/:id`                            |
| 8  | `useCreateGroup`                    | Groups         | Mutation | POST     | `/user-group`                           |
| 9  | `useReadGroup`                      | Groups         | Query    | GET      | `/user-group/:id`                       |
| 10 | `useGroupReadList`                  | Groups         | Query    | GET      | `/user-group`                           |
| 11 | `useGroupReadPaginated`             | Groups         | Query    | GET      | `/user-group/paginated`                 |
| 12 | `useUpdateGroup`                    | Groups         | Mutation | PATCH    | `/user-group/:id`                       |
| 13 | `useCreateMenu`                     | Menus          | Mutation | POST     | `/menu`                                 |
| 14 | `useReadMenu`                       | Menus          | Query    | GET      | `/menu/:id`                             |
| 15 | `useMenuReadList`                   | Menus          | Query    | GET      | `/menu`                                 |
| 16 | `useMenuReadPaginated`              | Menus          | Query    | GET      | `/menu/paginated`                       |
| 17 | `useUpdateMenu`                     | Menus          | Mutation | PATCH    | `/menu/:id`                             |
| 18 | `useMenuDynamic`                    | Menus          | Query    | -        | (composto)                              |
| 19 | `useCreateTable`                    | Tables         | Mutation | POST     | `/tables`                               |
| 20 | `useReadTable`                      | Tables         | Query    | GET      | `/tables/:slug`                         |
| 21 | `useReadTables`                     | Tables         | Query    | GET      | `/tables/paginated`                     |
| 22 | `useTablesReadPaginated`            | Tables         | Query    | GET      | `/tables/paginated`                     |
| 23 | `useUpdateTable`                    | Tables         | Mutation | PUT      | `/tables/:slug`                         |
| 24 | `useCloneTable`                     | Tables         | Mutation | POST     | `/tools/clone-table`                    |
| 25 | `useFieldRead`                      | Fields         | Query    | GET      | `/tables/:slug/fields/:id`              |
| 26 | `useCreateTableRow`                 | Rows           | Mutation | POST     | `/tables/:slug/rows`                    |
| 27 | `useReadTableRow`                   | Rows           | Query    | GET      | `/tables/:slug/rows/:id`                |
| 28 | `useReadTableRowPaginated`          | Rows           | Query    | GET      | `/tables/:slug/rows/paginated`          |
| 29 | `useUpdateTableRow`                 | Rows           | Mutation | PUT      | `/tables/:slug/rows/:id`                |
| 30 | `useRowUpdateTrash`                 | Rows           | Mutation | PATCH    | `/tables/:slug/rows/:id/trash`          |
| 31 | `useRowUpdateRestore`               | Rows           | Mutation | PATCH    | `/tables/:slug/rows/:id/restore`        |
| 32 | `useRowUpdateEvaluation`            | Rows           | Mutation | POST     | `/tables/:slug/rows/:id/evaluation`     |
| 33 | `useRowUpdateReaction`              | Rows           | Mutation | POST     | `/tables/:slug/rows/:id/reaction`       |
| 34 | `useProfileRead`                    | Profile        | Query    | GET      | `/profile`                              |
| 35 | `useUpdateProfile`                  | Profile        | Mutation | PUT      | `/profile`                              |
| 36 | `useSettingRead`                    | Settings       | Query    | GET      | `/setting`                              |
| 37 | `useUpdateSetting`                  | Settings       | Mutation | PUT      | `/setting`                              |
| 38 | `usePageRead`                       | Pages          | Query    | GET      | `/pages/:slug`                          |
| 39 | `usePermissionRead`                 | Permissions    | Query    | GET      | `/permissions`                          |
| 40 | `useRelationshipRowsReadPaginated`  | Relationships  | Query    | GET      | `/tables/:slug/rows/paginated`          |

---

## Estrutura de Arquivos

```
src/hooks/tanstack-query/
  _query-keys.ts                          # Factory de chaves de cache
  use-authentication-sign-in.tsx          # Login
  use-authentication-sign-out.tsx         # Logout
  use-authentication-sign-up.tsx          # Registro
  use-user-create.tsx                     # Criar usuario
  use-user-read.tsx                       # Ler usuario
  use-user-read-paginated.tsx             # Listar usuarios paginados
  use-user-update.tsx                     # Atualizar usuario
  use-group-create.tsx                    # Criar grupo
  use-group-read.tsx                      # Ler grupo
  use-group-read-list.tsx                 # Listar grupos
  use-group-read-paginated.tsx            # Listar grupos paginados
  use-group-update.tsx                    # Atualizar grupo
  use-menu-create.tsx                     # Criar menu
  use-menu-read.tsx                       # Ler menu
  use-menu-read-list.tsx                  # Listar menus
  use-menu-read-paginated.tsx             # Listar menus paginados
  use-menu-update.tsx                     # Atualizar menu
  use-menu-dynamic.tsx                    # Menus dinamicos + estaticos
  use-table-create.tsx                    # Criar tabela
  use-table-read.tsx                      # Ler tabela + listar tabelas
  use-tables-read-paginated.tsx           # Listar tabelas paginadas
  use-table-update.tsx                    # Atualizar tabela
  use-clone-table.tsx                     # Clonar tabela
  use-field-read.tsx                      # Ler campo
  use-table-row-create.tsx                # Criar registro
  use-table-row-read.tsx                  # Ler registro
  use-table-row-read-paginated.tsx        # Listar registros paginados
  use-table-row-update.tsx                # Atualizar registro
  use-row-update-trash.tsx                # Enviar para lixeira
  use-row-update-restore.tsx              # Restaurar da lixeira
  use-row-update-evaluation.tsx           # Avaliar registro
  use-row-update-reaction.tsx             # Reagir a registro
  use-profile-read.tsx                    # Ler perfil
  use-profile-update.tsx                  # Atualizar perfil
  use-setting-read.tsx                    # Ler configuracoes
  use-setting-update.tsx                  # Atualizar configuracoes
  use-page-read.tsx                       # Ler pagina
  use-permission-read.tsx                 # Listar permissoes
  use-relationship-rows-read-paginated.tsx # Listar rows de relacionamento
```
