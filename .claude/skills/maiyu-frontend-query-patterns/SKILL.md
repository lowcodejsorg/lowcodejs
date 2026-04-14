---
name: maiyu:frontend-query-patterns
description: |
  Generates TanStack Query patterns: query key factories, query options,
  mutation hooks with cache updates, and prefetch in loaders.
  Use when: user asks about query keys, data fetching patterns, cache
  invalidation, mutations, or mentions "query", "react query", "tanstack query".
  Supports: TanStack Query v5, React Query.
  Frameworks: TanStack Start, React (Vite), Next.js, Remix.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Conventions

### Rules
- No ternary operators — use if/else, early return, or const mapper
- No `any` type — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- Explicit return types on all functions and hooks
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains

## Templates

### Query Key Factory (Hierarchical)

```typescript
// hooks/tanstack-query/_query-keys.ts
export const queryKeys = {
  {entities}: {
    all: ['{entities}'] as const,
    lists: () => [...queryKeys.{entities}.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.{entities}.lists(), params] as const,
    details: () => [...queryKeys.{entities}.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.{entities}.details(), id] as const,
  },
} as const
```

**Benefits:**
- `queryKeys.{entities}.all` — invalidate everything
- `queryKeys.{entities}.lists()` — invalidate all lists (keeps details cached)
- `queryKeys.{entities}.detail(id)` — invalidate specific detail

### Query Options Factory

```typescript
// hooks/tanstack-query/_query-options.ts
import { queryOptions } from '@tanstack/react-query'
import { API } from '@/lib/api'
import { queryKeys } from './_query-keys'

export function {entity}ListOptions(params: {Entity}QueryPayload) {
  return queryOptions({
    queryKey: queryKeys.{entities}.list(params),
    queryFn: async () => {
      const response = await API.get<Paginated<I{Entity}>>('/{entities}/paginated', { params })
      return response.data
    },
    staleTime: 60 * 1000,
  })
}

export function {entity}DetailOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.{entities}.detail(id),
    queryFn: async () => {
      const response = await API.get<I{Entity}>(`/{entities}/${id}`)
      return response.data
    },
  })
}
```

### Mutation Hook with Cache Update

```typescript
// hooks/tanstack-query/use-{entity}-create.tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { API } from '@/lib/api'
import { queryKeys } from './_query-keys'

interface UseCreate{Entity}Props {
  onSuccess?: (data: I{Entity}) => void
  onError?: (error: Error) => void
}

export function useCreate{Entity}(props?: UseCreate{Entity}Props) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Create{Entity}Payload) => {
      const response = await API.post<I{Entity}>('/{entities}', payload)
      return response.data
    },
    onSuccess: (data) => {
      // Set cache for the new entity
      queryClient.setQueryData(queryKeys.{entities}.detail(data.id), data)
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.{entities}.lists() })
      props?.onSuccess?.(data)
    },
    onError: props?.onError,
  })
}
```

### Update Mutation

```typescript
export function useUpdate{Entity}(props?: UseUpdate{Entity}Props) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...payload }: Update{Entity}Payload & { id: string }) => {
      const response = await API.patch<I{Entity}>(`/{entities}/${id}`, payload)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.{entities}.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: queryKeys.{entities}.lists() })
      props?.onSuccess?.(data)
    },
  })
}
```

### Delete Mutation (Soft Delete)

```typescript
export function useDelete{Entity}(props?: UseDelete{Entity}Props) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await API.delete(`/{entities}/${id}`)
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.{entities}.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.{entities}.lists() })
      props?.onSuccess?.()
    },
  })
}
```

### Prefetch in Route Loader (TanStack Router)

```typescript
// routes/{entities}/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { {entity}ListOptions } from '@/hooks/tanstack-query/_query-options'

export const Route = createFileRoute('/{entities}/')({
  validateSearch: (search) => ({
    page: Number(search.page) || 1,
    perPage: Number(search.perPage) || 50,
  }),
  loader: ({ context, deps }) => {
    context.queryClient.ensureQueryData({entity}ListOptions(deps))
  },
})
```

### Prefetch in Next.js (Server Component + HydrationBoundary)

```tsx
// app/{entities}/page.tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { {entity}ListOptions } from '@/hooks/tanstack-query/_query-options'

export default async function {Entity}Page() {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({entity}ListOptions({ page: 1, perPage: 50 }))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <{Entity}List />
    </HydrationBoundary>
  )
}
```

### Query Client Configuration

```typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: true,
        staleTime: 60 * 60 * 1000, // 1 hour
      },
    },
  })
}
```

### Error Handling Pattern

```typescript
// lib/handle-api-error.ts
import { toast } from 'sonner'

const CAUSE_MESSAGES: Record<string, string> = {
  NOT_FOUND: 'Registro nao encontrado',
  UNAUTHORIZED: 'Sessao expirada',
  FORBIDDEN: 'Sem permissao',
  CONFLICT: 'Registro ja existe',
}

export function handleApiError(error: unknown, setFieldError?: (field: string, message: string) => void) {
  if (!isAxiosError(error)) {
    toast.error('Erro inesperado')
    return
  }

  const data = error.response?.data
  const message = CAUSE_MESSAGES[data?.cause] || data?.message || 'Erro na requisicao'

  toast.error(message)

  if (data?.errors && setFieldError) {
    for (const [field, msg] of Object.entries(data.errors)) {
      setFieldError(field, msg as string)
    }
  }
}
```

## Checklist

- [ ] Query keys are hierarchical (enable granular invalidation)
- [ ] Query options are reusable (loaders + hooks)
- [ ] Mutations update cache before invalidating
- [ ] Error handling is centralized
- [ ] StaleTime configured (avoid unnecessary refetches)
- [ ] Prefetch in loaders for instant navigation
