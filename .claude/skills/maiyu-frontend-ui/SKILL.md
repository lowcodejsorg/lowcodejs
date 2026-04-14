---
name: maiyu:frontend-ui
description: |
  Generates UI primitive components (shadcn/Radix style) for frontend projects.
  Use when: user asks to create a UI primitive, design system component, shadcn component,
  Radix wrapper, or mentions "ui component", "primitive", "design system" for reusable UI.
  Supports: Radix UI, Tailwind CSS, CVA, shadcn/ui patterns.
  Frameworks: TanStack Start, React (Vite), Next.js, Next.js App Router, Remix.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **UI primitives**: `@radix-ui/*` | `@headlessui/react` | `@base-ui-components/react`
   - **Styling**: `tailwindcss` | `class-variance-authority` | `clsx` | `tailwind-merge`
   - **Slot**: `@radix-ui/react-slot` (for `asChild` pattern)
3. Scan existing UI components to detect:
   - UI location (`src/components/ui/`)
   - `cn()` utility location (`src/lib/utils`)
   - Existing patterns (compound, CVA variants, data-slot)
   - `components.json` for shadcn config

## Conventions

### Naming
- File: `src/components/ui/{name}.tsx` in kebab-case
- Export: named functions (Card, CardHeader, CardContent)
- No default exports

### Rules
- Use `React.ComponentProps<'element'>` for prop types (React 19, no forwardRef)
- Add `data-slot="{component-name}"` attribute on every component
- Use `cn()` from `@/lib/utils` for class merging
- Variants via `cva()` from `class-variance-authority`
- `asChild` pattern via `@radix-ui/react-slot`
- Composable: export subcomponents as separate named functions
- No ternary operators — use if/else, `cn()`, or `data-*` attributes for state
- No `any` type — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- Explicit return types on all functions and components
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains

## Templates

### cn() Utility — `lib/utils.ts`

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: Array<ClassValue>): string {
  return twMerge(clsx(inputs));
}
```

### Simple Component (no variants)

```tsx
import { cn } from '@/lib/utils';

function Card({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="card"
      className={cn(
        'rounded-xl border bg-card text-card-foreground shadow-sm',
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="card-title"
      className={cn('leading-none font-semibold', className)}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

function CardContent({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="card-content"
      className={cn('px-6', className)}
      {...props}
    />
  );
}

function CardFooter({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
```

### Component with CVA Variants

```tsx
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=size-])]:size-4 shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        destructive: 'bg-destructive text-white shadow-xs hover:bg-destructive/90',
        outline: 'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md gap-1.5 px-3 text-xs',
        lg: 'h-10 rounded-md px-6',
        icon: 'size-9',
        'icon-sm': 'size-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

interface ButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps): React.JSX.Element {
  let Comp: React.ElementType = 'button';
  if (asChild) {
    Comp = Slot;
  }

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
```

### Radix UI Wrapper

```tsx
import * as SwitchPrimitive from '@radix-ui/react-switch';

import { cn } from '@/lib/utils';

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>): React.JSX.Element {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border shadow-xs transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="bg-background pointer-events-none block size-4 rounded-full ring-0 shadow-lg transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
```

### Form Field Wrapper (Compound)

```tsx
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const fieldVariants = cva('flex gap-2', {
  variants: {
    orientation: {
      vertical: 'flex-col',
      horizontal: 'flex-row items-center',
    },
  },
  defaultVariants: {
    orientation: 'vertical',
  },
});

interface FieldProps
  extends React.ComponentProps<'div'>,
    VariantProps<typeof fieldVariants> {}

function Field({
  className,
  orientation,
  ...props
}: FieldProps): React.JSX.Element {
  return (
    <div
      data-slot="field"
      className={cn(fieldVariants({ orientation, className }))}
      {...props}
    />
  );
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<'label'>): React.JSX.Element {
  return (
    <label
      data-slot="field-label"
      className={cn('text-sm font-medium leading-none', className)}
      {...props}
    />
  );
}

interface FieldErrorProps extends React.ComponentProps<'div'> {
  errors?: Array<string | { message: string }>;
}

function FieldError({
  errors,
  className,
  ...props
}: FieldErrorProps): React.JSX.Element | null {
  if (!errors || errors.length === 0) return null;

  return (
    <div
      data-slot="field-error"
      className={cn('text-sm text-destructive', className)}
      role="alert"
      {...props}
    >
      {errors.map((error, i) => {
        let message = '';
        if (typeof error === 'string') {
          message = error;
        } else {
          message = error.message;
        }
        return <p key={i}>{message}</p>;
      })}
    </div>
  );
}

export { Field, FieldLabel, FieldError, fieldVariants };
```

### Next.js Specific Patterns

- Server Components by default — add `'use client'` only for interactive components
- Use `React.cache()` for deduplicating data fetches in server components
- Import `cn()` from `@/lib/utils` (same pattern works in Next.js)
- CVA variants work identically in Next.js
- `data-slot` pattern works identically
- For client-only components, use dynamic import: `const Editor = dynamic(() => import('./editor'), { ssr: false })`

## Checklist

- [ ] `data-slot` attribute on every component
- [ ] `cn()` for class merging
- [ ] `React.ComponentProps<'element'>` for prop types
- [ ] CVA for components with variants
- [ ] `asChild` via Radix Slot where applicable
- [ ] Composable subcomponents as named exports
- [ ] No ternary operators
