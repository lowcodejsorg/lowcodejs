---
name: maiyu:frontend-api-service
description: |
  Generates API client layer for frontend projects.
  Use when: user asks to create an API service, HTTP client, axios setup,
  API interceptors, or mentions "api", "http client", "api.ts" for server communication.
  Supports: Axios, fetch, ky, ofetch.
  Frameworks: TanStack Start, React (Vite), Next.js, Next.js App Router, Remix.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **HTTP client**: `axios` | `ky` | `ofetch` | native `fetch`
   - **Framework**: `@tanstack/react-start` | `next` | `@remix-run/react` | `react`
   - **State**: `zustand` (for auth store integration in interceptors)
3. Scan existing API code to detect:
   - API file location (`src/lib/api.ts`)
   - Error handler (`src/lib/handle-api-error.ts`)
   - Config (`src/lib/get-api-config.ts`)
   - Payload types (`src/lib/payloads.ts`)
4. If HTTP client not detected, default to Axios

## Conventions

### File Structure
```
src/lib/
├── api.ts              ← Axios instance + interceptors
├── handle-api-error.ts ← Error handling utility
├── get-api-config.ts   ← Base URL resolution
└── payloads.ts         ← Request/response payload types
```

### Rules
- `withCredentials: true` for cookie-based auth
- Request interceptor: resolve base URL, forward cookies in SSR
- Response interceptor: handle 401 by clearing auth + redirect
- SSR-safe: check `typeof window === 'undefined'` for server-side logic
- `handleApiError()` with `context`, `onFieldErrors`, `causeHandlers`
- No ternary operators — use if/else, early return, or const mapper
- No `any` type — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- Explicit return types on all functions
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains

## Templates

### Axios Instance (Reference Implementation)

```typescript
import axios from 'axios';

import { getApiBaseUrl } from '@/lib/get-api-config';
import { useAuthStore } from '@/stores/authentication';

export const API = axios.create({
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let resolvedBaseUrl: string | null = null;

const PUBLIC_PATHS = ['/', '/sign-up'];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/tables/')) return true;
  return false;
}

// Request interceptor: resolve base URL + SSR cookie forwarding
API.interceptors.request.use(async (config) => {
  if (!resolvedBaseUrl) {
    resolvedBaseUrl = await getApiBaseUrl();
  }
  config.baseURL = resolvedBaseUrl;

  // Server-side: forward cookies from request
  if (typeof window === 'undefined') {
    const cookies = await getServerCookies();
    if (cookies) {
      config.headers.set('Cookie', cookies);
    }
  }

  return config;
});

// Response interceptor: handle 401
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (!isPublicPath(currentPath)) {
          useAuthStore.getState().clear();
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  },
);
```

### Base URL Resolution

```typescript
// For TanStack Start / Vite SSR
import { Env } from '@/env';

export async function getApiBaseUrl(): Promise<string> {
  // Server-side: use internal URL
  if (typeof window === 'undefined') {
    return Env.SERVER_URL ?? Env.VITE_API_BASE_URL;
  }
  // Client-side: use public URL
  return Env.VITE_API_BASE_URL;
}
```

### Error Handling Utility

```typescript
import { AxiosError } from 'axios';

import type { IHTTPExeptionError } from '@/lib/interfaces';
import { toastError } from '@/lib/toast';

interface HandleApiErrorOptions {
  context: string;
  onFieldErrors?: (errors: Record<string, string>) => void;
  causeHandlers?: Record<
    string,
    (errorData: IHTTPExeptionError<Record<string, string>>) => void
  >;
}

export function handleApiError(
  error: unknown,
  options: HandleApiErrorOptions,
): void {
  if (!(error instanceof AxiosError) || !error.response?.data) {
    toastError(options.context, 'Unexpected error');
    return;
  }

  const errorData: IHTTPExeptionError<Record<string, string>> = error.response.data;
  const cause = errorData.cause;

  // Field-level validation errors from backend
  if (
    cause === 'INVALID_PAYLOAD_FORMAT' &&
    errorData.errors &&
    options.onFieldErrors
  ) {
    options.onFieldErrors(errorData.errors);
    return;
  }

  // Custom cause-specific handlers
  if (options.causeHandlers && options.causeHandlers[cause]) {
    options.causeHandlers[cause](errorData);
    return;
  }

  // Default: show toast with error message
  toastError(
    options.context,
    errorData.message ?? 'An error occurred',
  );
}
```

### Payload Types

```typescript
// Request payload types for API calls
export interface TableCreatePayload {
  name: string;
  description?: string;
  visibility?: string;
  style?: string;
}

export interface TableUpdatePayload extends Partial<TableCreatePayload> {}

export interface TableQueryPayload {
  page?: number;
  perPage?: number;
  search?: string;
}

export interface RowCreatePayload {
  slug: string;
  data: Record<string, unknown>;
}

export interface UserCreatePayload {
  name: string;
  email: string;
  password: string;
  group: string;
  status?: string;
}

export type UserUpdatePayload = Omit<UserCreatePayload, 'password'>;

export interface UserQueryPayload {
  page?: number;
  perPage?: number;
  search?: string;
}
```

### Fetch API Alternative (Next.js / Remix)

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params, ...fetchOptions } = options;
  let url = `${API_URL}${path}`;

  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...fetchOptions,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new ApiError(response.status, errorData);
  }

  return response.json();
}

class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown,
  ) {
    super(`API error: ${status}`);
  }
}
```

### Usage in Mutation Hooks

```typescript
// In mutation hooks, the API is used directly
import { API } from '@/lib/api';

const response = await API.post<ITable>('/tables', payload);
return response.data;

const response = await API.put<IUser>(`/users/${userId}`, payload);
return response.data;

await API.delete(`/users/${userId}`);
```

### Usage of Error Handler in Forms

```typescript
import { handleApiError } from '@/lib/handle-api-error';
import { createFieldErrorSetter } from '@/lib/form-utils';

const mutation = useCreateEntity({
  onError(error) {
    handleApiError(error, {
      context: 'Error creating entity',
      onFieldErrors(errors) {
        const setFieldError = createFieldErrorSetter(form);
        for (const [field, message] of Object.entries(errors)) {
          setFieldError(field, message);
        }
      },
      causeHandlers: {
        ENTITY_ALREADY_EXISTS(errorData) {
          toastError('Duplicate', errorData.message);
        },
      },
    });
  },
});
```

### Next.js App Router API

**fetch wrapper (Server Component):**
```typescript
// lib/api.ts
const API_URL = process.env.API_URL!

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`)
  }

  return res.json()
}
```

**With cookies (authenticated):**
```typescript
import { cookies } from 'next/headers'

export async function apiAuth<T>(path: string, options?: RequestInit): Promise<T> {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value

  return api<T>(path, {
    ...options,
    headers: {
      ...options?.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  })
}
```

## Checklist

- [ ] Axios instance with `withCredentials: true`
- [ ] Request interceptor: lazy base URL + SSR cookie forwarding
- [ ] Response interceptor: 401 → clear auth store + redirect
- [ ] `handleApiError()` with field errors, cause handlers, fallback toast
- [ ] Payload types for all API endpoints
- [ ] SSR-safe (typeof window checks)
- [ ] No ternary operators
