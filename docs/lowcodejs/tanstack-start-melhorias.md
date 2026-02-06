# Melhorias TanStack Start para LowCodeJS

## Stack Atual

| Pacote | Versão |
|--------|--------|
| `@tanstack/react-start` | 1.132.0 |
| `@tanstack/react-router` | 1.132.0 |
| `@tanstack/react-query` | 5.66.5 |
| `@tanstack/react-form` | 1.0.0 |
| `@tanstack/router-plugin` | 1.132.0 |
| `@tanstack/react-router-ssr-query` | 1.131.7 |
| Runtime | Nitro (via Vite) |

## Resumo da Análise

- **93 arquivos de rota** em `src/routes/`
- **40 hooks** de TanStack Query em `src/hooks/tanstack-query/`
- **1 único prefixo** de query key (`PROFILE`) em `_query-keys.ts`
- **Axios como único cliente HTTP** — nenhuma server function utilizada
- **Auth 100% client-side** via Zustand + localStorage
- **Nenhum `beforeLoad`**, `errorComponent`, `pendingComponent` ou `loader` em uso
- **SEO estático** — título fixo "LowCodeJS Platform" em todas as rotas

---

## Tabela Resumo

| # | Melhoria | Prioridade | Esforço | Impacto |
|---|----------|-----------|---------|---------|
| 1 | Server Functions (`createServerFn`) | Alta | Alto | Alto |
| 2 | Route Guards com `beforeLoad` | Alta | Baixo | Alto |
| 3 | Error Handling por Rota (`errorComponent`) | Alta | Médio | Alto |
| 4 | Query Key Factory Pattern | Alta | Baixo | Médio |
| 5 | SEO e Meta Tags Dinâmicas | Alta | Baixo | Médio |
| 6 | Middleware de Autenticação | Alta | Médio | Alto |
| 7 | Streaming e Deferred Data | Média | Médio | Médio |
| 8 | Autenticação Server-Side | Média | Alto | Alto |
| 9 | `pendingComponent` para Transições | Média | Baixo | Médio |
| 10 | Route-Level Data Loading (`loader`) | Média | Médio | Alto |
| 11 | Static Prerendering | Baixa | Baixo | Baixo |
| 12 | ISR (Incremental Static Regeneration) | Baixa | Médio | Médio |
| 13 | SPA Mode Seletivo | Baixa | Baixo | Baixo |
| 14 | Observabilidade (OpenTelemetry) | Baixa | Alto | Médio |
| 15 | Environment Functions | Baixa | Baixo | Baixo |

---

## ALTA PRIORIDADE

### 1. Server Functions (`createServerFn`)

**Estado Atual:** Todas as chamadas HTTP passam pelo singleton Axios em `src/lib/api.ts`, que faz requests diretos ao backend separado. Cada hook em `src/hooks/tanstack-query/` constrói rotas como strings e chama `API.get`/`API.post`.

**Problema:** Não aproveita a capacidade do TanStack Start de executar código server-side diretamente, perdendo tipagem end-to-end e expondo a URL do backend ao client.

**ANTES** — `src/hooks/tanstack-query/use-table-read.tsx`:
```tsx
import { API } from '@/lib/api';
import type { ITable } from '@/lib/interfaces';

export function useReadTable(payload: { slug: string }): UseQueryResult<ITable, Error> {
  return useQuery({
    queryKey: ['/tables/'.concat(payload.slug), payload.slug],
    queryFn: async function () {
      const route = '/tables/'.concat(payload.slug);
      const response = await API.get<ITable>(route);
      return response.data;
    },
    enabled: Boolean(payload.slug),
  });
}
```

**DEPOIS** — `src/server/functions/tables.ts` + hook atualizado:
```tsx
// src/server/functions/tables.ts
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

export const getTable = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    const response = await fetch(
      `${process.env.SERVER_URL}/tables/${data.slug}`,
      { headers: { /* forward cookies/auth */ } }
    );
    if (!response.ok) throw new Error('Falha ao buscar tabela');
    return response.json() as Promise<ITable>;
  });

// src/hooks/tanstack-query/use-table-read.tsx (atualizado)
import { getTable } from '@/server/functions/tables';

export function useReadTable(payload: { slug: string }): UseQueryResult<ITable, Error> {
  return useQuery({
    queryKey: tableKeys.detail(payload.slug),
    queryFn: () => getTable({ data: { slug: payload.slug } }),
    enabled: Boolean(payload.slug),
  });
}
```

