---
name: maiyu:frontend-permission
description: |
  Generates frontend permission and RBAC systems for access control.
  Use when: user asks to create permissions, role-based access, auth guards,
  route protection, or mentions "permission", "RBAC", "access control".
  Supports: Role-based menus, route guards, action-based permissions.
  Frameworks: TanStack Start, React (Vite), Next.js, Remix.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **Router**: `@tanstack/react-router` | `next` | `@remix-run/react`
   - **State**: `zustand` (for auth store)
   - **Query**: `@tanstack/react-query` (for profile/permissions fetch)
3. Scan existing permission code to detect:
   - Permission hook location (`hooks/use-table-permission.ts`)
   - Menu config location (`lib/menu/`)
   - Role constants (`lib/constant.ts`)

## Conventions

### File Structure
```
src/
├── hooks/use-permission.ts              ← Permission hooks
├── lib/menu/
│   ├── menu.ts                          ← Static menus per role
│   ├── menu-route.ts                    ← Menu item type definitions
│   └── menu-access-permissions.ts       ← Route → role mapping
└── routes/_private/layout.tsx           ← Route guard
```

### Rules
- Permissions checked both server-side (beforeLoad) and client-side (hooks)
- `can(action)` returns boolean — never throws
- Admin/master roles bypass all permission checks
- Owner/admin of resource gets full access
- No ternary operators — use if/else, early return, or const mapper
- No `any` type — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- Explicit return types on all functions and hooks
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains

## Templates

### Permission Hook (Reference Implementation)

```typescript
import { useMemo } from 'react';

import { useProfileRead } from '@/hooks/tanstack-query/use-profile-read';
import { useAuthStore } from '@/stores/authentication';

type Action =
  | 'VIEW_TABLE' | 'CREATE_TABLE' | 'UPDATE_TABLE' | 'REMOVE_TABLE'
  | 'VIEW_FIELD' | 'CREATE_FIELD' | 'UPDATE_FIELD' | 'REMOVE_FIELD'
  | 'VIEW_ROW' | 'CREATE_ROW' | 'UPDATE_ROW' | 'REMOVE_ROW';

const PERMISSION_SLUG_MAP: Record<Action, string> = {
  CREATE_TABLE: 'create-table',
  UPDATE_TABLE: 'update-table',
  REMOVE_TABLE: 'remove-table',
  VIEW_TABLE: 'view-table',
  CREATE_FIELD: 'create-field',
  UPDATE_FIELD: 'update-field',
  REMOVE_FIELD: 'remove-field',
  VIEW_FIELD: 'view-field',
  CREATE_ROW: 'create-row',
  UPDATE_ROW: 'update-row',
  REMOVE_ROW: 'remove-row',
  VIEW_ROW: 'view-row',
};

interface UsePermissionResult {
  can: (action: Action) => boolean;
  isLoading: boolean;
}

export function usePermission(): UsePermissionResult {
  const profile = useProfileRead();

  const isMaster = profile.data?.group.slug === 'MASTER';
  const isAdministrator = profile.data?.group.slug === 'ADMINISTRATOR';

  const permissions = useMemo(() => {
    if (!profile.data) return [];
    return profile.data.group.permissions.map((p) => p.slug.toLowerCase());
  }, [profile.data]);

  const can = useMemo(() => {
    return (action: Action): boolean => {
      if (isMaster) return true;
      if (isAdministrator) return true;

      const requiredSlug = PERMISSION_SLUG_MAP[action].toLowerCase();
      return permissions.includes(requiredSlug);
    };
  }, [isMaster, isAdministrator, permissions]);

  return { can, isLoading: profile.status === 'pending' };
}
```

### Resource Permission Hook (with ownership)

```typescript
interface IResource {
  owner: string | { _id: string };
  administrators?: Array<string | { _id: string }>;
  visibility?: string;
}

interface UseResourcePermissionResult {
  isOwner: boolean;
  isAdmin: boolean;
  isOwnerOrAdmin: boolean;
  can: (action: Action) => boolean;
  isLoading: boolean;
}

export function useResourcePermission(
  resource: IResource | undefined,
): UseResourcePermissionResult {
  const auth = useAuthStore();
  const { can: canByRole, isLoading } = usePermission();
  const userId = auth.user?._id;

  const isOwner = useMemo(() => {
    if (!resource || !userId) return false;
    let ownerId = '';
    if (typeof resource.owner === 'string') {
      ownerId = resource.owner;
    } else {
      ownerId = resource.owner._id;
    }
    return ownerId === userId;
  }, [resource, userId]);

  const isAdmin = useMemo(() => {
    if (!resource || !userId) return false;
    if (!resource.administrators) return false;
    return resource.administrators.some((admin) => {
      let adminId = '';
      if (typeof admin === 'string') {
        adminId = admin;
      } else {
        adminId = admin._id;
      }
      return adminId === userId;
    });
  }, [resource, userId]);

  const isOwnerOrAdmin = isOwner || isAdmin;

  const can = useMemo(() => {
    return (action: Action): boolean => {
      // Owner or admin of resource can do everything
      if (isOwnerOrAdmin) return true;
      // Fall back to role-based permission
      return canByRole(action);
    };
  }, [isOwnerOrAdmin, canByRole]);

  return { isOwner, isAdmin, isOwnerOrAdmin, can, isLoading };
}
```

