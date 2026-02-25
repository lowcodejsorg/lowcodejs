# Melhorias no Frontend baseadas na documentacao TanStack Start/Query/Router

> Analise completa de 154 docs do TanStack (Start: 30, Query: 72, Router: 52) comparadas com a implementacao atual do frontend.

---

## Estado Atual -- O que ja esta BEM feito

| Area | Detalhe |
|------|---------|
| Root Route | `head` com SEO, `HeadContent`, `Scripts`, `loader`, `beforeLoad` |
| Router defaults | `defaultPreload: 'intent'`, `defaultPreloadStaleTime: 0`, `defaultStructuralSharing: true`, `scrollRestoration: true` |
| SSR + Query | `setupRouterSsrQueryIntegration()` configurado |
| Query Keys | Hierarquicos, bem tipados em `_query-keys.ts` |
| Search Params | `validateSearch` com Zod em todas as rotas paginadas |
| Code Splitting | `.lazy.tsx` separando config de componente corretamente |
| Forms | TanStack Form com `useAppForm`, validacao Zod, mapeamento de erros do servidor |
| Error Handling | `errorComponent`, `pendingComponent`, `notFoundComponent` no root |
| Env Validation | T3 Env com Zod configurado em `src/env.ts` |
| Router Invalidation | `router.invalidate()` nos `onSuccess` de todas as mutations |

---

## FASE 1: Fundacao (Alto Impacto, Baixo Risco)

### 1.1 -- Criar `queryOptions` Factory Pattern

**Problema**: Cada hook (`use-user-read-paginated.tsx`, etc.) define `queryKey` + `queryFn` inline. Impossivel reusar a mesma config em route loaders (`ensureQueryData`) ou em `setQueryData` apos mutations.

**Arquivo novo**: `frontend/src/hooks/tanstack-query/_query-options.ts`

**Arquivos modificados**: Todos os ~20 hooks `use-*-read*.tsx` passam a importar daqui

**Pattern**:

```ts
// _query-options.ts
import { queryOptions } from '@tanstack/react-query';
import { queryKeys } from './_query-keys';
import { API } from '@/lib/api';

export const userListOptions = (params: Record<string, unknown>) =>
  queryOptions({
    queryKey: queryKeys.users.list(params),
    queryFn: async () => (await API.get('/users/paginated', { params })).data,
  });

export const userDetailOptions = (userId: string) =>
  queryOptions({
    queryKey: queryKeys.users.detail(userId),
    queryFn: async () => (await API.get(`/users/${userId}`)).data,
    enabled: Boolean(userId),
  });

// Mesmo pattern para tables, rows, groups, menus, settings, profile, pages, permissions, fields
```

Hooks ficam thin wrappers:

```ts
// use-user-read-paginated.tsx
export function useUserReadPaginated(params?: BaseQueryPayload) {
  return useQuery(userListOptions(params ?? { page: 1, perPage: 50 }));
}
```

**Por que importa**: Pre-requisito para tudo. Sem isso, nao da pra usar `ensureQueryData` em loaders, nem `setQueryData` preciso em mutations.

---

### 1.2 -- Prefetch em Route Loaders com `loader` + `loaderDeps`

**Problema**: O router tem `defaultPreload: 'intent'` configurado, mas NENHUMA rota tem `loader` para dados de query. Dados sao buscados no render do componente (via `useQuery`), causando skeleton flash. O preload por intent nao faz nada sem loader.

**Arquivos modificados**: Todos os `index.tsx` (nao-lazy) de rotas com dados

**Pattern para lista paginada** (`_private/users/index.tsx`):

```ts
export const Route = createFileRoute('/_private/users/')({
  // ... beforeLoad, head, validateSearch existentes ...
  loaderDeps: ({ search }) => ({
    page: search.page,
    perPage: search.perPage,
    search: search.search,
  }),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(userListOptions(deps));
  },
});
```

**Pattern para detalhe** (`_private/users/$userId/index.tsx`):

```ts
loader: async ({ context, params }) => {
  await context.queryClient.ensureQueryData(userDetailOptions(params.userId));
},
```

**Pattern para multiplos prefetch** (`_private/tables/$slug/index.tsx`):

```ts
loader: async ({ context, params, deps }) => {
  await Promise.all([
    context.queryClient.ensureQueryData(tableDetailOptions(params.slug)),
    context.queryClient.ensureQueryData(tableRowListOptions(params.slug, deps)),
  ]);
},
```

**Rotas que precisam de loader**:

