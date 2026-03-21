---
name: frontend-hook-query
description: |
  Generates TanStack Query hooks (queries and mutations) for frontend data fetching.
  Use when: user asks to create a query hook, mutation hook, data fetching hook,
  useQuery, useMutation, API hook, or mentions "query" for server state management.
  Supports: TanStack Query v5, Axios, fetch API.
  Frameworks: TanStack Start, React (Vite), Next.js, Remix.
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
- No ternary operators

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

## Checklist

- [ ] Query keys with `as const` hierarchy
- [ ] Query options as standalone functions with `staleTime` and `enabled`
- [ ] Read hooks wrapping `useQuery()` with typed return
- [ ] Mutation hooks with Props type pattern (Pick + Omit)
- [ ] `setQueryData` for optimistic cache on create/update
- [ ] `invalidateQueries` for list refresh on mutations
- [ ] No ternary operators
