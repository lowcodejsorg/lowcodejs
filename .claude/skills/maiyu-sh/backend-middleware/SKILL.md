---
name: backend-middleware
description: |
  Generates middleware/hook functions for backend Node.js projects.
  Use when: user asks to create middleware, guard, interceptor, hook,
  or mentions "middleware" for request pipeline processing.
  Supports: Fastify hooks, Express middleware, NestJS guards/interceptors, Hono middleware, Elysia derive/onBeforeHandle.
  Frameworks: Fastify, Express, NestJS, AdonisJS, Hono, Elysia/Bun.
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
- No ternary operators — use if/else
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