- `_private/users/index.tsx` (lista)
- `_private/users/$userId/index.tsx` (detalhe)
- `_private/groups/index.tsx` (lista)
- `_private/groups/$groupId/index.tsx` (detalhe)
- `_private/menus/index.tsx` (lista)
- `_private/menus/$menuId/index.tsx` (detalhe)
- `_private/tables/index.tsx` (lista)
- `_private/tables/$slug/index.tsx` (lista de rows + detalhe da table)
- `_private/tables/$slug/row/$rowId/index.tsx` (detalhe de row)
- `_private/settings/index.tsx` (detalhe)
- `_private/profile/index.tsx` (detalhe)

**Por que importa**: Maior ganho de performance. Com loader, hover no `<Link>` ja inicia o fetch (preload intent). Navegacao entre paginas fica instantanea para dados ja em cache. Elimina skeleton flash no retorno a paginas visitadas.

**Nota**: Como `ssr: false` esta no `_private/layout.tsx`, loaders rodam apenas client-side. O beneficio e prefetch client-side, nao SSR.

---

### 1.3 -- Consolidar acesso a env vars via T3 Env

**Problema**: `Env` do T3 esta configurado mas nao e usado. Codigo usa `process.env.VITE_API_BASE_URL` diretamente (sem validacao Zod).

**Arquivos modificados** (apenas 3):

- `frontend/src/routes/__root.tsx` (linha 22)
- `frontend/src/lib/get-api-config.ts` (linha 4)
- `frontend/src/routes/_private/tables/$slug/-api-endpoints-modal.tsx` (se existir uso direto)

**Mudanca**:

```ts
// Antes
const baseUrl = process.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Depois
import { Env } from '@/env';
const baseUrl = Env.VITE_API_BASE_URL;
```

**Por que importa**: Deploy com env var errada falha imediatamente com erro Zod claro, ao inves de silenciosamente usar `localhost:3000` em producao.

---

### 1.4 -- `QueryErrorResetBoundary` no Private Layout

**Problema**: Se um loader query falhar (apos 1.2), o `errorComponent` da rota dispara sem como resetar o cache da query que falhou. Clique em "Retry" precisa de `QueryErrorResetBoundary` pra funcionar.

**Arquivo modificado**: `frontend/src/routes/_private/layout.tsx`

**Mudanca**: Envolver `<Outlet />` com boundary:

```tsx
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

// Dentro do PrivateLayout, envolver Outlet:
<QueryErrorResetBoundary>
  {({ reset }) => (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ resetErrorBoundary }) => (
        <RouteError
          error={new Error('Erro ao carregar dados')}
          resetErrorBoundary={resetErrorBoundary}
        />
      )}
    >
      <Outlet />
    </ErrorBoundary>
  )}
</QueryErrorResetBoundary>
```

**Por que importa**: Recovery de erro sem F5. Funciona junto com `router.invalidate()` existente no `RouteError`.

---

## FASE 2: Mutations (Alto Impacto, Risco Medio)

### 2.1 -- Optimistic Updates para Row Mutations

**Problema**: Tabela de rows e a view mais usada. Trash/restore, reactions, evaluations tem delay visivel enquanto servidor responde.

**Arquivos modificados**:

- `frontend/src/hooks/tanstack-query/use-row-update-trash.tsx`
- `frontend/src/hooks/tanstack-query/use-row-update-restore.tsx`
- `frontend/src/hooks/tanstack-query/use-row-update-reaction.tsx`
- `frontend/src/hooks/tanstack-query/use-row-update-evaluation.tsx`

**Pattern**:

```ts
onMutate: async (variables) => {
  // Cancela refetches em andamento
  await queryClient.cancelQueries({
    queryKey: queryKeys.rows.detail(slug, rowId),
  });

  // Snapshot do dado anterior
  const previous = queryClient.getQueryData(
    queryKeys.rows.detail(slug, rowId),
  );

  // Atualiza cache otimisticamente
  queryClient.setQueryData(queryKeys.rows.detail(slug, rowId), {
    ...previous,
    trashed: true,
  });

  return { previous };
},
onError: (_err, _vars, context) => {
  // Rollback em caso de erro
  if (context?.previous) queryClient.setQueryData(key, context.previous);
},
onSettled: () => {
  // Garante consistencia refetching a lista
  queryClient.invalidateQueries({
    queryKey: queryKeys.rows.lists(slug),
  });
},
```

**Por que importa**: Acoes na tabela de rows (trash, reaction, etc.) ficam instantaneas. Rollback automatico se o servidor falhar.

