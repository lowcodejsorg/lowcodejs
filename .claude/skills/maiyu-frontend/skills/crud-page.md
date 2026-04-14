---
name: maiyu:frontend-crud-page
description: |
  Generates complete CRUD page setups for frontend projects.
  Use when: user asks to create a CRUD page, list page, detail page, create page,
  edit page, or mentions "page" with create/read/update/delete operations.
  Supports: List + Detail + Create + Edit pages with forms, permissions, skeletons.
  Frameworks: TanStack Start, React (Vite), Next.js App Router, Remix.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **Router**: `@tanstack/react-router` | `next` | `@remix-run/react`
   - **Form**: `@tanstack/react-form` | `react-hook-form`
   - **Query**: `@tanstack/react-query`
   - **Validation**: `zod`
3. Scan existing route pages to detect:
   - File structure: `index.tsx` + `index.lazy.tsx` split
   - Private route patterns (`_private/` prefix)
   - Form patterns (useAppForm, withForm)
   - Permission patterns (useTablePermission, beforeLoad guards)

## CRUD Page Structure

Each entity generates these files:

```
routes/_private/{entity}/
├── index.tsx                    ← List: loader + search validation
├── index.lazy.tsx               ← List: table + filters + pagination
├── -{entity}-table.tsx          ← Table columns + cell renderers
├── -{entity}-table-skeleton.tsx ← Table loading skeleton
├── create/
│   ├── index.tsx                ← Create: loader
│   ├── index.lazy.tsx           ← Create: form wrapper
│   └── -create-form.tsx         ← Create form component
└── $entityId/
    ├── index.tsx                ← Detail: loader
    ├── index.lazy.tsx           ← Detail: show/edit toggle
    ├── -view.tsx                ← Read-only view
    ├── -update-form.tsx         ← Edit form component
    └── -update-form-skeleton.tsx ← Form loading skeleton
```

## Conventions

### Rules
- **Loader in index.tsx**: Always prefetch with `ensureQueryData()`
- **UI in index.lazy.tsx**: Actual component with Suspense
- **Show/Edit mode**: `useState<'show' | 'edit'>('show')` toggle
- **Permission check**: `beforeLoad` for role-based, `useTablePermission()` for action-based
- **Layout**: `flex flex-col h-full overflow-hidden` with header/content/footer
- **Footer**: Cancel/Save in edit mode, Edit/Back in show mode
- **Skeleton**: Matches the visual structure of the real component
- **No ternary operators** — use `{condition && <el>}`, if/else, early return, or const mapper
- **No `any` type** — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- **No `as TYPE` assertions** (except `as const`) — use type guards, generics, or proper typing
- **Explicit return types** on all functions and components
- **Multiple conditions use const mapper** (`Record` lookup) instead of switch/if-else chains

## Templates

### TanStack Router (Reference Implementation)

**List Page — `index.tsx` (loader):**
```typescript
import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import { entityListOptions } from '@/hooks/tanstack-query/_query-options';
import { createRouteHead } from '@/lib/seo';

const SearchSchema = z.object({
  page: z.coerce.number().default(1),
  perPage: z.coerce.number().default(50),
  search: z.string().optional(),
});

export const Route = createFileRoute('/_private/{entities}/')({
  head: createRouteHead({ title: '{Entities}' }),
  validateSearch: SearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(entityListOptions(deps));
  },
});
```

**List Page — `index.lazy.tsx` (component):**
```tsx
import { createLazyFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';

import { entityListOptions } from '@/hooks/tanstack-query/_query-options';
import { EntityTable } from './-entity-table';
import { EntityTableSkeleton } from './-entity-table-skeleton';
import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';

export const Route = createLazyFileRoute('/_private/{entities}/')({
  component: RouteComponent,
  pendingComponent: EntityTableSkeleton,
});

function RouteComponent(): React.JSX.Element {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data } = useSuspenseQuery(entityListOptions(search));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 flex items-center justify-between p-4">
        <h1 className="text-2xl font-bold">{Entities}</h1>
        <Button
          onClick={() => navigate({ to: '/{entities}/create' })}
        >
          Create
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-auto px-4">
        <EntityTable data={data.data} />
      </div>

      <div className="shrink-0 border-t p-4">
        <Pagination
          meta={data.meta}
          onPageChange={(page) => navigate({ search: { ...search, page } })}
          onPerPageChange={(perPage) =>
            navigate({ search: { ...search, perPage, page: 1 } })
          }
        />
      </div>
    </div>
  );
}
```

**Detail Page — `index.tsx` (loader):**
```typescript
import { createFileRoute } from '@tanstack/react-router';

import { entityDetailOptions } from '@/hooks/tanstack-query/_query-options';
import { UpdateFormSkeleton } from './-update-form-skeleton';

export const Route = createFileRoute('/_private/{entities}/$entityId/')({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      entityDetailOptions(params.entityId),
    );
  },
  pendingComponent: UpdateFormSkeleton,
});
```

