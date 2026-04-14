---
name: maiyu:frontend-rbac
description: |
  Generates role-based access control patterns for frontend applications.
  Use when: user asks to create role guards, permission checks, route protection,
  menu filtering, or mentions "RBAC", "permissions", "role guard", "access control".
  Supports: Route guards, menu filtering, component-level permissions.
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

### Role Routes Mapping

```typescript
// lib/menu/menu-access-permissions.ts
export const E_ROLE = {
  MASTER: 'MASTER',
  ADMINISTRATOR: 'ADMINISTRATOR',
  MANAGER: 'MANAGER',
  REGISTERED: 'REGISTERED',
} as const

type Role = keyof typeof E_ROLE

export const ROLE_ROUTES: Record<Role, string[]> = {
  MASTER: ['/dashboard', '/tables', '/tables/$slug', '/users', '/users/$userId', '/groups', '/menus', '/settings', '/tools', '/profile'],
  ADMINISTRATOR: ['/tables', '/tables/$slug', '/users', '/menus', '/profile'],
  MANAGER: ['/tables', '/tables/$slug', '/profile'],
  REGISTERED: ['/tables', '/tables/$slug', '/profile'],
}

export const ROLE_DEFAULT_ROUTE: Record<Role, string> = {
  MASTER: '/dashboard',
  ADMINISTRATOR: '/tables',
  MANAGER: '/tables',
  REGISTERED: '/tables',
}
```

### canAccessRoute (Pattern Matching)

```typescript
function matchRoute(actualPath: string, pattern: string): boolean {
  const actualParts = actualPath.split('/').filter(Boolean)
  const patternParts = pattern.split('/').filter(Boolean)

  if (actualParts.length < patternParts.length) return false

  return patternParts.every((part, i) => {
    if (part.startsWith('$')) return true
    return part === actualParts[i]
  })
}

export function canAccessRoute(role: string, path: string): boolean {
  function isRole(value: string): value is Role {
    return value in E_ROLE;
  }
  if (!isRole(role)) return false;
  const routes = ROLE_ROUTES[role]
  if (!routes) return false
  return routes.some((pattern) => matchRoute(path, pattern))
}
```

### Menu Filtering by Role

```typescript
interface MenuItem {
  label: string
  href: string
  icon?: React.ComponentType
  roles: Role[]
  children?: MenuItem[]
}

export function getMenuByRole(menu: MenuItem[], role: Role): MenuItem[] {
  return menu
    .filter((item) => item.roles.includes(role))
    .map((item) => {
      let children: MenuItem[] | undefined;
      if (item.children) {
        children = getMenuByRole(item.children, role);
      }
      return { ...item, children };
    })
}
```

### Route Guard (TanStack Router)

```typescript
// routes/_private/layout.tsx
beforeLoad: async ({ context, location }) => {
  const user = useAuthStore.getState().user
  if (!user) throw redirect({ to: '/' })

  const role = user.role.toUpperCase()
  if (!canAccessRoute(role, location.pathname)) {
    throw redirect({ to: ROLE_DEFAULT_ROUTE[role] })
  }
}
```

### Route Guard (Next.js Middleware)

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { canAccessRoute, ROLE_DEFAULT_ROUTE } from '@/lib/menu/permissions'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value
  if (!token) return NextResponse.redirect(new URL('/', request.url))

  // Decode JWT to get role (or call API)
  const payload = JSON.parse(atob(token.split('.')[1]))
  const role = payload.role

  if (!canAccessRoute(role, request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL(ROLE_DEFAULT_ROUTE[role], request.url))
  }

  return NextResponse.next()
}
```

### Permission Hook

```typescript
function isRole(value: string): value is Role {
  return value in E_ROLE;
}

export function usePermission() {
  const user = useAuthStore((s) => s.user)
  const roleStr = user?.role?.toUpperCase() || 'REGISTERED'
  let role: Role = 'REGISTERED';
  if (isRole(roleStr)) {
    role = roleStr;
  }

  return {
    canAccess: (route: string) => canAccessRoute(role, route),
    hasRole: (...roles: Role[]) => roles.includes(role),
    isMaster: role === 'MASTER',
    isAdmin: ['MASTER', 'ADMINISTRATOR'].includes(role),
  }
}
```

### Conditional Rendering

```tsx
import { usePermission } from '@/hooks/use-permission'

function AdminPanel(): React.JSX.Element {
  const { isAdmin } = usePermission()

  if (!isAdmin) return <AccessDenied />

  return <div>{/* admin content */}</div>
}
```

## Checklist

- [ ] Role hierarchy defined (MASTER > ADMIN > MANAGER > REGISTERED)
- [ ] Route patterns support dynamic segments ($param)
- [ ] Default route per role
- [ ] Menu filtered by role
- [ ] Permission hook available in components
- [ ] Server-side guard (middleware or beforeLoad)