---

### 2.2 -- `setQueryData` nos onSuccess de Create/Update

**Problema**: Apos criar/atualizar user/group/menu/etc., navegacao para detalhe mostra dado stale ate refetch completar.

**Arquivos modificados**: Todos os `use-*-create.tsx` e `use-*-update.tsx` (~10 hooks)

**Pattern** (adicionado ao `onSuccess` existente):

```ts
onSuccess(data, variables) {
  // Cache imediato do detalhe
  queryClient.setQueryData(queryKeys.users.detail(data._id), data);

  // Lista continua sendo invalidada normalmente
  queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });

  props.onSuccess?.(data, variables);
},
```

**Por que importa**: Navegacao para detalhe apos create/update mostra dado fresco sem flash de loading.

---

### 2.3 -- Simplificar Auth: Zustand como estado sincrono, Query como fonte de dados

**Problema**: Auth e triple-layered (Zustand faz API call propria + Query faz fetch separado + Interceptor limpa no 401). Resultado: requests duplicados para `/profile`.

**Arquivos modificados**:

- `frontend/src/stores/authentication.ts` -- remover `fetchUser`, `signIn`, `signUp`, `signOut`; manter apenas `setUser`, `clear`
- `frontend/src/routes/__root.tsx` -- `beforeLoad` usa `queryClient.ensureQueryData(profileOptions())` ao inves de `state.fetchUser()`
- `frontend/src/hooks/tanstack-query/use-authentication-sign-in.tsx` -- `onSuccess` chama `useAuthStore.getState().setUser(data)`
- `frontend/src/hooks/tanstack-query/use-authentication-sign-out.tsx` -- `onSuccess` chama `clear()` + `queryClient.clear()`

**Zustand simplificado**:

```ts
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user: IUser | null) =>
        set({ user, isAuthenticated: Boolean(user) }),
      clear: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'low-code-js-auth' /* ... */ },
  ),
);
```

**Root beforeLoad**:

```ts
beforeLoad: async ({ context }) => {
  const state = useAuthStore.getState();
  if (!state.isAuthenticated) {
    try {
      const user = await context.queryClient.ensureQueryData(profileOptions());
      useAuthStore.getState().setUser(user);
    } catch {
      useAuthStore.getState().clear();
    }
  }
},
```

**Por que importa**: Elimina request duplicado para `/profile`. Single source of truth. Zustand continua como accessor sincrono para guards de rota.

---

## FASE 3: Performance e SSR (Impacto Medio)

### 3.1 -- `staleTime` customizado por tipo de dado

**Arquivo modificado**: `frontend/src/hooks/tanstack-query/_query-options.ts`

| Dado | staleTime | Razao |
|------|-----------|-------|
| Settings | `Infinity` | Muda rarissimamente, so via mutation explicita |
| Profile | `10 * 60 * 1000` (10min) | Muda pouco |
| Menus | `5 * 60 * 1000` (5min) | Muda pouco |
| Table rows | `30 * 1000` (30s) | Dados colaborativos, mudam frequentemente |
| Tabelas/Fields | `60 * 1000` (1min) | Schema muda com menos frequencia |
| Users/Groups | `2 * 60 * 1000` (2min) | Admin data, muda ocasionalmente |

**Por que importa**: Com staleTime global de 1 hora, rows colaborativos podem ficar stale por muito tempo. Settings nunca precisa de refetch desnecessario.

---

### 3.2 -- Search Params Middleware (`stripSearchParams`)

**Problema**: URLs ficam com `?page=1&perPage=50` mesmo quando sao defaults. Pagination component usa `@ts-ignore`.

**Arquivos modificados**: Todos os `index.tsx` de rotas com `validateSearch`

**Pattern**:

```ts
import { stripSearchParams } from '@tanstack/react-router';

export const Route = createFileRoute('/_private/users/')({
  validateSearch: searchSchema,
  search: {
    middlewares: [stripSearchParams({ page: 1, perPage: 50 })],
  },
});
```

**Por que importa**: URLs mais limpas, type safety sem `@ts-ignore`, defaults automaticamente removidos da URL.

---

### 3.3 -- Expandir Server Functions com `validator`

**Problema**: So existem 2 `createServerFn`. Nenhuma usa `validator` para validacao de input. Operacoes sensiveis poderiam rodar server-side.

**Arquivos novos**:

- `frontend/src/lib/server/auth.ts`
- `frontend/src/lib/server/settings.ts`

**Pattern**:

