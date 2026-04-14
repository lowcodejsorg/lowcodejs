---
name: maiyu:frontend-route
description: |
  Generates file-based route definitions for frontend projects.
  Use when: user asks to create a route, page, screen, view route,
  or mentions "route" or "page" for navigation/routing.
  Supports: TanStack Router, Next.js App Router, Remix.
  Frameworks: TanStack Start, React (Vite), Next.js, Remix.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **Router**: `@tanstack/react-router` | `@tanstack/react-start` | `next` | `@remix-run/react` | `react-router`
   - **Query**: `@tanstack/react-query` (for data prefetching in loaders)
   - **Validation**: `zod` (for search params validation)
3. Scan existing routes to detect:
   - Route location (`src/routes/`, `app/`, `src/app/`)
   - Layout guards (`_private/`, `_authentication/`)
   - File conventions (`.lazy.tsx` splits, `layout.tsx`, `index.tsx`)
   - Prefetch patterns (`ensureQueryData` in loaders)
4. If router not detected, ask user

## Conventions

### TanStack Router
- **Route def**: `index.tsx` with `createFileRoute()`
- **Lazy component**: `index.lazy.tsx` with `createLazyFileRoute()`
- **Layout**: `layout.tsx` with `createFileRoute()` + `<Outlet />`
- **Route groups**: `_private/` (auth required), `_authentication/` (guests only)
- **Dynamic params**: `$param/` directory naming
- **Search params**: validated with Zod in `validateSearch`

### Next.js App Router
- **Page**: `page.tsx` (server component by default)
- **Loading**: `loading.tsx`
- **Error**: `error.tsx` (`'use client'`)
- **Layout**: `layout.tsx`
- **Dynamic params**: `[param]/` directory naming
- **Metadata**: `generateMetadata()` export

### Remix
- **Route**: `{segment}.tsx` or `{segment}/route.tsx`
- **Loader**: `loader` export for data fetching
- **Action**: `action` export for mutations
- **Meta**: `meta()` export

### Rules
- Prefetch data in loaders (not in components)
- Validate search params with Zod
- Auth guards in layout `beforeLoad` (not per-route)
- No ternary operators — use if/else, early return, or const mapper
- No `any` type — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- Explicit return types on all functions and components
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains

## Templates

### TanStack Router (Reference Implementation)

**Route Definition — `index.tsx`:**
```typescript
import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import { tableDetailOptions, rowListOptions } from '@/hooks/tanstack-query/_query-options';
import { useAuthStore } from '@/stores/authentication';

const SearchSchema = z.object({
  page: z.coerce.number().default(1),
  perPage: z.coerce.number().default(50),
  trashed: z.coerce.boolean().optional(),
});

export const Route = createFileRoute('/_private/tables/$slug/')({
  head: ({ params }) => ({
    meta: [{ title: `Table: ${params.slug}` }],
  }),
  validateSearch: SearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, params, deps }) => {
    const user = useAuthStore.getState().user;

    await Promise.all([
      context.queryClient.ensureQueryData(tableDetailOptions(params.slug)),
      context.queryClient.ensureQueryData(
        rowListOptions(params.slug, {
          page: deps.page,
          perPage: deps.perPage,
          trashed: deps.trashed,
        }),
      ),
    ]);
  },
});
```

**Lazy Component — `index.lazy.tsx`:**
```tsx
import { createLazyFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { tableDetailOptions, rowListOptions } from '@/hooks/tanstack-query/_query-options';
import { DataTable } from '@/components/common/data-table/data-table';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createLazyFileRoute('/_private/tables/$slug/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { slug } = Route.useParams();
  const search = Route.useSearch();

  const tableQuery = useQuery(tableDetailOptions(slug));
  const rowsQuery = useQuery(
    rowListOptions(slug, {
      page: search.page,
      perPage: search.perPage,
    }),
  );

  if (tableQuery.isLoading) {
    return <PageSkeleton />;
  }

  if (tableQuery.isError) {
    return <div>Error loading table</div>;
  }

  const table = tableQuery.data;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{table?.name}</h1>
      {/* Render data table or view */}
    </div>
  );
}

function PageSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
```

