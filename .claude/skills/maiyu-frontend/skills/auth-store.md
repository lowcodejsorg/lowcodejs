---
name: maiyu:frontend-auth-store
description: |
  Generates authentication state management with Zustand and API interceptors.
  Use when: user asks to create auth store, login state, session management,
  or mentions "auth store", "zustand auth", "login state".
  Supports: Zustand, localStorage persistence, SSR-safe, Axios interceptors.
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
- Explicit return types on all functions
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains

## Templates

### Zustand Auth Store (SSR-Safe)

```typescript
// stores/authentication.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface IUser {
  id: string
  name: string
  email: string
  role: string
}

interface AuthState {
  user: IUser | null
  isAuthenticated: boolean
  hasHydrated: boolean
  setUser: (user: IUser) => void
  clear: () => void
  setHasHydrated: (value: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hasHydrated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      clear: () => set({ user: null, isAuthenticated: false }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'app-auth',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          }
        }
        return localStorage
      }),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)
```

### Axios Interceptors (Cookie Auth)

```typescript
// lib/api.ts
import axios from 'axios'
import { useAuthStore } from '@/stores/authentication'

export const API = axios.create({
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

let resolvedBaseUrl: string | null = null

API.interceptors.request.use(async (config) => {
  if (!resolvedBaseUrl) {
    // TanStack Start: resolve via server function
    // Next.js: use env variable
    // Vite: use import.meta.env
    resolvedBaseUrl = process.env.NEXT_PUBLIC_API_URL || import.meta.env?.VITE_API_BASE_URL || '/api'
  }
  config.baseURL = resolvedBaseUrl

  // SSR: inject cookies from request context
  if (typeof window === 'undefined') {
    try {
      const cookies = await getServerCookies() // framework-specific
      if (cookies) config.headers.set('Cookie', cookies)
    } catch {}
  }

  return config
})

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clear()

      if (typeof window !== 'undefined') {
        const publicRoutes = ['/', '/sign-up']
        if (!publicRoutes.includes(window.location.pathname)) {
          window.location.href = '/'
        }
      }
    }
    return Promise.reject(error)
  },
)
```

### Auth Guard (TanStack Router)

```typescript
// routes/_private/layout.tsx
export const Route = createFileRoute('/_private')({
  beforeLoad: async ({ context }) => {
    try {
      const user = await context.queryClient.ensureQueryData(profileOptions())
      useAuthStore.getState().setUser(user)
    } catch {
      useAuthStore.getState().clear()
      throw redirect({ to: '/' })
    }
  },
})
```

### Auth Guard (Next.js Middleware)

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/dashboard', '/users', '/settings']
const publicRoutes = ['/', '/sign-up']

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value
  const { pathname } = request.nextUrl

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
  const isPublic = publicRoutes.includes(pathname)

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (isPublic && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

## Checklist

- [ ] SSR-safe localStorage (no window access on server)
- [ ] Hydration tracking (hasHydrated flag)
- [ ] 401 interceptor clears auth state
- [ ] Public routes bypass auth redirect
- [ ] Cookie-based auth (httpOnly, secure)
- [ ] Store accessible outside React (getState())