**Benefícios:**
- Tipagem end-to-end (input validado com Zod, output tipado)
- URL do backend nunca exposta ao client
- Possibilidade de acessar cookies/headers server-side diretamente
- Base para middleware de autenticação (melhoria #6)

**Arquivos Afetados:**
- `src/lib/api.ts` — mantido para hooks ainda não migrados
- `src/server/functions/tables.ts` (novo)
- `src/server/functions/users.ts` (novo)
- `src/server/functions/menus.ts` (novo)
- `src/server/functions/auth.ts` (novo)
- Todos os hooks em `src/hooks/tanstack-query/`

---

### 2. Route Guards com `beforeLoad`

**Estado Atual:** `src/routes/_private/layout.tsx` verifica autenticação no render do componente via `useAuthenticationStore().authenticated`. Se o usuário não está autenticado, a sidebar simplesmente não renderiza, mas a rota carrega normalmente.

**Problema:** Rotas privadas são acessíveis sem autenticação — o componente apenas esconde a UI, sem redirecionar. O conteúdo das rotas filhas ainda é renderizado.

**ANTES** — `src/routes/_private/layout.tsx`:
```tsx
export const Route = createFileRoute('/_private')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const authentication = useAuthenticationStore().authenticated;
  const isAuthenticated = Boolean(authentication?.role);

  const { menu } = useMenuDynamic(authentication?.role ?? E_ROLE.REGISTERED);

  return (
    <SidebarProvider>
      {isAuthenticated && <Sidebar menu={menu} />}
      <SidebarInset>
        <Header routesWithoutSearchInput={routesWithoutSearchInput} />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
```

**DEPOIS** — `src/routes/_private/layout.tsx` com `beforeLoad`:
```tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_private')({
  beforeLoad: async ({ context }) => {
    // Quando migrar para server-side auth (melhoria #8):
    // const user = await getCurrentUser();
    // if (!user) throw redirect({ to: '/' });

    // Versão atual (client-side):
    const auth = useAuthenticationStore.getState().authenticated;
    if (!auth?.role) {
      throw redirect({ to: '/' });
    }

    return { auth };
  },
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { auth } = Route.useRouteContext();
  const { menu } = useMenuDynamic(auth.role ?? E_ROLE.REGISTERED);

  return (
    <SidebarProvider>
      <Sidebar menu={menu} />
      <SidebarInset>
        <Header routesWithoutSearchInput={routesWithoutSearchInput} />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
```

**Benefícios:**
- Redirect automático antes de renderizar qualquer coisa
- Auth disponível via `useRouteContext()` — sem necessidade de chamar o store em cada componente
- Elimina verificação condicional `isAuthenticated &&` no render
- Funciona com SSR — `beforeLoad` roda antes do componente no server

**Arquivos Afetados:**
- `src/routes/_private/layout.tsx`
- `src/routes/__root.tsx` (adicionar `auth` ao `MyRouterContext`)

---

### 3. Error Handling por Rota (`errorComponent`)

**Estado Atual:** Nenhum `errorComponent` definido em qualquer rota. Erros de query (ex: 404, 500) são tratados inline nos componentes ou simplesmente não tratados.

**Problema:** Erro em qualquer rota filha pode quebrar toda a aplicação. Não há boundary de erro por seção.

**ANTES** — Sem tratamento de erro na rota:
```tsx
export const Route = createFileRoute('/_private')({
  component: RouteComponent,
});
// Se useMenuDynamic ou useReadTable falha → tela branca ou crash
```

**DEPOIS** — Com `errorComponent`:
```tsx
import { ErrorComponent } from '@tanstack/react-router';
import type { ErrorComponentProps } from '@tanstack/react-router';

function PrivateErrorComponent({ error, reset }: ErrorComponentProps) {
  if (error instanceof AxiosError && error.response?.status === 401) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <h2 className="text-xl font-semibold">Algo deu errado</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  );
}

export const Route = createFileRoute('/_private')({
  beforeLoad: async ({ context }) => { /* ... */ },
  component: RouteComponent,
  errorComponent: PrivateErrorComponent,
});
```

**Onde aplicar:**
- `/_private/layout.tsx` — error boundary geral para rotas privadas
- `/_private/tables/$slug/index.tsx` — tabela não encontrada
- `/_private/tables/$slug/row/$rowId/index.tsx` — row não encontrada
- `/_private/users/$userId/index.tsx` — usuário não encontrado

**Benefícios:**
- Erros contidos por seção (erro em tabelas não afeta menus)
- UX consistente para erros 404/500
- Botão "Tentar novamente" via `reset` para re-render
- Redirect automático para 401

---

### 4. Query Key Factory Pattern

**Estado Atual:** `src/hooks/tanstack-query/_query-keys.ts` contém apenas:
```ts
export const TANSTACK_QUERY_KEY_PREFIXES = {
  PROFILE: '/profile',
};
```

Cada hook constrói suas query keys inline de forma inconsistente:
- `use-table-read.tsx`: `['/tables/'.concat(payload.slug), payload.slug]`
- `use-tables-read-paginated.tsx`: `['/tables/paginated', page, perPage]`
- `use-profile-read.tsx`: `['/profile', authentication.authenticated?.sub]`
- `use-user-read-paginated.tsx`: `['/users/paginated', search]`
- `use-table-row-read-paginated.tsx`: `[route, payload.slug, payload.search]`

**Problema:** Invalidação de cache é difícil e propensa a erros. Não há hierarquia entre keys.

**DEPOIS** — `src/hooks/tanstack-query/_query-keys.ts` (expandido):
```ts
export const queryKeys = {
  tables: {
    all: ['tables'] as const,
    lists: () => [...queryKeys.tables.all, 'list'] as const,
    list: (params: { page?: number; perPage?: number }) =>
      [...queryKeys.tables.lists(), params] as const,
    details: () => [...queryKeys.tables.all, 'detail'] as const,
    detail: (slug: string) => [...queryKeys.tables.details(), slug] as const,
  },

  rows: {
    all: (tableSlug: string) => ['tables', tableSlug, 'rows'] as const,
    list: (tableSlug: string, params: Record<string, unknown>) =>
      [...queryKeys.rows.all(tableSlug), 'list', params] as const,
    detail: (tableSlug: string, rowId: string) =>
      [...queryKeys.rows.all(tableSlug), 'detail', rowId] as const,
  },

  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (userId: string) => [...queryKeys.users.details(), userId] as const,
  },

  menus: {
    all: ['menus'] as const,
    lists: () => [...queryKeys.menus.all, 'list'] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.menus.lists(), params] as const,
    details: () => [...queryKeys.menus.all, 'detail'] as const,
    detail: (menuId: string) => [...queryKeys.menus.details(), menuId] as const,
    dynamic: () => [...queryKeys.menus.all, 'dynamic'] as const,
  },

  groups: {
    all: ['groups'] as const,
    lists: () => [...queryKeys.groups.all, 'list'] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.groups.lists(), params] as const,
    details: () => [...queryKeys.groups.all, 'detail'] as const,
    detail: (groupId: string) =>
      [...queryKeys.groups.details(), groupId] as const,
  },

  profile: {
    all: ['profile'] as const,
    detail: (sub?: string) => [...queryKeys.profile.all, sub] as const,
  },

  settings: {
    all: ['settings'] as const,
    detail: () => [...queryKeys.settings.all, 'detail'] as const,
  },

  fields: {
    all: (tableSlug: string) => ['tables', tableSlug, 'fields'] as const,
    detail: (tableSlug: string, fieldId: string) =>
      [...queryKeys.fields.all(tableSlug), fieldId] as const,
  },

  permissions: {
    all: ['permissions'] as const,
    detail: (id: string) => [...queryKeys.permissions.all, id] as const,
  },

  pages: {
    all: ['pages'] as const,
    detail: (slug: string) => [...queryKeys.pages.all, slug] as const,
  },
} as const;
```

**Uso nos hooks (exemplo `use-table-read.tsx`):**
```tsx
import { queryKeys } from './_query-keys';

export function useReadTable(payload: { slug: string }) {
  return useQuery({
    queryKey: queryKeys.tables.detail(payload.slug),
    // ...
  });
}
```

**Invalidação hierárquica (exemplo em mutation):**
```tsx
// Invalida TODAS as queries de tabelas (lista + detalhes):
queryClient.invalidateQueries({ queryKey: queryKeys.tables.all });

// Invalida apenas listas de tabelas:
queryClient.invalidateQueries({ queryKey: queryKeys.tables.lists() });

// Invalida uma tabela específica:
queryClient.invalidateQueries({ queryKey: queryKeys.tables.detail('minha-tabela') });

// Invalida todas as rows de uma tabela específica:
queryClient.invalidateQueries({ queryKey: queryKeys.rows.all('minha-tabela') });
```

**Benefícios:**
- Invalidação hierárquica precisa
- Autocompletar TypeScript em todas as keys
- Zero risco de typo em query keys
- Facilita otimistic updates

**Arquivos Afetados:**
- `src/hooks/tanstack-query/_query-keys.ts` (reescrever)
- Todos os 40 hooks em `src/hooks/tanstack-query/` (atualizar queryKey)

---

### 5. SEO e Meta Tags Dinâmicas

**Estado Atual:** `src/routes/__root.tsx` define título estático para toda a aplicação:
```tsx
export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'LowCodeJS Platform' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
});
```

**Problema:** Todas as páginas têm o mesmo título "LowCodeJS Platform". Não há meta tags Open Graph, description, ou títulos dinâmicos por rota.

**DEPOIS** — Exemplo para rota de tabela `src/routes/_private/tables/$slug/index.tsx`:
```tsx
export const Route = createFileRoute('/_private/tables/$slug/')({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} | Tabelas | LowCodeJS` },
      {
        name: 'description',
        content: `Visualizando tabela ${params.slug} na plataforma LowCodeJS`,
      },
      { property: 'og:title', content: `${params.slug} | LowCodeJS` },
      { property: 'og:type', content: 'website' },
    ],
  }),
  component: TableSlugComponent,
});
```

**DEPOIS** — Exemplo para rota raiz `__root.tsx` (melhorado):
```tsx
export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'LowCodeJS Platform' },
      { name: 'description', content: 'Plataforma low-code para construção de aplicações' },
      { property: 'og:title', content: 'LowCodeJS Platform' },
      { property: 'og:description', content: 'Plataforma low-code para construção de aplicações' },
      { property: 'og:type', content: 'website' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
});
```

**Rotas para adicionar `head()` dinâmico:**
- `/_private/tables/$slug/index.tsx` — título com nome da tabela
- `/_private/tables/$slug/row/$rowId/index.tsx` — título com ID do row
- `/_private/users/$userId/index.tsx` — título com nome do usuário
- `/_private/profile/index.tsx` — "Meu Perfil | LowCodeJS"
- `/_private/dashboard/index.tsx` — "Dashboard | LowCodeJS"
- `/_authentication/_sign-in/index.tsx` — "Entrar | LowCodeJS"
- `/_authentication/sign-up/index.tsx` — "Cadastrar | LowCodeJS"

---

### 6. Middleware de Autenticação

**Estado Atual:** Nenhum middleware. Auth é feita client-side via Zustand store (`src/stores/authentication.ts`) persistido em localStorage.

**Problema:** Server functions (quando implementadas — melhoria #1) não teriam acesso ao estado de autenticação. Cada server function precisaria validar auth individualmente.

**DEPOIS** — `src/server/middleware/auth.ts`:
```tsx
import { createMiddleware } from '@tanstack/react-start';