**Layout Guard — `layout.tsx` (auth required):**
```typescript
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { profileDetailOptions } from '@/hooks/tanstack-query/_query-options';
import { ROLE_DEFAULT_ROUTE } from '@/lib/menu/menu-access-permissions';

export const Route = createFileRoute('/_private')({
  beforeLoad: async ({ context }) => {
    try {
      await context.queryClient.ensureQueryData(profileDetailOptions());
    } catch {
      throw redirect({ to: '/' });
    }
  },
  component: () => <Outlet />,
});
```

**Layout Guard — `layout.tsx` (guests only):**
```typescript
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { profileDetailOptions } from '@/hooks/tanstack-query/_query-options';
import { ROLE_DEFAULT_ROUTE } from '@/lib/menu/menu-access-permissions';

export const Route = createFileRoute('/_authentication')({
  beforeLoad: async ({ context }) => {
    try {
      const user = await context.queryClient.ensureQueryData(
        profileDetailOptions(),
      );
      if (user) {
        const role = user.group?.slug?.toUpperCase() ?? 'REGISTERED';
        throw redirect({ to: ROLE_DEFAULT_ROUTE[role] ?? '/tables' });
      }
    } catch (e) {
      if (e && typeof e === 'object' && 'to' in e) throw e;
    }
  },
  component: () => <Outlet />,
});
```

### Next.js App Router

**Page — `page.tsx`:**
```tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { tableDetailOptions } from '@/hooks/tanstack-query/_query-options';
import { TableDetail } from './table-detail';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return { title: `Table: ${slug}` };
}

export default async function TablePage({ params }: PageProps) {
  const { slug } = await params;
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(tableDetailOptions(slug));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TableDetail slug={slug} />
    </HydrationBoundary>
  );
}
```

**Loading — `loading.tsx`:**
```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading(): React.JSX.Element {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
```

**Error — `error.tsx`:**
```tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <h2 className="text-lg font-medium">Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Next.js App Router

**Page Route:**
```tsx
// app/{entities}/page.tsx
import type { Metadata } from 'next'
import { {Entity}List } from './_components/{entity}-list'

export const metadata: Metadata = {
  title: '{Entities}',
  description: 'Listagem de {entities}',
}

export default async function {Entity}Page() {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">{Entities}</h1>
      <{Entity}List />
    </div>
  )
}
```

**Dynamic Route:**
```tsx
// app/{entities}/[id]/page.tsx
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `{Entity} ${id}` }
}

export default async function {Entity}DetailPage({ params }: Props) {
  const { id } = await params
  // fetch data...
  if (!entity) return notFound()

  return <{Entity}Detail entity={entity} />
}
```

**Layout:**
```tsx
// app/{entities}/layout.tsx
export default function {Entity}Layout({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>
}
```

**Loading/Error/Not Found:**
```tsx
// app/{entities}/loading.tsx
export default function Loading() {
  return <div className="animate-pulse">Carregando...</div>
}

// app/{entities}/error.tsx
'use client'
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <h2>Erro ao carregar</h2>
      <button onClick={reset}>Tentar novamente</button>
    </div>
  )
}

// app/{entities}/not-found.tsx
export default function NotFound() {
  return <div>Registro nao encontrado</div>
}
```

### Remix

**Route — `tables.$slug.tsx`:**
```tsx
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: `Table: ${data?.name}` }];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const response = await fetch(`${API_URL}/tables/${params.slug}`);
  if (!response.ok) throw new Response('Not found', { status: 404 });
  return response.json();
}

export default function TableRoute(): React.JSX.Element {
  const table = useLoaderData<typeof loader>();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{table.name}</h1>
    </div>
  );
}
```

## Checklist

- [ ] Data prefetched in loader (not useEffect)
- [ ] Search params validated with Zod
- [ ] Auth guard in layout (not per-route)
- [ ] Loading skeleton component
- [ ] Error handling (error boundary or catch)
- [ ] SEO metadata (head/generateMetadata/meta)
- [ ] No ternary operators
