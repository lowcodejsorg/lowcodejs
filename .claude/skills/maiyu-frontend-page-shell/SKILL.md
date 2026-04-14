---
name: maiyu:frontend-page-shell
description: |
  Generates page shell layout components with Header/Content/Footer zones.
  Use when: user asks to create page layouts, page containers, page wrappers,
  or mentions "page shell", "page layout", "content area".
  Supports: Compound components, data-slot, Tailwind CSS.
  Frameworks: TanStack Start, React (Vite), Next.js, Remix.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

1. Find `package.json` — detect framework
2. Scan existing layout components for patterns
3. Detect styling approach (Tailwind, CSS modules)

## Conventions

### Rules
- No ternary operators — use if/else, early return, or const mapper
- No `any` type — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- Explicit return types on all functions and components
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains

## Template

### PageShell (Compound Component)

```tsx
import { cn } from '@/lib/utils'

interface PageShellProps extends React.ComponentProps<'div'> {}

export function PageShell({ className, ...props }: PageShellProps): React.JSX.Element {
  return (
    <div
      data-slot="page-shell"
      className={cn('flex flex-col h-full overflow-hidden', className)}
      {...props}
    />
  )
}

interface PageShellHeaderProps extends React.ComponentProps<'div'> {
  borderBottom?: boolean
}

export function PageShellHeader({
  className,
  borderBottom = true,
  ...props
}: PageShellHeaderProps): React.JSX.Element {
  return (
    <div
      data-slot="page-shell-header"
      className={cn(
        'flex items-center justify-between gap-4 px-4 py-3 shrink-0',
        borderBottom && 'border-b',
        className,
      )}
      {...props}
    />
  )
}

interface PageShellContentProps extends React.ComponentProps<'div'> {}

export function PageShellContent({
  className,
  ...props
}: PageShellContentProps): React.JSX.Element {
  return (
    <div
      data-slot="page-shell-content"
      className={cn('flex-1 overflow-y-auto', className)}
      {...props}
    />
  )
}

interface PageShellFooterProps extends React.ComponentProps<'div'> {
  borderTop?: boolean
}

export function PageShellFooter({
  className,
  borderTop = true,
  ...props
}: PageShellFooterProps): React.JSX.Element {
  return (
    <div
      data-slot="page-shell-footer"
      className={cn(
        'flex items-center justify-between gap-4 px-4 py-3 shrink-0',
        borderTop && 'border-t',
        className,
      )}
      {...props}
    />
  )
}
```

### Usage

```tsx
import { PageShell, PageShellHeader, PageShellContent, PageShellFooter } from '@/components/common/page-shell'
import { Pagination } from '@/components/common/pagination'

function UsersPage() {
  return (
    <PageShell>
      <PageShellHeader>
        <h1 className="text-lg font-semibold">Usuarios</h1>
        <Button>Novo usuario</Button>
      </PageShellHeader>
      <PageShellContent>
        <DataTable columns={columns} data={data} />
      </PageShellContent>
      <PageShellFooter>
        <Pagination meta={meta} />
      </PageShellFooter>
    </PageShell>
  )
}
```

### PageHeader (Optional companion)

```tsx
interface PageHeaderProps {
  title: string
  description?: string
  onBack?: () => void
  actions?: React.ReactNode
}

export function PageHeader({ title, description, onBack, actions }: PageHeaderProps): React.JSX.Element {
  return (
    <div data-slot="page-header" className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div>
          <h1 className="text-lg font-semibold">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
```

## Checklist

- [ ] data-slot attributes on all subcomponents
- [ ] cn() for conditional classes
- [ ] Named exports (no default)
- [ ] Explicit return types
- [ ] Props interfaces above functions
- [ ] Responsive (works on mobile)
