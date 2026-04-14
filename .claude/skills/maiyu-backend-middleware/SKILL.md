---
name: maiyu:backend-middleware
description: |
  Generates middleware/hook functions for backend Node.js projects.
  Use when: user asks to create middleware, guard, interceptor, hook,
  or mentions "middleware" for request pipeline processing.
  Supports: Fastify hooks, Express middleware, NestJS guards/interceptors, Hono middleware, Elysia derive/onBeforeHandle.
  Frameworks: Fastify, Express, NestJS, AdonisJS v6/v7, Hono, Elysia/Bun.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **Framework**: `fastify` | `express` | `@nestjs/core` | `@adonisjs/core` | `hono` | `elysia`
   - **Auth**: `jsonwebtoken` | `jose` | `@fastify/jwt` | `passport` | `@nestjs/passport`
   - **Validator**: `zod` | `class-validator` | `joi` | `@sinclair/typebox`
3. Scan existing middlewares to detect:
   - Middleware location (e.g., `application/middlewares/`, `src/middlewares/`)
   - Error handling patterns (HTTPException, NestJS filters)
   - Factory function pattern vs class-based
4. If framework not detected, ask user:
   ```
   Which framework does your project use?
   1. Fastify (with fastify-decorators)
   2. Fastify (plain)
   3. Express
   4. NestJS
   5. AdonisJS
   6. Hono
   7. Elysia/Bun
   ```

## Conventions

### Naming
- File: `{purpose}.middleware.ts` (e.g., `authentication.middleware.ts`, `rate-limit.middleware.ts`)
- NestJS guards: `{purpose}.guard.ts`
- NestJS interceptors: `{purpose}.interceptor.ts`
- Export: named factory function `{Purpose}Middleware(options)` that returns the handler

### File Placement
- `application/middlewares/{purpose}.middleware.ts` (Fastify reference)
- `src/middlewares/` or `src/guards/` or `src/interceptors/` (NestJS)

### Rules
- Always use factory function pattern — accept an options object, return the handler
- Type the options interface explicitly
- No ternary operators — use if/else or early returns
- No `any` type — use `unknown`, concrete types, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- All functions must have explicit return types
- Multiple conditions use const mapper (object lookup) instead of switch/if-else chains
- Throw framework-specific exceptions (HTTPException, HttpException, etc.)
- Keep middleware single-responsibility — one concern per middleware
- Always type request augmentation (e.g., `request.user`, `request.table`)

## Middleware Categories

When user asks for a middleware, identify the category:

| Category | Examples | Key Pattern |
|----------|----------|-------------|
| **Authentication** | JWT verify, API key, session | Extract credential → validate → attach user to request |
| **Authorization** | RBAC, ownership, permission | Read user from request → check permission → allow/deny |
| **Validation** | Schema validation, sanitization | Parse input → validate → transform or reject |
| **Rate Limiting** | Throttle, quota | Track requests → compare limit → allow/reject |
| **Logging** | Request logger, audit trail | Capture request/response data → log → continue |
| **CORS** | Cross-origin handling | Check origin → set headers → allow/reject |
| **Error Handling** | Global error handler | Catch errors → format → respond |

## Templates

### Fastify — Factory Function (Reference Implementation)

**Authentication Middleware:**
```typescript
import type { FastifyRequest } from 'fastify';

import { E_JWT_TYPE, type IJWTPayload } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';

interface AuthOptions {
  optional?: boolean;
}

export function AuthenticationMiddleware(
  options: AuthOptions = { optional: false },
) {
  return async function (request: FastifyRequest): Promise<void> {
    try {
      const accessToken = request.cookies.accessToken;

      if (!accessToken) {
        if (options.optional) return;
        throw HTTPException.Unauthorized(
          'Authentication required',
          'AUTHENTICATION_REQUIRED',
        );
      }

      const decoded: IJWTPayload | null =
        await request.server.jwt.decode(String(accessToken));

      if (!decoded || decoded.type !== E_JWT_TYPE.ACCESS) {
        if (options.optional) return;
        throw HTTPException.Unauthorized(
          'Authentication required',
          'AUTHENTICATION_REQUIRED',
        );
      }

      request.user = {
        sub: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        type: E_JWT_TYPE.ACCESS,
      };
    } catch (error) {
      if (options.optional) return;
      throw HTTPException.Unauthorized(
        'Authentication required',
        'AUTHENTICATION_REQUIRED',
      );
    }
  };
}
```

