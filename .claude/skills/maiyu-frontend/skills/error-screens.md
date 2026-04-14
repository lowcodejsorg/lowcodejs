---
name: maiyu:frontend-error-screens
description: |
  Generates error, loading, and empty state screen components.
  Use when: user asks to create error pages, loading screens, 404 pages,
  403 pages, empty states, or mentions "error screen", "loading state".
  Supports: Error boundaries, Suspense, route status.
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
- Explicit return types on all functions and components
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains

## Templates

### Access Denied (403)

```tsx
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AccessDeniedProps {
  message?: string
  onBack?: () => void
}

export function AccessDenied({
  message = 'Voce nao tem permissao para acessar este recurso.',
  onBack,
}: AccessDeniedProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <ShieldX className="h-16 w-16 text-destructive mb-4" />
      <h1 className="text-2xl font-bold mb-2">Acesso negado</h1>
      <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
      {onBack && <Button variant="outline" onClick={onBack}>Voltar</Button>}
    </div>
  )
}
```

### Not Found (404)

```tsx
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NotFoundProps {
  title?: string
  message?: string
  homeHref?: string
}

export function NotFound({
  title = 'Pagina nao encontrada',
  message = 'O recurso que voce procura nao existe ou foi removido.',
  homeHref = '/',
}: NotFoundProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
      <Button variant="outline" asChild>
        <a href={homeHref}>Voltar ao inicio</a>
      </Button>
    </div>
  )
}
```

### Loading Spinner

```tsx
import { Loader2 } from 'lucide-react'

interface LoadingProps {
  message?: string
}

export function Loading({
  message = 'Carregando...',
}: LoadingProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
```

### Route Error (Error Boundary Fallback)

```tsx
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RouteErrorProps {
  error: Error
  resetErrorBoundary?: () => void
}

export function RouteError({
  error,
  resetErrorBoundary,
}: RouteErrorProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
      <h1 className="text-2xl font-bold mb-2">Erro inesperado</h1>
      <p className="text-muted-foreground mb-6 max-w-md">{error.message}</p>
      {resetErrorBoundary && (
        <Button onClick={resetErrorBoundary}>Tentar novamente</Button>
      )}
    </div>
  )
}
```

### Empty State

```tsx
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}

export function EmptyState({
  title = 'Nenhum registro encontrado',
  description,
  action,
  icon,
}: EmptyStateProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      {icon || <Inbox className="h-12 w-12 text-muted-foreground mb-4" />}
      <h3 className="text-lg font-medium mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mb-4 max-w-md">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
```

### Error Boundary Wrapper (TanStack Query)

```tsx
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'
import { RouteError } from './route-error'

interface QueryBoundaryProps {
  children: React.ReactNode
}

export function QueryBoundary({ children }: QueryBoundaryProps): React.JSX.Element {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <RouteError error={error} resetErrorBoundary={resetErrorBoundary} />
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}
```

## Checklist

- [ ] Lucide icons for visual feedback
- [ ] Muted foreground for secondary text
- [ ] Action buttons for recovery (retry, go back, go home)
- [ ] Responsive layout (centered, max-width)
- [ ] Named exports with explicit return types
- [ ] No ternary operators