**Detail Page — `index.lazy.tsx` (show/edit mode):**
```tsx
import { createLazyFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { entityDetailOptions } from '@/hooks/tanstack-query/_query-options';
import { EntityView } from './-view';
import { UpdateForm } from './-update-form';
import { Button } from '@/components/ui/button';

export const Route = createLazyFileRoute('/_private/{entities}/$entityId/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { entityId } = Route.useParams();
  const navigate = Route.useNavigate();
  const [mode, setMode] = useState<'show' | 'edit'>('show');

  const { data } = useSuspenseQuery(entityDetailOptions(entityId));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 flex items-center justify-between p-4 border-b">
        <h1 className="text-lg font-semibold">{data.name}</h1>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-4">
        {mode === 'show' && <EntityView data={data} />}
        {mode === 'edit' && (
          <UpdateForm
            data={data}
            onSuccess={() => setMode('show')}
          />
        )}
      </div>

      <div className="shrink-0 border-t bg-sidebar p-2 flex justify-between">
        {mode === 'show' && (
          <>
            <Button
              variant="ghost"
              onClick={() => navigate({ to: '/{entities}' })}
            >
              Back
            </Button>
            <Button onClick={() => setMode('edit')}>Edit</Button>
          </>
        )}
        {mode === 'edit' && (
          <>
            <Button variant="ghost" onClick={() => setMode('show')}>
              Cancel
            </Button>
            <Button type="submit" form="update-form">
              Save
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
```

**Create Form — `-create-form.tsx`:**
```tsx
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { handleApiError } from '@/lib/handle-api-error';
import { createFieldErrorSetter } from '@/lib/form-utils';
import { EntityCreateSchema } from '@/lib/schemas';
import { useCreateEntity } from '@/hooks/tanstack-query/use-entity-create';
import { toastSuccess } from '@/lib/toast';

interface CreateFormProps {
  onSuccess?: () => void;
}

export function CreateForm({ onSuccess }: CreateFormProps): React.JSX.Element {
  const mutation = useCreateEntity({
    onSuccess() {
      toastSuccess('Created successfully');
      onSuccess?.();
    },
    onError(error) {
      handleApiError(error, {
        context: 'Error creating',
        onFieldErrors(errors) {
          const setFieldError = createFieldErrorSetter(form);
          for (const [field, message] of Object.entries(errors)) {
            setFieldError(field, message);
          }
        },
      });
    },
  });

  const form = useAppForm({
    defaultValues: { name: '', email: '' },
    validators: {
      onChange: EntityCreateSchema,
      onSubmit: EntityCreateSchema,
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    },
  });

  return (
    <form
      id="create-form"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.AppField
        name="name"
        children={(field) => <field.FieldText label="Name" required />}
      />
      <form.AppField
        name="email"
        children={(field) => <field.FieldEmail label="Email" required />}
      />
    </form>
  );
}
```

**Read-Only View — `-view.tsx`:**
```tsx
interface EntityViewProps {
  data: IEntity;
}

export function EntityView({ data }: EntityViewProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Name</p>
        <p className="font-medium">{data.name}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Email</p>
        <p className="font-medium">{data.email}</p>
      </div>
    </div>
  );
}
```

**Skeleton — `-update-form-skeleton.tsx`:**
```tsx
import { Skeleton } from '@/components/ui/skeleton';

export function UpdateFormSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-6 p-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
```

### Next.js App Router

**List Page — `page.tsx`:**
```tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

export default async function EntitiesPage({ searchParams }) {
  const params = await searchParams;
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(entityListOptions(params));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EntityList />
    </HydrationBoundary>
  );
}
```

**Detail Page — `[entityId]/page.tsx`:**
```tsx
export default async function EntityDetailPage({ params }) {
  const { entityId } = await params;
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(entityDetailOptions(entityId));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EntityDetail entityId={entityId} />
    </HydrationBoundary>
  );
}
```

### Next.js App Router CRUD

**List Page (Server Component):**
```tsx
// app/{entities}/page.tsx
import { DataTable } from '@/components/data-table'
import { columns } from './_components/columns'

async function get{Entities}(searchParams: Record<string, string>) {
  const res = await fetch(`${process.env.API_URL}/{entities}?${new URLSearchParams(searchParams)}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default async function {Entity}ListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const { data, meta } = await get{Entities}(params)

  return (
    <div className="container py-6">
      <DataTable columns={columns} data={data} meta={meta} />
    </div>
  )
}
```

**Create Page (Client Component):**
```tsx
// app/{entities}/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