**Authorization / Access Control Middleware:**
```typescript
import type { FastifyRequest } from 'fastify';

import HTTPException from '@application/core/exception.core';

interface AccessOptions {
  requiredPermission: string;
  allowPublic?: boolean;
}

export function AccessControlMiddleware(options: AccessOptions) {
  const { requiredPermission, allowPublic = false } = options;

  return async function (request: FastifyRequest): Promise<void> {
    // Public access shortcut
    if (allowPublic && request.method === 'GET') {
      return;
    }

    const user = request.user;

    if (!user) {
      throw HTTPException.Unauthorized(
        'User not authenticated',
        'USER_NOT_AUTHENTICATED',
      );
    }

    // Admin bypass
    if (user.role === 'MASTER' || user.role === 'ADMINISTRATOR') {
      return;
    }

    // Check user permission (implement based on your permission model)
    const hasPermission = await checkPermission(user.sub, requiredPermission);

    if (!hasPermission) {
      throw HTTPException.Forbidden(
        `Permission denied. Required: ${requiredPermission}`,
        'INSUFFICIENT_PERMISSIONS',
      );
    }
  };
}
```

**Rate Limit Middleware:**
```typescript
import type { FastifyRequest } from 'fastify';

import HTTPException from '@application/core/exception.core';

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  keyFn?: (request: FastifyRequest) => string;
}

const store = new Map<string, { count: number; resetAt: number }>();

export function RateLimitMiddleware(options: RateLimitOptions) {
  const { maxRequests, windowMs } = options;

  return async function (request: FastifyRequest): Promise<void> {
    let key: string;
    if (options.keyFn) {
      key = options.keyFn(request);
    } else {
      key = request.ip;
    }

    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    entry.count += 1;

    if (entry.count > maxRequests) {
      throw HTTPException.TooManyRequests(
        'Too many requests',
        'RATE_LIMIT_EXCEEDED',
      );
    }
  };
}
```

**Logging Middleware:**
```typescript
import type { FastifyReply, FastifyRequest } from 'fastify';

interface LogOptions {
  logBody?: boolean;
  logHeaders?: boolean;
}

export function LoggingMiddleware(options: LogOptions = {}) {
  return async function (
    request: FastifyRequest,
    _reply: FastifyReply,
  ): Promise<void> {
    const start = Date.now();
    const logData: Record<string, unknown> = {
      method: request.method,
      url: request.url,
      ip: request.ip,
      timestamp: new Date().toISOString(),
    };

    if (options.logHeaders) {
      logData.headers = request.headers;
    }

    if (options.logBody && request.body) {
      logData.body = request.body;
    }

    request.log.info(logData, 'Incoming request');
  };
}
```

### Express Middleware

**Authentication Middleware:**
```typescript
import type { Request, Response, NextFunction } from 'express';

interface AuthOptions {
  optional?: boolean;
}

export function AuthenticationMiddleware(
  options: AuthOptions = { optional: false },
) {
  return async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const token = req.cookies?.accessToken
        || req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        if (options.optional) return next();
        res.status(401).json({
          message: 'Authentication required',
          code: 401,
          cause: 'AUTHENTICATION_REQUIRED',
        });
        return;
      }

      const decoded = verifyToken(token); // implement with your JWT lib

      if (!decoded) {
        if (options.optional) return next();
        res.status(401).json({
          message: 'Invalid token',
          code: 401,
          cause: 'INVALID_TOKEN',
        });
        return;
      }

      req.user = decoded;
      next();
    } catch (error) {
      if (options.optional) return next();
      res.status(401).json({
        message: 'Authentication required',
        code: 401,
        cause: 'AUTHENTICATION_REQUIRED',
      });
    }
  };
}
```