type AuthContext = {
  userId: string;
  role: string;
};

export const authMiddleware = createMiddleware()
  .server(async ({ next }) => {
    // Ler cookie httpOnly enviado pelo backend
    const { getWebRequest } = await import('vinxi/http');
    const request = getWebRequest();
    const cookieHeader = request.headers.get('cookie') ?? '';

    // Validar sessão com o backend
    const response = await fetch(`${process.env.SERVER_URL}/profile`, {
      headers: { cookie: cookieHeader },
    });

    if (!response.ok) {
      throw new Error('Não autenticado');
    }

    const user = await response.json();

    return next({
      context: {
        userId: user._id,
        role: user.role,
      } satisfies AuthContext,
    });
  });
```

**Uso em server functions:**
```tsx
import { authMiddleware } from '@/server/middleware/auth';

export const getTable = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data, context }) => {
    // context.userId e context.role disponíveis automaticamente
    console.log(`User ${context.userId} acessando tabela ${data.slug}`);
    // ...
  });
```

**Benefícios:**
- Auth centralizada para todas as server functions
- Contexto de auth tipado e disponível via `context`
- Validação server-side (não depende de localStorage)
- Composável — pode criar middleware para admin, owner, etc.

**Arquivos Afetados:**
- `src/server/middleware/auth.ts` (novo)
- Todas as server functions criadas na melhoria #1

---

## MÉDIA PRIORIDADE

### 7. Streaming e Deferred Data

**Estado Atual:** Todas as queries rodam client-side. Não há uso de `defer()` para dados secundários.

**Melhoria:** Usar `defer()` no `loader` para enviar dados essenciais imediatamente e dados secundários via streaming.

**Exemplo** — Dashboard com stats imediatos e gráficos deferred:
```tsx
// src/routes/_private/dashboard/index.tsx
import { defer } from '@tanstack/react-start';