### Route Access Control

```typescript
import type { LinkProps } from '@tanstack/react-router';

export const ROLE_ROUTES: Record<string, Array<LinkProps['to']>> = {
  MASTER: ['/tables', '/users', '/groups', '/menus', '/settings'],
  ADMINISTRATOR: ['/tables', '/users', '/groups', '/menus'],
  MANAGER: ['/tables'],
  REGISTERED: ['/tables'],
};

export const ROLE_DEFAULT_ROUTE: Record<string, LinkProps['to']> = {
  MASTER: '/tables',
  ADMINISTRATOR: '/tables',
  MANAGER: '/tables',
  REGISTERED: '/tables',
};

export function canAccessRoute(role: string, route: string): boolean {
  const allowedRoutes = ROLE_ROUTES[role];
  if (!allowedRoutes) return false;

  for (const pattern of allowedRoutes) {
    if (matchRoute(String(pattern), route)) return true;
  }

  return false;
}

function matchRoute(pattern: string, route: string): boolean {
  if (pattern === route) return true;

  // Handle dynamic segments: /users/$userId matches /users/123
  const patternParts = pattern.split('/');
  const routeParts = route.split('/');

  if (patternParts.length !== routeParts.length) {
    // Check prefix match
    if (route.startsWith(pattern)) return true;
    return false;
  }

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith('$')) continue; // dynamic segment
    if (patternParts[i] !== routeParts[i]) return false;
  }

  return true;
}
```

### Route Guard (TanStack Router)

```typescript
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { profileDetailOptions } from '@/hooks/tanstack-query/_query-options';
import { useAuthStore } from '@/stores/authentication';

export const Route = createFileRoute('/_private')({
  beforeLoad: async ({ context }) => {
    try {
      const user = await context.queryClient.ensureQueryData(
        profileDetailOptions(),
      );
      useAuthStore.getState().setUser(user);
    } catch {
      throw redirect({ to: '/' });
    }
  },
  component: () => <Outlet />,
});
```

### Role-Based Static Menu

```typescript
import { LayoutDashboard, Users, Settings, Table2, Menu } from 'lucide-react';

interface MenuItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MENUS_BY_ROLE: Record<string, Array<MenuItem>> = {
  MASTER: [
    { label: 'Tables', to: '/tables', icon: Table2 },
    { label: 'Users', to: '/users', icon: Users },
    { label: 'Menus', to: '/menus', icon: Menu },
    { label: 'Settings', to: '/settings', icon: Settings },
  ],
  ADMINISTRATOR: [
    { label: 'Tables', to: '/tables', icon: Table2 },
    { label: 'Users', to: '/users', icon: Users },
    { label: 'Menus', to: '/menus', icon: Menu },
  ],
  MANAGER: [
    { label: 'Tables', to: '/tables', icon: Table2 },
  ],
  REGISTERED: [
    { label: 'Tables', to: '/tables', icon: Table2 },
  ],
};

export function getMenusByRole(role: string): Array<MenuItem> {
  return MENUS_BY_ROLE[role] ?? MENUS_BY_ROLE.REGISTERED;
}
```

### Usage in Components

```tsx
import { useResourcePermission } from '@/hooks/use-permission';
import { AccessDenied } from '@/components/common/access-denied';

function EntityDetailPage(): React.JSX.Element {
  const { data: entity } = useSuspenseQuery(entityDetailOptions(id));
  const permission = useResourcePermission(entity);

  if (!permission.can('VIEW_TABLE')) {
    return <AccessDenied />;
  }

  return (
    <div>
      <h1>{entity.name}</h1>
      {permission.can('UPDATE_TABLE') && (
        <Button onClick={() => setMode('edit')}>Edit</Button>
      )}
      {permission.can('REMOVE_TABLE') && (
        <Button variant="destructive">Delete</Button>
      )}
    </div>
  );
}
```

### Resource Visibility Levels