**Error Handler Middleware:**
```typescript
import type { Request, Response, NextFunction } from 'express';

export function ErrorHandlerMiddleware() {
  return function (
    error: Error & { code?: number; cause?: string },
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): void {
    const statusCode = error.code || 500;
    const message = error.message || 'Internal server error';
    const cause = error.cause || 'INTERNAL_ERROR';

    if (statusCode >= 500) {
      console.error('Unhandled error:', error);
    }

    res.status(statusCode).json({ message, code: statusCode, cause });
  };
}
```

### NestJS Guard

```typescript
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    );

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.accessToken
      || request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    const decoded = await this.validateToken(token);

    if (!decoded) {
      throw new UnauthorizedException('Invalid token');
    }

    request.user = decoded;
    return true;
  }

  private async validateToken(token: string): Promise<unknown> {
    // Implement token validation
    return null;
  }
}
```

### Hono Middleware

```typescript
import { createMiddleware } from 'hono/factory';
import type { Context, Next } from 'hono';

interface AuthOptions {
  optional?: boolean;
}

export function authMiddleware(options: AuthOptions = { optional: false }) {
  return createMiddleware(async (c: Context, next: Next) => {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')
      || getCookie(c, 'accessToken');

    if (!token) {
      if (options.optional) return next();
      return c.json(
        { message: 'Authentication required', cause: 'AUTHENTICATION_REQUIRED' },
        401,
      );
    }

    const decoded = await verifyToken(token);

    if (!decoded) {
      if (options.optional) return next();
      return c.json({ message: 'Invalid token', cause: 'INVALID_TOKEN' }, 401);
    }

    c.set('user', decoded);
    await next();
  });
}
```

### Elysia/Bun Middleware

```typescript
import { Elysia } from 'elysia';

export function authMiddleware(options: { optional?: boolean } = {}) {
  return new Elysia({ name: 'auth-middleware' }).derive(
    async ({ cookie, headers, set }) => {
      const token = cookie.accessToken?.value
        || headers.authorization?.replace('Bearer ', '');

      if (!token) {
        if (options.optional) return { user: null };
        set.status = 401;
        throw new Error('Authentication required');
      }

      const decoded = await verifyToken(token);

      if (!decoded) {
        if (options.optional) return { user: null };
        set.status = 401;
        throw new Error('Invalid token');
      }

      return { user: decoded };
    },
  );
}
```

### AdonisJS v6/v7 (Middleware)

**Named Middleware:**
```typescript
// app/middleware/auth_middleware.ts
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AuthMiddleware {
  async handle({ request, response, auth }: HttpContext, next: NextFn) {
    try {
      await auth.authenticate()
    } catch {
      return response.unauthorized({ message: 'Nao autenticado', code: 401, cause: 'UNAUTHORIZED' })
    }

    return next()
  }
}
```

**Role-Based Middleware:**
```typescript
// app/middleware/role_middleware.ts
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class RoleMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn, options: { roles: string[] }) {
    const user = auth.getUserOrFail()

    if (!options.roles.includes(user.role)) {
      return response.forbidden({ message: 'Sem permissao', code: 403, cause: 'FORBIDDEN' })
    }

    return next()
  }
}
```

**Registration (start/kernel.ts):**
```typescript
// AdonisJS v6
import router from '@adonisjs/core/services/router'

router.named({
  auth: () => import('#middleware/auth_middleware'),
  role: () => import('#middleware/role_middleware'),
})
```

```typescript
// AdonisJS v7
import { defineConfig } from '@adonisjs/core/http'

export default defineConfig({
  middleware: {
    named: {
      auth: () => import('#middleware/auth_middleware'),
      role: () => import('#middleware/role_middleware'),
    },
  },
})
```