export const Route = createFileRoute('/_private/dashboard/')({
  loader: async ({ context }) => {
    const stats = await getStats(); // Espera (dados críticos)

    return {
      stats,
      charts: defer(getChartData()),    // Streaming (dados secundários)
      activity: defer(getActivity()),    // Streaming (dados secundários)
    };
  },
  component: DashboardComponent,
});

function DashboardComponent() {
  const { stats, charts, activity } = Route.useLoaderData();

  return (
    <div>
      <StatCards stats={stats} />
      <Suspense fallback={<ChartSkeleton />}>
        <Await promise={charts}>
          {(data) => <Charts data={data} />}
        </Await>
      </Suspense>
      <Suspense fallback={<ActivitySkeleton />}>
        <Await promise={activity}>
          {(data) => <RecentActivity data={data} />}
        </Await>
      </Suspense>
    </div>
  );
}
```

**Candidatos para streaming:**
- Dashboard: gráficos e atividade recente (atualmente em `src/routes/_private/dashboard/`)
- Tabela detail: campos e permissões (dados secundários)
- Perfil: histórico de atividade

---

### 8. Autenticação Server-Side

**Estado Atual:** `src/stores/authentication.ts` armazena dados de auth em Zustand + localStorage:
```ts
export const useAuthenticationStore = create<AuthenticationStore>()(
  persist(
    (set) => ({
      authenticated: null,
      isAuthenticated: false,
      setAuthenticated: (authenticated) =>
        set({ authenticated, isAuthenticated: !!authenticated }),
      logout: () => set({ authenticated: null, isAuthenticated: false }),
    }),
    {
      name: 'authentication-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
```

**Problema:** Auth baseada em localStorage é insegura (XSS pode ler/modificar), não funciona com SSR, e causa flash de conteúdo não-autenticado.

**Melhoria:** Criar server function `getCurrentUser` que valida sessão via cookies httpOnly:
```tsx
// src/server/functions/auth.ts
import { createServerFn } from '@tanstack/react-start';

export const getCurrentUser = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { getWebRequest } = await import('vinxi/http');
    const request = getWebRequest();
    const cookieHeader = request.headers.get('cookie') ?? '';

    const response = await fetch(`${process.env.SERVER_URL}/profile`, {
      headers: { cookie: cookieHeader },
    });

    if (!response.ok) return null;
    return response.json();
  });
```

**Uso em `beforeLoad`:**
```tsx
// src/routes/_private/layout.tsx
export const Route = createFileRoute('/_private')({
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) throw redirect({ to: '/' });
    return { user };
  },
  component: RouteComponent,
});
```

**Migração gradual:**
1. Criar `getCurrentUser` server function
2. Usar em `beforeLoad` do layout privado
3. Manter Zustand temporariamente para client-side state
4. Remover Zustand auth quando todas as rotas migrarem

**Arquivos Afetados:**
- `src/server/functions/auth.ts` (novo)
- `src/routes/_private/layout.tsx`
- `src/stores/authentication.ts` (deprecar gradualmente)

---

### 9. `pendingComponent` para Transições

**Estado Atual:** Nenhum `pendingComponent` definido. Navegação entre rotas não mostra feedback visual enquanto carrega dados.

**Melhoria:** Adicionar `pendingComponent` nos layouts e rotas críticas.

**Exemplo:**
```tsx
// src/routes/_private/layout.tsx
import { Loader2 } from 'lucide-react';