```ts
export const serverSignIn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const baseUrl = Env.VITE_API_BASE_URL;
    const response = await fetch(`${baseUrl}/authentication/sign-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Authentication failed');
    return response.json();
  });
```

**Por que importa**: Validacao Zod na fronteira de rede, credentials nao vazam pro client bundle, reducao do tamanho do bundle.

---

### 3.4 -- Remover `ssr: false` do Private Layout (condicional)

**Pre-requisito**: Fase 2.3 (auth consolidation). O servidor precisa resolver auth via cookies.

**Arquivo**: `frontend/src/routes/_private/layout.tsx` -- remover `ssr: false`

**Por que importa**: Com SSR, loaders rodam no servidor e HTML ja vem renderizado. First paint dramaticamente mais rapido. Mas so faz sentido se a API do backend aceitar cookies forwarded pelo server TanStack Start.

---

## FASE 4: Polish (Impacto Medio-Baixo)

### 4.1 -- Error/Pending Components por rota

Substituir skeleton generico por esqueletos especificos de cada rota no `pendingComponent` e mensagens contextuais no `errorComponent`.

```ts
export const Route = createFileRoute('/_private/users/')({
  pendingComponent: () => (
    <TableUsersSkeleton headers={['Nome', 'E-mail', 'Papel', 'Status']} />
  ),
  errorComponent: ({ error }) => (
    <LoadError message="Houve um erro ao buscar usuarios" />
  ),
});
```

---

### 4.2 -- SEO: Canonical URLs e Structured Data

Adicionar `<link rel="canonical">` e `og:url` no `head` de rotas publicas.

```ts
head: ({ loaderData }) => ({
  meta: [
    // ... existentes ...
    { property: 'og:url', content: '...' },
  ],
  links: [
    // ... existentes ...
    { rel: 'canonical', href: '...' },
  ],
  scripts: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: loaderData?.systemName,
      }),
    },
  ],
}),
```

---

### 4.3 -- Migracao para `useSuspenseQuery` (longo prazo)

Substituir o pattern `if (pending)... if (error)... if (success)...` por `useSuspenseQuery` + route `pendingComponent`/`errorComponent`.

**Antes** (pattern atual em todo `.lazy.tsx`):

```ts
const { status, data, refetch } = useUserReadPaginated(search);
if (status === 'pending') return <Skeleton />;
if (status === 'error') return <LoadError refetch={refetch} />;
return <TableUsers data={data.data} />;
```

**Depois**:

```ts
const { data } = useSuspenseQuery(userListOptions(search));
// Sem checks -- loading/error tratados pelo pendingComponent/errorComponent da rota
return <TableUsers data={data.data} />;
```

**Depende de**: Fase 1.2 (loaders) + 1.4 (error boundary). Migrar rota por rota.

---

## Sequencia de Implementacao

```
Fase 1 (1-2 sprints) -- Fundacao
  1.1 queryOptions factory          <- prerequisito para tudo
  1.2 Route loaders + loaderDeps    <- maior ganho de performance
  1.3 Env consolidation             <- trivial, 3 arquivos
  1.4 QueryErrorResetBoundary       <- 1 arquivo

Fase 2 (1-2 sprints) -- Mutations
  2.1 Optimistic updates (rows)
  2.2 setQueryData em create/update
  2.3 Auth simplification

Fase 3 (1 sprint) -- Performance
  3.1 staleTime por tipo de dado
  3.2 Search params middleware
  3.3 Expandir server functions
  3.4 Remover ssr:false (se viavel)

Fase 4 (ongoing) -- Polish
  4.1 Error/pending por rota
  4.2 SEO improvements
  4.3 useSuspenseQuery migration
```

---

## Verificacao

| Apos | Teste |
|------|-------|
| Fase 1.1+1.2 | Hover sobre link de usuario -> dados pre-carregados -> clique -> sem skeleton |
| Fase 1.3 | Deploy com env errada -> erro Zod claro ao iniciar |
| Fase 1.4 | Query falha -> erro exibido -> clique Retry -> query re-executada sem F5 |
| Fase 2.1 | Trash de row -> UI atualiza instantaneamente -> rollback se erro |
| Fase 2.2 | Editar usuario -> navegar para detalhe -> dado fresco sem flash |
| Fase 2.3 | Login -> apenas 1 request para `/profile` (nao 2) |
| Fase 3.1 | Settings nunca refaz fetch desnecessario; rows refazem a cada 30s |
| Fase 3.2 | URL sem `?page=1&perPage=50` quando sao defaults |