**Usage in routes:**
```typescript
router.group(() => {
  router.get('/admin', [AdminController, 'index'])
}).middleware([
  middleware.auth(),
  middleware.role({ roles: ['MASTER', 'ADMINISTRATOR'] }),
])
```

## Usage in Controllers

### Fastify (with fastify-decorators)
```typescript
@POST({
  url: '/resource',
  options: {
    onRequest: [
      AuthenticationMiddleware({ optional: false }),
      AccessControlMiddleware({ requiredPermission: 'CREATE_RESOURCE' }),
    ],
  },
})
async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
  // request.user is available here
}
```

### Express
```typescript
router.post(
  '/resource',
  AuthenticationMiddleware({ optional: false }),
  async (req: Request, res: Response) => {
    // req.user is available here
  },
);
```

### NestJS
```typescript
@Controller('resource')
@UseGuards(AuthGuard)
export class ResourceController {
  @Post()
  @RequirePermissions('CREATE_RESOURCE')
  @UseGuards(PermissionGuard)
  async create(@Body() dto: CreateResourceDto) {
    // ...
  }
}
```

## Advanced Templates

### Resource Access Middleware

Fetches a resource by route param, checks its visibility level, and enforces granular permissions before injecting the resource into the request.

**Fastify Implementation:**
```typescript
import type { FastifyRequest } from 'fastify';

type VisibilityLevel = 'PUBLIC' | 'RESTRICTED' | 'PRIVATE' | 'OPEN' | 'FORM';

interface ResourceDocument {
  _id: string;
  visibility: VisibilityLevel;
  ownerId?: string;
  [key: string]: unknown;
}

interface ResourceAccessOptions {
  requiredPermission: string;
  model: {
    findByParam(paramValue: string): Promise<ResourceDocument | null>;
  };
  paramName?: string;
}

export function ResourceAccessMiddleware(options: ResourceAccessOptions) {
  const { requiredPermission, model } = options;
  let paramName: string;
  if (options.paramName) {
    paramName = options.paramName;
  } else {
    paramName = 'resourceId';
  }

  return async function (request: FastifyRequest): Promise<void> {
    const params: Record<string, string> = request.params;
    const paramValue = params[paramName];

    if (!paramValue) {
      throw HTTPException.BadRequest(
        `Missing route parameter: ${paramName}`,
        'MISSING_ROUTE_PARAM',
      );
    }

    const resource = await model.findByParam(paramValue);

    if (!resource) {
      throw HTTPException.NotFound(
        'Resource not found',
        'RESOURCE_NOT_FOUND',
      );
    }

    const visibility = resource.visibility;

    if (visibility === 'PUBLIC') {
      if (request.method === 'GET' || request.method === 'HEAD') {
        request.resource = resource;
        return;
      }
    }

    if (visibility === 'FORM') {
      if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
        request.resource = resource;
        return;
      }
    }

    if (visibility === 'OPEN') {
      request.resource = resource;
      return;
    }

    // RESTRICTED and PRIVATE require authentication
    const user = request.user;

    if (!user) {
      throw HTTPException.Unauthorized(
        'Authentication required to access this resource',
        'AUTHENTICATION_REQUIRED',
      );
    }

    if (visibility === 'PRIVATE') {
      const isOwner = resource.ownerId === user.sub;
      const isAdmin = user.role === 'MASTER' || user.role === 'ADMINISTRATOR';

      if (!isOwner && !isAdmin) {
        throw HTTPException.Forbidden(
          'Access denied. This resource is private.',
          'PRIVATE_RESOURCE_ACCESS_DENIED',
        );
      }

      request.resource = resource;
      return;
    }

    if (visibility === 'RESTRICTED') {
      const isAdmin = user.role === 'MASTER' || user.role === 'ADMINISTRATOR';

      if (isAdmin) {
        request.resource = resource;
        return;
      }

      const hasPermission = await checkPermission(user.sub, requiredPermission);

      if (!hasPermission) {
        throw HTTPException.Forbidden(
          `Permission denied. Required: ${requiredPermission}`,
          'INSUFFICIENT_PERMISSIONS',
        );
      }

      request.resource = resource;
      return;
    }

    // Fallback: deny access for unknown visibility levels
    throw HTTPException.Forbidden(
      'Access denied',
      'ACCESS_DENIED',
    );
  };
}
```

