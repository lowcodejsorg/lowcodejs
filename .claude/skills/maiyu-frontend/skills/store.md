---
name: maiyu:frontend-store
description: |
  Generates Zustand stores for frontend client-side state management.
  Use when: user asks to create a store, global state, client state, Zustand store,
  or mentions "store" or "zustand" for local/client state management.
  Supports: Zustand v5, persist middleware, SSR-safe storage.
  Frameworks: TanStack Start, React (Vite), Next.js, Remix.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **State lib**: `zustand` | `@reduxjs/toolkit` | `jotai` | `valtio`
   - **Framework**: `@tanstack/react-start` | `next` | `@remix-run/react` | `react`
3. Scan existing stores to detect:
   - Store location (`src/stores/`)
   - Persist pattern (middleware, storage key prefix)
   - SSR-safe patterns (typeof window checks)
4. If state lib not detected, default to Zustand

## Conventions

### Naming
- File: `src/stores/{entity}.ts` (e.g., `authentication.ts`, `sidebar.ts`)
- Store type: `type {Entity}Store = { ... }`
- Export: `export const use{Entity}Store = create<{Entity}Store>()(...)`
- Storage key: `{project-name}-{entity}` (e.g., `low-code-js-auth`)

### Rules
- Always type the store with `create<StoreType>()`
- Use persist middleware for data that must survive page refreshes
- SSR-safe: custom storage returning no-op on server
- Hydration tracking with `hasHydrated` + `setHasHydrated`
- `partialize` to persist only serializable state (exclude functions, derived values)
- No ternary operators — use if/else, early return, or const mapper
- No `any` type — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- Explicit return types on all functions
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains

## Templates

### Zustand — Simple Store (no persistence)

```typescript
import { create } from 'zustand';

type SidebarStore = {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
};

export const useSidebarStore = create<SidebarStore>((set) => ({
  isOpen: true,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
```

### Zustand — Persisted Store with SSR Safety (Reference Implementation)

```typescript
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { IUser } from '@/lib/interfaces';

type AuthStore = {
  user: IUser | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;
  setUser: (user: IUser | null) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hasHydrated: false,
      setHasHydrated: (val) => set({ hasHydrated: val }),
      setUser: (user) =>
        set({
          user,
          isAuthenticated: Boolean(user),
        }),
      clear: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'my-app-auth',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    },
  ),
);
```

### Zustand — Store with Computed/Derived Values

```typescript
import { create } from 'zustand';

type FilterStore = {
  search: string;
  page: number;
  perPage: number;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  reset: () => void;
};

const INITIAL_STATE = {
  search: '',
  page: 1,
  perPage: 50,
};

export const useFilterStore = create<FilterStore>((set) => ({
  ...INITIAL_STATE,
  setSearch: (search) => set({ search, page: 1 }),
  setPage: (page) => set({ page }),
  reset: () => set(INITIAL_STATE),
}));
```

### Using Store in Components

```tsx
import { useAuthStore } from '@/stores/authentication';

export function UserMenu(): React.JSX.Element {
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);

  if (!user) {
    return <LoginButton />;
  }

  return (
    <div>
      <span>{user.name}</span>
      <button onClick={clear}>Logout</button>
    </div>
  );
}
```

### Using Store Outside React (e.g., API interceptors)

```typescript
import { useAuthStore } from '@/stores/authentication';

// Access store state outside React components
const user = useAuthStore.getState().user;
useAuthStore.getState().clear();
```

## Store Categories

| Category | Persist? | SSR-safe? | Example |
|----------|----------|-----------|---------|
| **Auth** | Yes | Yes | User session, tokens |
| **UI preferences** | Yes | No | Sidebar open, theme, column visibility |
| **Filters** | No | No | Search text, active page |
| **Modals/dialogs** | No | No | Open state, selected item |

### Sidebar/Panel Store

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SidebarStore {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      isOpen: true,
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: 'sidebar-state',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        }
        return localStorage;
      }),
      partialize: (state) => ({ isOpen: state.isOpen }),
    },
  ),
);
```

### UI Preferences Store

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';
type Locale = 'pt-br' | 'en-us';
type TableDensity = 'compact' | 'normal' | 'comfortable';

interface UIPreferencesStore {
  theme: Theme;
  locale: Locale;
  tableDensity: TableDensity;
  sidebarOpen: boolean;
  setTheme: (theme: Theme) => void;
  setLocale: (locale: Locale) => void;
  setTableDensity: (density: TableDensity) => void;
  toggleSidebar: () => void;
}

export const useUIPreferencesStore = create<UIPreferencesStore>()(
  persist(
    (set) => ({
      theme: 'system',
      locale: 'pt-br',
      tableDensity: 'normal',
      sidebarOpen: true,
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => set({ locale }),
      setTableDensity: (tableDensity) => set({ tableDensity }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'ui-preferences',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        }
        return localStorage;
      }),
      partialize: (state) => ({
        theme: state.theme,
        locale: state.locale,
        tableDensity: state.tableDensity,
        sidebarOpen: state.sidebarOpen,
      }),
    },
  ),
);
```

## Checklist

- [ ] Typed with `create<StoreType>()`
- [ ] SSR-safe storage (no-op on server) for persisted stores
- [ ] `hasHydrated` + `setHasHydrated` for hydration tracking
- [ ] `partialize` excludes functions and derived values
- [ ] Selectors in components: `useStore((state) => state.field)`
- [ ] Sidebar/panel store with toggle + localStorage persist
- [ ] UI preferences store (theme, locale, density, sidebar)
- [ ] No ternary operators
