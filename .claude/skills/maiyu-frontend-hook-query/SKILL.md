---
name: maiyu:frontend-hook-query
description: |
  Generates TanStack Query hooks (queries and mutations) for frontend data fetching.
  Use when: user asks to create a query hook, mutation hook, data fetching hook,
  useQuery, useMutation, API hook, or mentions "query" for server state management.
  Supports: TanStack Query v5, Axios, fetch API.
  Frameworks: TanStack Start, React (Vite), Next.js, Next.js App Router, Remix.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **Query lib**: `@tanstack/react-query` | `swr` | `@apollo/client`
   - **HTTP client**: `axios` | `ky` | native `fetch`
   - **Framework**: `@tanstack/react-start` | `next` | `@remix-run/react` | `react`
3. Scan existing hooks to detect:
   - Hook location (`src/hooks/tanstack-query/`)
   - Query key file (`_query-keys.ts`)
   - Query options file (`_query-options.ts`)
   - Naming convention (`use-{entity}-{action}.tsx`)
   - API instance import path (`@/lib/api`)
4. If query lib not detected, ask user

## Conventions

### Architecture — 3-Layer Pattern

```
hooks/tanstack-query/
├── _query-keys.ts         ← Query key hierarchy (single source of truth)
├── _query-options.ts      ← Query options functions
├── use-{entity}-create.tsx
├── use-{entity}-read.tsx
├── use-{entity}-update.tsx
└── use-{entity}-delete.tsx
```

### Naming
- Query keys file: `_query-keys.ts` (underscore prefix = private/shared)
- Query options file: `_query-options.ts`
- Read hooks: `use-{entity}-read.tsx` → exports `useRead{Entity}()`
- Mutation hooks: `use-{entity}-{action}.tsx` → exports `use{Action}{Entity}()`
- Paginated reads: `use-{entity}-read-paginated.tsx`

### Rules
- Query keys use `as const` for type safety
- Query options are standalone functions returning `queryOptions()`
- Always set `staleTime` (30s–5min for dynamic, Infinity for static)
- Use `enabled: Boolean(param)` to disable queries without params
- Mutations: `setQueryData` for optimistic cache + `invalidateQueries` for lists
- Props type for mutations: `Pick<Omit<UseMutationOptions<...>, 'mutationFn' | 'onSuccess'>, 'onError'> & { onSuccess?: ... }`
- No ternary operators — use if/else, early return, or const mapper
- No `any` type — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards instead
- Explicit return types on all functions and hooks
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains

## Templates

### Query Keys (Reference Implementation)

```typescript
export const queryKeys = {
  // Simple entity
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (userId: string) =>
      [...queryKeys.users.details(), userId] as const,
  },

  // Nested entity (belongs to parent)
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

  // Static data (no hierarchy needed)
  permissions: {
    all: ['permissions'] as const,
  },
} as const;
```

### Query Options (Reference Implementation)

```typescript
import type { UndefinedInitialDataOptions } from '@tanstack/react-query';
import { queryOptions } from '@tanstack/react-query';

import { queryKeys } from './_query-keys';
import { API } from '@/lib/api';
import type { IUser, Paginated } from '@/lib/interfaces';
import type { UserQueryPayload } from '@/lib/payloads';

export const userListOptions = (
  params: UserQueryPayload,
): UndefinedInitialDataOptions<Paginated<IUser>> =>
  queryOptions({
    queryKey: queryKeys.users.list(params),
    queryFn: async () => {
      const response = await API.get<Paginated<IUser>>('/users/paginated', {
        params,
      });
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });

export const userDetailOptions = (
  userId: string,
): UndefinedInitialDataOptions<IUser> =>
  queryOptions({
    queryKey: queryKeys.users.detail(userId),
    queryFn: async () => {
      const response = await API.get<IUser>(`/users/${userId}`);
      return response.data;
    },
    enabled: Boolean(userId),
    staleTime: 2 * 60 * 1000,
  });
```

### Read Hook

```typescript
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { userDetailOptions } from './_query-options';
import type { IUser } from '@/lib/interfaces';

export function useReadUser(payload: {
  userId: string;
}): UseQueryResult<IUser, Error> {
  return useQuery(userDetailOptions(payload.userId));
}
```

### Paginated Read Hook