**Express Implementation:**
```typescript
import type { Request, Response, NextFunction } from 'express';

type VisibilityLevel = 'PUBLIC' | 'RESTRICTED' | 'PRIVATE' | 'OPEN' | 'FORM';

interface ResourceDocument {
  _id: string;
  visibility: VisibilityLevel;
  ownerId?: string;
  [key: string]: unknown;
}

interface ResourceAccessOptions {
  requiredPermission: string;
  model: {
    findByParam(paramValue: string): Promise<ResourceDocument | null>;
  };
  paramName?: string;
}

export function ResourceAccessMiddleware(options: ResourceAccessOptions) {
  const { requiredPermission, model } = options;
  let paramName: string;
  if (options.paramName) {
    paramName = options.paramName;
  } else {
    paramName = 'resourceId';
  }

  return async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const paramValue = req.params[paramName];

    if (!paramValue) {
      res.status(400).json({
        message: `Missing route parameter: ${paramName}`,
        code: 400,
        cause: 'MISSING_ROUTE_PARAM',
      });
      return;
    }

    const resource = await model.findByParam(paramValue);

    if (!resource) {
      res.status(404).json({
        message: 'Resource not found',
        code: 404,
        cause: 'RESOURCE_NOT_FOUND',
      });
      return;
    }

    const visibility = resource.visibility;

    if (visibility === 'PUBLIC') {
      if (req.method === 'GET' || req.method === 'HEAD') {
        req.resource = resource;
        return next();
      }
    }

    if (visibility === 'FORM') {
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        req.resource = resource;
        return next();
      }
    }

    if (visibility === 'OPEN') {
      req.resource = resource;
      return next();
    }

    const user = req.user;

    if (!user) {
      res.status(401).json({
        message: 'Authentication required to access this resource',
        code: 401,
        cause: 'AUTHENTICATION_REQUIRED',
      });
      return;
    }

    if (visibility === 'PRIVATE') {
      const isOwner = resource.ownerId === user.sub;
      const isAdmin = user.role === 'MASTER' || user.role === 'ADMINISTRATOR';

      if (!isOwner && !isAdmin) {
        res.status(403).json({
          message: 'Access denied. This resource is private.',
          code: 403,
          cause: 'PRIVATE_RESOURCE_ACCESS_DENIED',
        });
        return;
      }

      req.resource = resource;
      return next();
    }

    if (visibility === 'RESTRICTED') {
      const isAdmin = user.role === 'MASTER' || user.role === 'ADMINISTRATOR';

      if (isAdmin) {
        req.resource = resource;
        return next();
      }

      const hasPermission = await checkPermission(user.sub, requiredPermission);

      if (!hasPermission) {
        res.status(403).json({
          message: `Permission denied. Required: ${requiredPermission}`,
          code: 403,
          cause: 'INSUFFICIENT_PERMISSIONS',
        });
        return;
      }

      req.resource = resource;
      return next();
    }

    res.status(403).json({
      message: 'Access denied',
      code: 403,
      cause: 'ACCESS_DENIED',
    });
  };
}
```

### Optional Authentication Middleware

Single middleware with a boolean flag that controls whether authentication is required or optional. When optional, missing/invalid tokens allow the request to continue without a user context.