function PrivatePendingComponent() {
  return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export const Route = createFileRoute('/_private')({
  beforeLoad: async ({ context }) => { /* ... */ },
  component: RouteComponent,
  errorComponent: PrivateErrorComponent,
  pendingComponent: PrivatePendingComponent,
});
```

**Ou no router (global):**
```tsx
// src/router.tsx
export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: { ...rqContext },
    defaultPreload: 'intent',
    defaultPendingComponent: () => (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
    // ...
  });
};
```

**Nota:** Os skeletons já existentes no projeto (`-table-tables-skeleton.tsx`, `-update-form-skeleton.tsx`, etc.) podem ser reaproveitados como `pendingComponent` nas rotas correspondentes.

---

### 10. Route-Level Data Loading (`loader`)

**Estado Atual:** Dados são carregados exclusivamente via hooks `useQuery` dentro dos componentes. O componente renderiza, monta, e só então inicia o fetch.

**Melhoria:** Usar `loader` com `ensureQueryData` para iniciar o fetch antes do componente renderizar.

**ANTES** — `src/routes/_private/tables/$slug/index.tsx`:
```tsx
export const Route = createFileRoute('/_private/tables/$slug/')({
  component: TableSlugComponent,
});

function TableSlugComponent() {
  const { slug } = Route.useParams();
  const { data: table, isLoading } = useReadTable({ slug });

  if (isLoading) return <TableSkeleton />;
  // ...
}
```

**DEPOIS** — Com `loader`:
```tsx
export const Route = createFileRoute('/_private/tables/$slug/')({
  loader: async ({ params, context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: queryKeys.tables.detail(params.slug),
      queryFn: () => getTable({ data: { slug: params.slug } }),
    });
  },
  component: TableSlugComponent,
  pendingComponent: TableSkeleton,
});

