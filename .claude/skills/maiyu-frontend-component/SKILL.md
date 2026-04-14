---
name: maiyu:frontend-component
description: |
  Generates React components for frontend projects.
  Use when: user asks to create a component, UI component, page section,
  widget, card, panel, or mentions "component" for rendering UI.
  Supports: Function components, Tailwind CSS, CVA, compound components.
  Frameworks: TanStack Start, React (Vite), Next.js, Remix.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **Framework**: `@tanstack/react-start` | `@tanstack/react-router` | `next` | `@remix-run/react` | `react`
   - **Styling**: `tailwindcss` | `class-variance-authority` | `@emotion/react` | `styled-components`
   - **UI lib**: `@radix-ui/*` | `@headlessui/react` | `@mantine/core`
3. Scan existing components to detect:
   - Component location (`src/components/common/`, `src/components/`)
   - Naming convention (kebab-case files, PascalCase exports)
   - Styling approach (Tailwind classes, CSS modules, styled-components)
   - Compound component pattern (`data-slot` attributes)
4. If framework not detected, ask user:
   ```
   Which framework does your project use?
   1. TanStack Start
   2. React (Vite)
   3. Next.js (App Router)
   4. Remix
   ```

## Language Detection

Scan existing components and validation files for language:
- pt-BR indicators: "obrigatório", "nenhum", "Erro", "Carregando"
- en indicators: "required", "none", "Error", "Loading"
- Match the detected language for any user-facing strings

## Conventions

### Naming
- File: `{component-name}.tsx` in kebab-case (e.g., `user-card.tsx`)
- Skeleton: `{component-name}-skeleton.tsx`
- Export: named function `{ComponentName}()` (not default)
- Props: `interface {ComponentName}Props` defined above function

### File Placement
- `src/components/common/{name}.tsx` (shared components)
- `src/components/common/{feature}/{name}.tsx` (feature-grouped)
- `src/components/ui/{name}.tsx` (UI primitives — see `frontend-ui` skill)

### Rules
- Named exports only (no default exports)
- Explicit return type: `React.JSX.Element`
- Props interface directly above the component function
- No ternary operators — use if/else, early return, or const mapper
- No `any` type — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- Explicit return types on all functions and components
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains
- Use `data-slot` attribute on composable subcomponents
- Tailwind CSS for styling (no inline styles)
- Use `cn()` utility from `@/lib/utils` for conditional classes

## Component Categories

| Category | Examples | Key Pattern |
|----------|----------|-------------|
| **Display** | Card, Badge, Avatar | Props → render markup |
| **Compound** | Card + CardHeader + CardContent | Multiple named exports with `data-slot` |
| **Interactive** | Dialog, Dropdown, Tabs | State management + event handlers |
| **Data** | DataTable, List, Grid | Data prop + mapping + cell renderers |
| **Feedback** | Skeleton, Spinner, Empty | Loading/error/empty states |
| **Layout** | Sidebar, Container, Stack | Children + layout CSS |

## Templates

### TanStack Start / React (Reference Implementation)

**Simple Component:**
```tsx
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending';
  className?: string;
}

const statusStyles: Record<StatusBadgeProps['status'], string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
};

export function StatusBadge({
  status,
  className,
}: StatusBadgeProps): React.JSX.Element {
  return (
    <span
      data-slot="status-badge"
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status],
        className,
      )}
    >
      {status}
    </span>
  );
}
```

**Compound Component:**
```tsx
import { cn } from '@/lib/utils';

interface InfoCardProps extends React.ComponentProps<'div'> {}

export function InfoCard({
  className,
  ...props
}: InfoCardProps): React.JSX.Element {
  return (
    <div
      data-slot="info-card"
      className={cn(
        'rounded-xl border bg-card text-card-foreground shadow-sm',
        className,
      )}
      {...props}
    />
  );
}

interface InfoCardHeaderProps extends React.ComponentProps<'div'> {}

export function InfoCardHeader({
  className,
  ...props
}: InfoCardHeaderProps): React.JSX.Element {
  return (
    <div
      data-slot="info-card-header"
      className={cn('flex flex-col gap-1.5 p-6', className)}
      {...props}
    />
  );
}

interface InfoCardContentProps extends React.ComponentProps<'div'> {}

export function InfoCardContent({
  className,
  ...props
}: InfoCardContentProps): React.JSX.Element {
  return (
    <div
      data-slot="info-card-content"
      className={cn('px-6 pb-6', className)}
      {...props}
    />
  );
}
```

**Component with Loading State:**
```tsx
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface UserProfileProps {
  name: string;
  email: string;
  avatarUrl?: string;
  className?: string;
}

export function UserProfile({
  name,
  email,
  avatarUrl,
  className,
}: UserProfileProps): React.JSX.Element {
  return (
    <div
      data-slot="user-profile"
      className={cn('flex items-center gap-3', className)}
    >
      <div className="h-10 w-10 rounded-full bg-muted overflow-hidden">
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-xs text-muted-foreground">{email}</span>
      </div>
    </div>
  );
}

export function UserProfileSkeleton(): React.JSX.Element {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex flex-col gap-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}
```

**Component with Conditional Rendering (no ternaries):**
```tsx
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <h3 className="text-lg font-medium">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

### Next.js (App Router)

**Server Component (default):**
```tsx
// No 'use client' directive — this is a server component
interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({
  title,
  description,
}: PageHeaderProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
```

**Client Component (interactive):**
```tsx
'use client';

import { useState } from 'react';

interface CounterProps {
  initialValue?: number;
}

export function Counter({
  initialValue = 0,
}: CounterProps): React.JSX.Element {
  const [count, setCount] = useState(initialValue);

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => setCount((c) => c - 1)}>-</button>
      <span>{count}</span>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
    </div>
  );
}
```

### Remix

Same pattern as React — Remix components are standard React components. Add `'use client'` only if using React 19 features that require it.

## Checklist

When generating components:
- [ ] Named export with explicit return type
- [ ] Props interface above function
- [ ] `data-slot` attribute on composable parts
- [ ] `cn()` for conditional Tailwind classes
- [ ] Skeleton companion component for loading states
- [ ] No ternary operators
- [ ] Accessible (aria attributes where needed)