```typescript
export enum Visibility {
  PUBLIC = 'PUBLIC',
  RESTRICTED = 'RESTRICTED',
  PRIVATE = 'PRIVATE',
  OPEN = 'OPEN',
  FORM = 'FORM',
}

interface VisibilityUser {
  isOwner: boolean;
  isAuthenticated: boolean;
}

interface VisibilityGuardResult {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  requiresAuth: boolean;
}

export function useVisibilityGuard(
  visibility: Visibility,
  user: VisibilityUser,
): VisibilityGuardResult {
  return useMemo(() => {
    if (visibility === Visibility.PUBLIC) {
      return {
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        requiresAuth: false,
      };
    }

    if (visibility === Visibility.FORM) {
      return {
        canView: false,
        canCreate: true,
        canEdit: false,
        canDelete: false,
        requiresAuth: false,
      };
    }

    if (visibility === Visibility.OPEN) {
      return {
        canView: true,
        canCreate: true,
        canEdit: false,
        canDelete: false,
        requiresAuth: false,
      };
    }

    if (visibility === Visibility.RESTRICTED) {
      return {
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        requiresAuth: true,
      };
    }

    // PRIVATE
    return {
      canView: user.isOwner,
      canCreate: false,
      canEdit: user.isOwner,
      canDelete: user.isOwner,
      requiresAuth: true,
    };
  }, [visibility, user.isOwner]);
}

// Route guard factory for TanStack Router beforeLoad
export function createVisibilityGuard(visibility: Visibility) {
  return async function visibilityBeforeLoad({
    context,
  }: {
    context: { queryClient: QueryClient };
  }) {
    if (
      visibility === Visibility.PUBLIC ||
      visibility === Visibility.OPEN ||
      visibility === Visibility.FORM
    ) {
      return;
    }

    try {
      const user = await context.queryClient.ensureQueryData(
        profileDetailOptions(),
      );
      useAuthStore.getState().setUser(user);
    } catch {
      throw redirect({ to: '/' });
    }
  };
}
```

### Collaboration Mode

```typescript
export enum CollaborationMode {
  OPEN = 'OPEN',
  RESTRICTED = 'RESTRICTED',
}

interface CollaborationUser {
  _id: string;
  isAuthenticated: boolean;
  role?: string;
}

interface CollaborationResource {
  owner: string | { _id: string };
}

interface CollaborationModeResult {
  canEdit: boolean;
}

export function useCollaborationMode(
  mode: CollaborationMode,
  user: CollaborationUser,
  resource: CollaborationResource | undefined,
): CollaborationModeResult {
  return useMemo(() => {
    if (!user.isAuthenticated) {
      return { canEdit: false };
    }

    if (mode === CollaborationMode.OPEN) {
      return { canEdit: true };
    }

    // RESTRICTED: only owner or admin/master can edit
    if (!resource) {
      return { canEdit: false };
    }

    let ownerId = '';
    if (typeof resource.owner === 'string') {
      ownerId = resource.owner;
    } else {
      ownerId = resource.owner._id;
    }

    if (ownerId === user._id) {
      return { canEdit: true };
    }

    if (user.role === 'MASTER' || user.role === 'ADMINISTRATOR') {
      return { canEdit: true };
    }

    return { canEdit: false };
  }, [mode, user._id, user.isAuthenticated, user.role, resource]);
}

// UI pattern: conditionally render Edit/Delete buttons
// function ResourceActions({ resource }: { resource: Resource }): React.JSX.Element {
//   const auth = useAuthStore();
//   const { canEdit } = useCollaborationMode(
//     resource.collaborationMode,
//     { _id: auth.user._id, isAuthenticated: true, role: auth.user.role },
//     resource,
//   );
//
//   if (!canEdit) {
//     return <></>;
//   }
//
//   return (
//     <div>
//       <Button onClick={handleEdit}>Edit</Button>
//       <Button variant="destructive" onClick={handleDelete}>Delete</Button>
//     </div>
//   );
// }
```

### Optional Auth Route Guard

```typescript
// Route guard for routes that are conditionally public.
// Fetch resource metadata FIRST, then decide if auth is needed.

export const Route = createFileRoute('/_conditional-auth/$resourceId')({
  beforeLoad: async ({ context, params }) => {
    // Step 1: fetch resource metadata (public endpoint, no auth required)
    let resource: { visibility: string } | null = null;
    try {
      resource = await context.queryClient.ensureQueryData(
        resourceMetadataOptions(params.resourceId),
      );
    } catch {
      throw redirect({ to: '/' });
    }

    // Step 2: if visibility is PUBLIC, OPEN, or FORM, skip auth entirely
    if (
      resource.visibility === 'PUBLIC' ||
      resource.visibility === 'OPEN' ||
      resource.visibility === 'FORM'
    ) {
      return;
    }

    // Step 3: otherwise, require authentication as normal
    try {
      const user = await context.queryClient.ensureQueryData(
        profileDetailOptions(),
      );
      useAuthStore.getState().setUser(user);
    } catch {
      throw redirect({ to: '/' });
    }
  },
  component: () => <Outlet />,
});
```

## Checklist

- [ ] `usePermission()` hook with `can(action)` returning boolean
- [ ] `useResourcePermission(resource)` with ownership checks
- [ ] ROLE_ROUTES mapping for route access control
- [ ] `canAccessRoute()` with dynamic param matching
- [ ] Route guard in layout `beforeLoad`
- [ ] Role-based static menus
- [ ] Admin/master bypass all checks
- [ ] `useVisibilityGuard()` with PUBLIC, RESTRICTED, PRIVATE, OPEN, FORM levels
- [ ] `createVisibilityGuard()` route guard factory for visibility-based auth
- [ ] `useCollaborationMode()` with OPEN and RESTRICTED modes
- [ ] Conditional auth route guard (fetch resource metadata before auth decision)
- [ ] No ternary operators