```typescript
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { userListOptions } from './_query-options';
import type { IUser, Paginated } from '@/lib/interfaces';
import type { UserQueryPayload } from '@/lib/payloads';

export function useUsersReadPaginated(
  params?: UserQueryPayload,
): UseQueryResult<Paginated<IUser>, Error> {
  return useQuery(userListOptions(params ?? { page: 1, perPage: 50 }));
}
```

### Create Mutation Hook

```typescript
import type {
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { queryKeys } from './_query-keys';
import { API } from '@/lib/api';
import type { IUser } from '@/lib/interfaces';
import type { UserCreatePayload } from '@/lib/payloads';

type UseUserCreateProps = Pick<
  Omit<
    UseMutationOptions<IUser, AxiosError | Error, UserCreatePayload, unknown>,
    'mutationFn' | 'onSuccess'
  >,
  'onError'
> & {
  onSuccess?: (data: IUser, variables: UserCreatePayload) => void;
};

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
      queryClient.setQueryData(queryKeys.users.detail(data._id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      props.onSuccess?.(data, variables);
    },
    onError: props.onError,
  });
}
```

### Update Mutation Hook

```typescript
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { queryKeys } from './_query-keys';
import { API } from '@/lib/api';
import type { IUser } from '@/lib/interfaces';
import type { UserUpdatePayload } from '@/lib/payloads';

type UseUserUpdateProps = Pick<
  Omit<
    UseMutationOptions<IUser, AxiosError | Error, UserUpdatePayload, unknown>,
    'mutationFn' | 'onSuccess'
  >,
  'onError'
> & {
  userId: string;
  onSuccess?: (data: IUser) => void;
};

export function useUpdateUser(
  props: UseUserUpdateProps,
): UseMutationResult<IUser, AxiosError | Error, UserUpdatePayload, unknown> {
  const queryClient = useQueryClient();
  const { userId } = props;

  return useMutation({
    mutationFn: async function (payload: UserUpdatePayload) {
      const response = await API.put<IUser>(`/users/${userId}`, payload);
      return response.data;
    },
    onSuccess(data) {
      queryClient.setQueryData(queryKeys.users.detail(userId), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      props.onSuccess?.(data);
    },
    onError: props.onError,
  });
}
```

### Delete Mutation Hook

```typescript
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { queryKeys } from './_query-keys';
import { API } from '@/lib/api';

type UseUserDeleteProps = Pick<
  Omit<
    UseMutationOptions<void, AxiosError | Error, { userId: string }, unknown>,
    'mutationFn' | 'onSuccess'
  >,
  'onError'
> & {
  onSuccess?: () => void;
};

export function useDeleteUser(
  props: UseUserDeleteProps,
): UseMutationResult<void, AxiosError | Error, { userId: string }, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async function ({ userId }) {
      await API.delete(`/users/${userId}`);
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      props.onSuccess?.();
    },
    onError: props.onError,
  });
}
```

### Next.js — SSR Prefetch

```typescript
// In page.tsx (server component)
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { userListOptions } from '@/hooks/tanstack-query/_query-options';

export default async function UsersPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(userListOptions({ page: 1, perPage: 50 }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserList />
    </HydrationBoundary>
  );
}
```

### Remix — Loader Prefetch

```typescript
import type { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page') ?? '1');
  const response = await fetch(`${API_URL}/users/paginated?page=${page}`);
  return response.json();
}

export default function UsersRoute() {
  const initialData = useLoaderData<typeof loader>();
  // Use initialData as initialData in useQuery
}
```

### Bulk Mutation Hook

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';

interface UseBulkTrashProps {
  onSuccess?: () => void;
}

export function useBulkTrash({ onSuccess }: UseBulkTrashProps = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, entitySlug }: { ids: Array<string>; entitySlug: string }) => {
      const response = await api.patch(`/${entitySlug}/bulk-trash`, { ids });
      return response.data;
    },
    onSuccess(_data, variables) {
      toastSuccess(`${variables.ids.length} items moved to trash`);
      queryClient.invalidateQueries({ queryKey: [variables.entitySlug] });
      onSuccess?.();
    },
    onError() {
      toastError('Failed to move items to trash');
    },
  });
}