export default function {Entity}CreatePage() {
  const router = useRouter()
  const form = useForm()

  async function onSubmit(data: FormData) {
    const res = await fetch('/api/{entities}', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.ok) router.push('/{entities}')
  }

  return <form onSubmit={form.handleSubmit(onSubmit)}>{/* fields */}</form>
}
```

**Server Action variant:**
```tsx
// app/{entities}/create/page.tsx
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function create{Entity}(formData: FormData) {
  'use server'
  const res = await fetch(`${process.env.API_URL}/{entities}`, {
    method: 'POST',
    body: JSON.stringify(Object.fromEntries(formData)),
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error('Failed')
  revalidatePath('/{entities}')
  redirect('/{entities}')
}

export default function {Entity}CreatePage() {
  return <form action={create{Entity}}>{/* fields */}</form>
}
```

### Remix

**List Route — `{entities}.tsx`:**
```tsx
import type { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page') ?? '1');
  return fetch(`${API_URL}/{entities}/paginated?page=${page}`).then((r) => r.json());
}

export default function EntitiesRoute() {
  const data = useLoaderData<typeof loader>();
  return <EntityList data={data} />;
}
```

### Multi-View Detail Page (VIEW_MAP Pattern)

```tsx
import React, { Suspense } from 'react';
import { createLazyFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';

const VIEW_MAP: Record<string, {
  component: React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>;
  skeleton: React.ComponentType;
}> = {
  LIST: {
    component: React.lazy(() =>
      import('./-list-view').then((m) => ({ default: m.ListView })),
    ),
    skeleton: ListViewSkeleton,
  },
  CARD: {
    component: React.lazy(() =>
      import('./-card-view').then((m) => ({ default: m.CardView })),
    ),
    skeleton: CardViewSkeleton,
  },
  KANBAN: {
    component: React.lazy(() =>
      import('./-kanban-view').then((m) => ({ default: m.KanbanView })),
    ),
    skeleton: ListViewSkeleton,
  },
  // Add more views as needed...
};

export const Route = createLazyFileRoute('/_private/{entities}/$entityId/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { entityId } = Route.useParams();
  const { data } = useSuspenseQuery(entityDetailOptions(entityId));

  const style = data.style ?? 'LIST';
  const view = VIEW_MAP[style] ?? VIEW_MAP.LIST;
  const ViewComponent = view.component;
  const ViewSkeleton = view.skeleton;

  return (
    <Suspense fallback={<ViewSkeleton />}>
      <ViewComponent data={data} />
    </Suspense>
  );
}
```

### Soft-Delete Lifecycle Page (Trash Toggle)

```tsx
import { useState } from 'react';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TrashToggleProps {
  showTrashed: boolean;
  onToggle: (showTrashed: boolean) => void;
  trashedCount?: number;
}

export function TrashToggle({
  showTrashed,
  onToggle,
  trashedCount,
}: TrashToggleProps): React.JSX.Element {
  let variant: 'destructive' | 'outline' = 'outline';
  if (showTrashed) {
    variant = 'destructive';
  }

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={() => onToggle(!showTrashed)}
    >
      <Trash2 className="mr-1 h-3 w-3" />
      {showTrashed && 'Active items'}
      {!showTrashed && 'Trash'}
      {!showTrashed && trashedCount && trashedCount > 0 && (
        <span className="ml-1 rounded-full bg-destructive/10 px-1.5 text-xs text-destructive">
          {trashedCount}
        </span>
      )}
    </Button>
  );
}

// Row actions change based on trash context
interface TrashActionsProps {
  isTrashed: boolean;
  onRestore: () => void;
  onHardDelete: () => void;
  onSoftDelete: () => void;
}

export function TrashRowActions({
  isTrashed,
  onRestore,
  onHardDelete,
  onSoftDelete,
}: TrashActionsProps): React.JSX.Element {
  if (isTrashed) {
    return (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onRestore}>
          <RotateCcw className="mr-1 h-3 w-3" /> Restore
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive">
              <AlertTriangle className="mr-1 h-3 w-3" /> Delete forever
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Permanent deletion</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The item will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onHardDelete}>
                Delete permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={onSoftDelete}>
      <Trash2 className="mr-1 h-3 w-3" /> Move to trash
    </Button>
  );
}
```

### Configuration Sub-Pages (Tabs Pattern)

```tsx
import { Outlet, Link, useMatch } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

const CONFIG_TABS = [
  { label: 'Fields', to: './' },
  { label: 'Settings', to: './settings' },
  { label: 'Permissions', to: './permissions' },
  { label: 'Scripts', to: './scripts' },
] as const;

export function ConfigLayout(): React.JSX.Element {
  return (
    <div className="flex h-full flex-col">
      <nav className="flex shrink-0 border-b">
        {CONFIG_TABS.map((tab) => {
          const isActive = !!useMatch({ to: tab.to, fuzzy: true });
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
```

## Checklist

- [ ] Loader prefetches data with `ensureQueryData`
- [ ] Lazy component for code splitting
- [ ] Show/edit mode toggle for detail pages
- [ ] Form with Zod validation + mutation + error handling
- [ ] Skeleton components for loading states
- [ ] Permission checks (beforeLoad + usePermission)
- [ ] Layout: header/content/footer with overflow handling
- [ ] Footer with mode-appropriate buttons
- [ ] Multi-view: VIEW_MAP with React.lazy + Suspense per style
- [ ] Soft-delete lifecycle: trash toggle + restore/hard-delete actions + confirm dialog
- [ ] Configuration sub-pages: tabs or sub-routes for resource config
- [ ] No ternary operators