**Fastify Implementation:**
```typescript
import type { FastifyRequest } from 'fastify';

interface AuthOptions {
  optional: boolean;
}

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  type: string;
}

export function AuthMiddleware(options: AuthOptions) {
  return async function (request: FastifyRequest): Promise<void> {
    const token = extractToken(request);

    if (!token) {
      if (options.optional) {
        request.user = null;
        return;
      }

      throw HTTPException.Unauthorized(
        'Authentication required',
        'AUTHENTICATION_REQUIRED',
      );
    }

    let decoded: TokenPayload | null;

    try {
      decoded = await verifyToken(token);
    } catch (error) {
      if (options.optional) {
        request.user = null;
        return;
      }

      throw HTTPException.Unauthorized(
        'Invalid or expired token',
        'INVALID_TOKEN',
      );
    }

    if (!decoded) {
      if (options.optional) {
        request.user = null;
        return;
      }

      throw HTTPException.Unauthorized(
        'Invalid or expired token',
        'INVALID_TOKEN',
      );
    }

    request.user = {
      sub: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      type: decoded.type,
    };
  };
}

function extractToken(request: FastifyRequest): string | null {
  const cookieToken = request.cookies?.accessToken;

  if (cookieToken) {
    return String(cookieToken);
  }

  const authHeader = request.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
}
```

**Express Implementation:**
```typescript
import type { Request, Response, NextFunction } from 'express';

interface AuthOptions {
  optional: boolean;
}

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  type: string;
}

export function AuthMiddleware(options: AuthOptions) {
  return async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const token = extractToken(req);

    if (!token) {
      if (options.optional) {
        req.user = null;
        return next();
      }

      res.status(401).json({
        message: 'Authentication required',
        code: 401,
        cause: 'AUTHENTICATION_REQUIRED',
      });
      return;
    }

    let decoded: TokenPayload | null;

    try {
      decoded = await verifyToken(token);
    } catch (error) {
      if (options.optional) {
        req.user = null;
        return next();
      }

      res.status(401).json({
        message: 'Invalid or expired token',
        code: 401,
        cause: 'INVALID_TOKEN',
      });
      return;
    }

    if (!decoded) {
      if (options.optional) {
        req.user = null;
        return next();
      }

      res.status(401).json({
        message: 'Invalid or expired token',
        code: 401,
        cause: 'INVALID_TOKEN',
      });
      return;
    }

    req.user = {
      sub: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      type: decoded.type,
    };
    next();
  };
}

function extractToken(req: Request): string | null {
  const cookieToken = req.cookies?.accessToken;

  if (cookieToken) {
    return String(cookieToken);
  }

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
}
```

### Permission Matrix Middleware

Defines a permission matrix mapping actions to required permissions, then checks if the user has ALL required permissions for the requested action. Includes admin/master role bypass.

**Fastify Implementation:**
```typescript
import type { FastifyRequest } from 'fastify';

type PermissionMatrix = Record<string, Array<string>>;

interface PermissionOptions {
  action: string;
}

const PERMISSION_MATRIX: PermissionMatrix = {
  'create': ['RESOURCE_CREATE'],
  'read': ['RESOURCE_READ'],
  'update': ['RESOURCE_UPDATE'],
  'delete': ['RESOURCE_DELETE'],
  'manage': ['RESOURCE_CREATE', 'RESOURCE_UPDATE', 'RESOURCE_DELETE'],
  'admin': ['RESOURCE_CREATE', 'RESOURCE_READ', 'RESOURCE_UPDATE', 'RESOURCE_DELETE', 'RESOURCE_ADMIN'],
};

export function PermissionMiddleware(options: PermissionOptions) {
  const { action } = options;

  return async function (request: FastifyRequest): Promise<void> {
    const user = request.user;

    if (!user) {
      throw HTTPException.Unauthorized(
        'Authentication required',
        'AUTHENTICATION_REQUIRED',
      );
    }

    // Admin/master bypass
    if (user.role === 'MASTER' || user.role === 'ADMINISTRATOR') {
      return;
    }

    const requiredPermissions = PERMISSION_MATRIX[action];

    if (!requiredPermissions) {
      throw HTTPException.Forbidden(
        `Unknown action: ${action}`,
        'UNKNOWN_ACTION',
      );
    }

    const userPermissions = await getUserPermissions(user.sub);
    const missingPermissions: Array<string> = [];

    for (const permission of requiredPermissions) {
      if (!userPermissions.includes(permission)) {
        missingPermissions.push(permission);
      }
    }

    if (missingPermissions.length > 0) {
      throw HTTPException.Forbidden(
        `Missing permissions: ${missingPermissions.join(', ')}`,
        'INSUFFICIENT_PERMISSIONS',
      );
    }
  };
}

async function getUserPermissions(userId: string): Promise<Array<string>> {
  // Implement: fetch user permissions from database or cache
  return [];
}
```

