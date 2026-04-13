---
name: maiyu:frontend-next-page
description: |
  Generates Next.js App Router pages with proper conventions.
  Use when: user asks to create pages in Next.js, route pages, layouts,
  loading states, error boundaries, or mentions "next page", "app router page".
  Supports: Server Components, Client Components, Server Actions, Metadata API.
  Frameworks: Next.js App Router (13.4+).
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

1. Find `package.json` — detect `next` in dependencies
2. Check for `app/` directory (App Router) vs `pages/` (Pages Router)
3. Scan existing pages for patterns (metadata, server actions, data fetching)
4. Detect styling: `tailwindcss` | `@emotion/react` | `styled-components`

## Conventions

### File Structure
- `app/{route}/page.tsx` — Page component (Server Component by default)
- `app/{route}/layout.tsx` — Layout wrapper
- `app/{route}/loading.tsx` — Loading UI (Suspense boundary)
- `app/{route}/error.tsx` — Error boundary (`'use client'`)
- `app/{route}/not-found.tsx` — 404 page
- `app/{route}/[param]/page.tsx` — Dynamic route
- `app/{route}/_components/` — Private components (not routed)

### Rules
- Server Components by default — only add `'use client'` when needed (state, effects, event handlers)
- Use `generateMetadata()` for dynamic SEO
- Use `notFound()` from `next/navigation` for 404s
- Prefer Server Actions over API routes for mutations
- No ternary operators — use if/else, early return, or const mapper
- No `any` type — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- Explicit return types on all functions and components
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains
- Named exports for metadata, default export for page component

## Templates

### Static Page

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '{Page Title}',
  description: '{Page description}',
}

export default function {Page}Page() {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold">{Page Title}</h1>
    </div>
  )
}
```

### Dynamic Page with Data Fetching

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { api } from '@/lib/api'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const entity = await api.get(`/{entities}/${id}`).catch(() => null)

  if (!entity) return { title: 'Nao encontrado' }

  return {
    title: entity.name,
    description: `Detalhes de ${entity.name}`,
  }
}

export default async function {Entity}DetailPage({ params }: Props) {
  const { id } = await params
  const entity = await api.get(`/{entities}/${id}`).catch(() => null)

  if (!entity) return notFound()

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold">{entity.name}</h1>
      {/* content */}
    </div>
  )
}
```

### Layout

```tsx
export default function {Section}Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4">
      <nav>{/* section navigation */}</nav>
      <main>{children}</main>
    </div>
  )
}
```

### Loading State

```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="container py-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
```

### Error Boundary

```tsx
'use client'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="container py-12 text-center">
      <h2 className="text-xl font-bold mb-2">Algo deu errado</h2>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
      >
        Tentar novamente
      </button>
    </div>
  )
}
```

### Not Found

```tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container py-12 text-center">
      <h2 className="text-xl font-bold mb-2">Nao encontrado</h2>
      <p className="text-muted-foreground mb-4">O recurso solicitado nao existe.</p>
      <Link href="/" className="text-primary underline">
        Voltar ao inicio
      </Link>
    </div>
  )
}
```

### Page with Server Action

```tsx
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function create{Entity}(formData: FormData) {
  'use server'

  const body = {
    name: formData.get('name') as string,
    status: formData.get('status') as string,
  }

  const res = await fetch(`${process.env.API_URL}/{entities}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    throw new Error('Falha ao criar')
  }

  revalidatePath('/{entities}')
  redirect('/{entities}')
}

export default function {Entity}CreatePage() {
  return (
    <form action={create{Entity}} className="container py-6 space-y-4">
      <input name="name" placeholder="Nome" className="border rounded px-3 py-2 w-full" required />
      <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
        Criar
      </button>
    </form>
  )
}
```

### Route Handler (API Route)

```typescript
// app/api/{entities}/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const res = await fetch(`${process.env.API_URL}/{entities}?${searchParams}`, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 60 },
  })
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
  return NextResponse.json(await res.json(), { status: res.status })
}
```

## Checklist

- [ ] Server Component by default (no unnecessary 'use client')
- [ ] Metadata defined (static or generateMetadata)
- [ ] Loading state (loading.tsx)
- [ ] Error boundary (error.tsx with 'use client')
- [ ] Not found handling (notFound() or not-found.tsx)
- [ ] Dynamic params typed with Promise<{ param: string }>
- [ ] Server Actions use 'use server' directive
- [ ] No ternary operators