function TableSlugComponent() {
  const { slug } = Route.useParams();
  // Dados já estão no cache — render instantâneo
  const { data: table } = useReadTable({ slug });
  // ...
}
```

**Benefícios:**
- Fetch inicia durante a navegação (antes do render)
- Eliminação de loading states manuais (delegado ao `pendingComponent`)
- Dados pré-carregados com `defaultPreload: 'intent'` (hover em links)
- Funciona com SSR — loader roda no server

**Candidatos prioritários:**
- `/_private/tables/$slug/index.tsx` — tabela por slug
- `/_private/tables/$slug/row/$rowId/index.tsx` — row por ID
- `/_private/users/$userId/index.tsx` — usuário por ID
- `/_private/groups/$groupId/index.tsx` — grupo por ID
- `/_private/menus/$menuId/index.tsx` — menu por ID
- `/_private/profile/index.tsx` — perfil do usuário

---

## BAIXA PRIORIDADE

### 11. Static Prerendering

**Estado Atual:** Todas as rotas são renderizadas em runtime (SSR ou client-side).

**Melhoria:** Páginas públicas que raramente mudam (sign-in, sign-up) podem ser pré-renderizadas em build time.

```tsx
// app.config.ts
import { defineConfig } from '@tanstack/react-start/config';

export default defineConfig({
  server: {
    prerender: {
      routes: ['/', '/_authentication/_sign-in', '/_authentication/sign-up'],
      crawlLinks: false,
    },
  },
});
```

**Benefícios:**
- TTFB próximo de zero para páginas de login
- Reduz carga no server
- SEO perfeito para landing pages

---

### 12. ISR (Incremental Static Regeneration)

**Estado Atual:** Sem ISR. Views públicas de tabelas (se existirem no futuro) seriam renderizadas a cada request.

**Melhoria:** Configurar ISR para views públicas de tabelas com revalidação por tempo:

```tsx
// src/routes/public/tables/$slug/index.tsx
export const Route = createFileRoute('/public/tables/$slug/')({
  loader: async ({ params }) => {
    return { table: await getPublicTable({ data: { slug: params.slug } }) };
  },
  headers: () => ({
    'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
  }),
  component: PublicTableView,
});
```

**Nota:** Relevante apenas quando/se o LowCodeJS expor views públicas de dados.

---

### 13. SPA Mode Seletivo

**Estado Atual:** SSR ativado globalmente via TanStack Start + Nitro.

**Melhoria:** Desabilitar SSR em rotas pesadas de interação (dashboard com gráficos, editor de formulários) onde SSR não agrega valor:

```tsx
// src/routes/_private/dashboard/index.tsx
export const Route = createFileRoute('/_private/dashboard/')({
  ssr: false, // Renderiza apenas client-side
  component: DashboardComponent,
});
```

**Candidatos:**
- Dashboard com Recharts (gráficos são client-only)
- Editor de campos (drag & drop com @dnd-kit)
- Editor de texto rico (TipTap)

**Benefício:** Reduz carga no server para rotas que necessariamente precisam do browser.

---

### 14. Observabilidade (OpenTelemetry)

**Melhoria:** Instrumentar server functions com OpenTelemetry para rastreamento de performance:

```tsx
// src/server/middleware/telemetry.ts
import { createMiddleware } from '@tanstack/react-start';