**Express Implementation:**
```typescript
import type { Request, Response, NextFunction } from 'express';

type PermissionMatrix = Record<string, Array<string>>;

interface PermissionOptions {
  action: string;
}

const PERMISSION_MATRIX: PermissionMatrix = {
  'create': ['RESOURCE_CREATE'],
  'read': ['RESOURCE_READ'],
  'update': ['RESOURCE_UPDATE'],
  'delete': ['RESOURCE_DELETE'],
  'manage': ['RESOURCE_CREATE', 'RESOURCE_UPDATE', 'RESOURCE_DELETE'],
  'admin': ['RESOURCE_CREATE', 'RESOURCE_READ', 'RESOURCE_UPDATE', 'RESOURCE_DELETE', 'RESOURCE_ADMIN'],
};

export function PermissionMiddleware(options: PermissionOptions) {
  const { action } = options;

  return async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        message: 'Authentication required',
        code: 401,
        cause: 'AUTHENTICATION_REQUIRED',
      });
      return;
    }

    // Admin/master bypass
    if (user.role === 'MASTER' || user.role === 'ADMINISTRATOR') {
      return next();
    }

    const requiredPermissions = PERMISSION_MATRIX[action];

    if (!requiredPermissions) {
      res.status(403).json({
        message: `Unknown action: ${action}`,
        code: 403,
        cause: 'UNKNOWN_ACTION',
      });
      return;
    }

    const userPermissions = await getUserPermissions(user.sub);
    const missingPermissions: Array<string> = [];

    for (const permission of requiredPermissions) {
      if (!userPermissions.includes(permission)) {
        missingPermissions.push(permission);
      }
    }

    if (missingPermissions.length > 0) {
      res.status(403).json({
        message: `Missing permissions: ${missingPermissions.join(', ')}`,
        code: 403,
        cause: 'INSUFFICIENT_PERMISSIONS',
      });
      return;
    }

    next();
  };
}

async function getUserPermissions(userId: string): Promise<Array<string>> {
  // Implement: fetch user permissions from database or cache
  return [];
}
```

## Checklist

Before delivering any middleware, verify:

- [ ] **Factory pattern**: middleware is a named factory function returning the handler, not a bare function
- [ ] **Named exports only**: no `export default`, use `export function`
- [ ] **No ternary operators**: all conditionals use if/else blocks
- [ ] **TypeScript**: options interface is explicitly typed, return types are annotated
- [ ] **Single responsibility**: middleware handles one concern (auth, access, rate limit, etc.)
- [ ] **Request augmentation typed**: any properties added to `request`/`req` (e.g., `user`, `resource`) are typed via interface merging or generics
- [ ] **Error responses use framework conventions**: Fastify throws HTTPException, Express sends `res.status().json()`, NestJS throws HttpException subclasses
- [ ] **Visibility levels handled**: if resource access is involved, all five levels (PUBLIC, RESTRICTED, PRIVATE, OPEN, FORM) are addressed
- [ ] **Admin bypass**: MASTER/ADMINISTRATOR roles skip permission checks where appropriate
- [ ] **Optional auth pattern**: uses a single middleware with `optional` boolean flag, not two separate middlewares
- [ ] **Permission matrix**: action-to-permissions mapping is a typed `Record`, not inline conditionals
- [ ] **Missing permissions reported**: 403 responses list which specific permissions are missing
- [ ] **Consistent error codes**: every error response includes both a human message and a machine-readable cause code
- [ ] **File naming**: follows `{purpose}.middleware.ts` convention
- [ ] **File placement**: middleware is placed in the detected middleware directory (e.g., `application/middlewares/`, `src/middlewares/`)