export function useBulkRestore({ onSuccess }: UseBulkTrashProps = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, entitySlug }: { ids: Array<string>; entitySlug: string }) => {
      const response = await api.patch(`/${entitySlug}/bulk-restore`, { ids });
      return response.data;
    },
    onSuccess(_data, variables) {
      toastSuccess(`${variables.ids.length} items restored`);
      queryClient.invalidateQueries({ queryKey: [variables.entitySlug] });
      onSuccess?.();
    },
    onError() {
      toastError('Failed to restore items');
    },
  });
}
```

### Nested Resource Hooks

```typescript
// Query keys with parent context
export const groupFieldKeys = {
  all: (parentId: string) => ['group-fields', parentId] as const,
  list: (parentId: string) => [...groupFieldKeys.all(parentId), 'list'] as const,
  detail: (parentId: string, id: string) =>
    [...groupFieldKeys.all(parentId), id] as const,
};

// Nested list query
export function groupFieldListOptions(parentId: string) {
  return queryOptions({
    queryKey: groupFieldKeys.list(parentId),
    queryFn: async () => {
      const response = await api.get(`/parents/${parentId}/children`);
      return response.data;
    },
  });
}

// Nested create mutation with cascade invalidation
export function useCreateGroupField(parentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateGroupFieldPayload) => {
      const response = await api.post(`/parents/${parentId}/children`, payload);
      return response.data;
    },
    onSuccess() {
      // Invalidate both parent and children queries
      queryClient.invalidateQueries({ queryKey: groupFieldKeys.all(parentId) });
      queryClient.invalidateQueries({ queryKey: ['parents', parentId] });
    },
  });
}
```

### Reorder Mutation Hook

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ReorderItem {
  id: string;
  order: number;
}

export function useReorder(entityKey: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: Array<ReorderItem>) => {
      const response = await api.patch(`/${entityKey}/reorder`, { items });
      return response.data;
    },
    onMutate(items) {
      // Optimistic update — reorder items in cache
      const queryKey = [entityKey, 'list'];
      const previous = queryClient.getQueryData(queryKey);

      interface ListResponse {
        data: Array<{ _id: string; order?: number }>;
        [key: string]: unknown;
      }

      function isListResponse(value: unknown): value is ListResponse {
        if (!value || typeof value !== 'object') return false;
        if (!('data' in value)) return false;
        return Array.isArray((value as Record<string, unknown>)['data']);
      }

      if (previous && isListResponse(previous)) {
        const data = [...previous.data];
        const orderMap = new Map(items.map((i) => [i.id, i.order]));
        data.sort((a, b) => {
          const orderA = orderMap.get(a._id) ?? a.order ?? 0;
          const orderB = orderMap.get(b._id) ?? b.order ?? 0;
          return orderA - orderB;
        });
        queryClient.setQueryData(queryKey, { ...previous, data });
      }

      return { previous };
    },
    onError(_err, _vars, context) {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData([entityKey, 'list'], context.previous);
      }
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: [entityKey] });
    },
  });
}
```

### Next.js App Router (React Query + Server Components)

**Query in Client Component:**
```tsx
'use client'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function use{Entity}List(params: QueryParams) {
  return useSuspenseQuery({
    queryKey: ['{entities}', 'list', params],
    queryFn: async () => {
      const res = await fetch(`/api/{entities}?${new URLSearchParams(params)}`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })
}

export function useCreate{Entity}(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Create{Entity}Payload) => {
      const res = await fetch('/api/{entities}', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['{entities}'] })
      options?.onSuccess?.()
    },
  })
}
```

**Route Handler (API Route):**
```typescript
// app/api/{entities}/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const res = await fetch(`${process.env.API_URL}/{entities}?${searchParams}`)
  const data = await res.json()
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const res = await fetch(`${process.env.API_URL}/{entities}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
```

## Checklist

- [ ] Query keys with `as const` hierarchy
- [ ] Query options as standalone functions with `staleTime` and `enabled`
- [ ] Read hooks wrapping `useQuery()` with typed return
- [ ] Mutation hooks with Props type pattern (Pick + Omit)
- [ ] `setQueryData` for optimistic cache on create/update
- [ ] `invalidateQueries` for list refresh on mutations
- [ ] Bulk mutation hooks (bulk-trash, bulk-restore) with count toast
- [ ] Nested resource hooks with composite query keys + cascade invalidation
- [ ] Reorder mutation hook with optimistic update + rollback
- [ ] No ternary operators