export const telemetryMiddleware = createMiddleware()
  .server(async ({ next }) => {
    const start = performance.now();
    const result = await next();
    const duration = performance.now() - start;

    // Enviar para serviço de observabilidade
    console.log(`[Server Function] ${duration.toFixed(2)}ms`);

    return result;
  });
```

**Nota:** Requer setup de infraestrutura de observabilidade (Grafana, Datadog, etc.). Avaliar necessidade conforme crescimento do projeto.

---

### 15. Environment Functions

**Estado Atual:** `src/env.ts` usa `@t3-oss/env-core` com Zod para validação de variáveis de ambiente:
```ts
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const Env = createEnv({
  server: { SERVER_URL: z.url().optional() },
  clientPrefix: 'VITE_',
  client: {
    VITE_APP_TITLE: z.string().min(1).optional(),
    VITE_API_BASE_URL: z.url().default('http://localhost:3000'),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
});
```

**Avaliação:** A solução atual com `@t3-oss/env-core` é sólida e bem integrada. O TanStack Start oferece `createEnvPlugin()` como alternativa, mas a migração não é prioritária.

**Recomendação:** Manter `@t3-oss/env-core`. Reavaliar apenas se:
- O TanStack Start adicionar funcionalidades de env que `@t3-oss/env-core` não oferece
- Houver problemas de compatibilidade com futuras versões do Vite/Nitro

---

## Roteiro de Implementação

### Fase 1 — Fundação (Semana 1-2)
**Objetivo:** Preparar a base sem quebrar funcionalidade existente.

1. **Query Key Factory** (melhoria #4)
   - Reescrever `_query-keys.ts` com factory pattern
   - Atualizar todos os 40 hooks para usar novas keys
   - Validar que invalidações existentes continuam funcionando

2. **`beforeLoad` no layout privado** (melhoria #2)
   - Adicionar `beforeLoad` em `_private/layout.tsx`
   - Usar `useAuthenticationStore.getState()` (não hooks) para check sync
   - Testar redirect de rotas privadas sem auth

3. **Server function `getCurrentUser`** (melhoria #8 parcial)
   - Criar `src/server/functions/auth.ts`
   - Integrar com `beforeLoad` do layout privado

### Fase 2 — Server Functions (Semana 3-4)
**Objetivo:** Migrar chamadas HTTP críticas para server functions.

4. **Middleware de autenticação** (melhoria #6)
   - Criar `src/server/middleware/auth.ts`
   - Validar cookies httpOnly no server

5. **Server functions para entidades principais** (melhoria #1)
   - `src/server/functions/tables.ts`
   - `src/server/functions/users.ts`
   - `src/server/functions/menus.ts`
   - `src/server/functions/groups.ts`

6. **Migrar hooks de query** para usar server functions
   - Começar pelos hooks de leitura (GET)
   - Depois migrar mutations (POST/PUT/DELETE)

### Fase 3 — UX (Semana 5-6)
**Objetivo:** Melhorar experiência do usuário com error handling e loading states.

7. **`errorComponent`** (melhoria #3)
   - Layout privado
   - Rotas de detalhe (tabela, usuário, grupo, menu)

8. **`pendingComponent`** (melhoria #9)
   - Global no router
   - Específico por rota usando skeletons existentes

9. **SEO e meta tags** (melhoria #5)
   - `__root.tsx` com Open Graph
   - Rotas com `head()` dinâmico

### Fase 4 — Performance (Semana 7-8)
**Objetivo:** Otimizar carregamento de dados e rendering.

10. **Route-level `loader`** (melhoria #10)
    - Usar `ensureQueryData` nas rotas de detalhe
    - Delegar loading state ao `pendingComponent`

11. **Streaming/Deferred data** (melhoria #7)
    - Dashboard com `defer()` para gráficos
    - Perfil com `defer()` para histórico

12. **SPA mode seletivo** (melhoria #13)
    - `ssr: false` em dashboard e editores

### Fase 5 — Polimento (Semana 9+)
**Objetivo:** Otimizações finais e observabilidade.

13. **Static prerendering** (melhoria #11)
    - Sign-in e sign-up

14. **Observabilidade** (melhoria #14)
    - Middleware de telemetria para server functions

15. **Revisão geral**
    - Remover Zustand auth store (se auth server-side completa)
    - Avaliar remoção do Axios (se todas as chamadas migraram)

---

## Arquivos Afetados

| Arquivo | Melhorias | Tipo |
|---------|-----------|------|
| `src/hooks/tanstack-query/_query-keys.ts` | #4 | Reescrever |
| `src/routes/_private/layout.tsx` | #2, #3, #9 | Modificar |
| `src/routes/__root.tsx` | #2, #5 | Modificar |
| `src/router.tsx` | #9 | Modificar |
| `src/lib/api.ts` | #1 | Manter (deprecar gradualmente) |
| `src/stores/authentication.ts` | #8 | Deprecar gradualmente |
| `src/env.ts` | #15 | Sem alteração |
| `src/server/functions/auth.ts` | #1, #6, #8 | Novo |
| `src/server/functions/tables.ts` | #1 | Novo |
| `src/server/functions/users.ts` | #1 | Novo |
| `src/server/functions/menus.ts` | #1 | Novo |
| `src/server/functions/groups.ts` | #1 | Novo |
| `src/server/middleware/auth.ts` | #6 | Novo |
| `src/server/middleware/telemetry.ts` | #14 | Novo |
| `src/hooks/tanstack-query/use-table-read.tsx` | #1, #4 | Modificar |
| `src/hooks/tanstack-query/use-tables-read-paginated.tsx` | #1, #4 | Modificar |
| `src/hooks/tanstack-query/use-profile-read.tsx` | #1, #4, #8 | Modificar |
| `src/hooks/tanstack-query/use-user-read-paginated.tsx` | #1, #4 | Modificar |
| `src/hooks/tanstack-query/use-table-row-read-paginated.tsx` | #1, #4 | Modificar |
| `src/hooks/tanstack-query/use-menu-dynamic.tsx` | #1, #4 | Modificar |
| `src/hooks/tanstack-query/use-authentication-sign-in.tsx` | #1, #8 | Modificar |
| Demais hooks em `src/hooks/tanstack-query/` (~20 arquivos) | #1, #4 | Modificar |
| `src/routes/_private/dashboard/index.tsx` | #5, #7, #10, #13 | Modificar |
| `src/routes/_private/tables/$slug/index.tsx` | #3, #5, #10 | Modificar |
| `src/routes/_private/tables/$slug/row/$rowId/index.tsx` | #3, #5, #10 | Modificar |
| `src/routes/_private/users/$userId/index.tsx` | #3, #5, #10 | Modificar |
| `src/routes/_private/groups/$groupId/index.tsx` | #5, #10 | Modificar |
| `src/routes/_private/menus/$menuId/index.tsx` | #5, #10 | Modificar |
| `src/routes/_private/profile/index.tsx` | #5, #10 | Modificar |
| `src/routes/_authentication/_sign-in/index.tsx` | #5, #11 | Modificar |
| `src/routes/_authentication/sign-up/index.tsx` | #5, #11 | Modificar |
| `app.config.ts` | #11, #12 | Modificar |
