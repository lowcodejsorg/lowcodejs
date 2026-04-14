---
name: maiyu:backend-error-handling
description: |
  Generates error handling systems for backend Node.js projects.
  Use when: user asks to create error handling, Either pattern, HTTPException,
  error classes, or mentions "error", "exception", "Either" for error management.
  Supports: Either monad, HTTP exception hierarchy, unified error handler.
  Frameworks: Fastify, Express, NestJS, Hono, Elysia.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating, detect:

1. Find `package.json` to detect framework
2. Check for existing error handling patterns (`core/either.core.ts`, `core/exception.core.ts`)
3. Detect validation library: `zod` | `class-validator` | `joi`

## Components

A complete error handling system consists of:

| Component | File | Purpose |
|-----------|------|---------|
| Either monad | `core/either.core.ts` | Type-safe success/error returns |
| HTTPException | `core/exception.core.ts` | HTTP error factory |
| Error handler | `start/kernel.ts` (or global handler) | Unified error formatting |

## Templates

### Either Monad (Reference Implementation)

```typescript
// core/either.core.ts

// ERROR
export class Left<L, R> {
  readonly value: L;

  constructor(value: L) {
    this.value = value;
  }

  isRight(): this is Right<L, R> {
    return false;
  }

  isLeft(): this is Left<L, R> {
    return true;
  }
}

// SUCCESS
export class Right<L, R> {
  readonly value: R;

  constructor(value: R) {
    this.value = value;
  }

  isRight(): this is Right<L, R> {
    return true;
  }

  isLeft(): this is Left<L, R> {
    return false;
  }
}

export type Either<L, R> = Left<L, R> | Right<L, R>;

export const left = <L, R>(value: L): Either<L, R> => {
  return new Left(value);
};

export const right = <L, R>(value: R): Either<L, R> => {
  return new Right(value);
};
```

### HTTPException Factory (Reference Implementation)

```typescript
// core/exception.core.ts

export interface Exception {
  message: string;
  code: number;
  cause: string;
  errors?: Record<string, string>;
}

export default class HTTPException extends Error {
  public readonly code: number;
  public override readonly cause: string;
  public errors?: Record<string, string>;

  protected constructor(payload: Exception) {
    super(payload.message);
    this.cause = payload.cause;
    this.code = payload.code;
    if (payload.errors) {
      this.errors = payload.errors;
    }
  }

  // 4xx Client Errors
  static BadRequest(
    message = 'Bad Request',
    cause = 'INVALID_PARAMETERS',
    errors?: Record<string, string>,
  ): HTTPException {
    return new HTTPException({ message, code: 400, cause, errors });
  }

  static Unauthorized(
    message = 'Unauthorized',
    cause = 'AUTHENTICATION_REQUIRED',
  ): HTTPException {
    return new HTTPException({ message, code: 401, cause });
  }

  static Forbidden(
    message = 'Forbidden',
    cause = 'ACCESS_DENIED',
  ): HTTPException {
    return new HTTPException({ message, code: 403, cause });
  }

  static NotFound(
    message = 'Not Found',
    cause = 'RESOURCE_NOT_FOUND',
  ): HTTPException {
    return new HTTPException({ message, code: 404, cause });
  }

  static Conflict(
    message = 'Conflict',
    cause = 'RESOURCE_CONFLICT',
  ): HTTPException {
    return new HTTPException({ message, code: 409, cause });
  }

  static UnprocessableEntity(
    message = 'Unprocessable Entity',
    cause = 'VALIDATION_ERROR',
    errors?: Record<string, string>,
  ): HTTPException {
    return new HTTPException({ message, code: 422, cause, errors });
  }

  static TooManyRequests(
    message = 'Too Many Requests',
    cause = 'RATE_LIMIT_EXCEEDED',
  ): HTTPException {
    return new HTTPException({ message, code: 429, cause });
  }

  // 5xx Server Errors
  static InternalServerError(
    message = 'Internal Server Error',
    cause = 'INTERNAL_ERROR',
  ): HTTPException {
    return new HTTPException({ message, code: 500, cause });
  }

  static ServiceUnavailable(
    message = 'Service Unavailable',
    cause = 'SERVICE_UNAVAILABLE',
  ): HTTPException {
    return new HTTPException({ message, code: 503, cause });
  }
}
```

### Fastify Error Handler

```typescript
import { ZodError } from 'zod';
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

import HTTPException from '@application/core/exception.core';

export function setupErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler(
    (error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
      // 1. HTTPException (our custom errors)
      if (error instanceof HTTPException) {
        return reply.status(error.code).send({
          message: error.message,
          code: error.code,
          cause: error.cause,
          errors: error.errors,
        });
      }

      // 2. ZodError (validation errors)
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of error.issues) {
          const key = issue.path.join('.');
          fieldErrors[key] = issue.message;
        }
        return reply.status(400).send({
          message: 'Validation error',
          code: 400,
          cause: 'INVALID_PAYLOAD_FORMAT',
          errors: fieldErrors,
        });
      }

      // 3. Fastify validation error (AJV/schema)
      if ('validation' in error && error.validation) {
        return reply.status(400).send({
          message: error.message,
          code: 400,
          cause: 'SCHEMA_VALIDATION_ERROR',
        });
      }

      // 4. Unknown errors
      request.log.error(error);
      return reply.status(500).send({
        message: 'Internal server error',
        code: 500,
        cause: 'INTERNAL_ERROR',
      });
    },
  );
}
```

### Express Error Handler

```typescript
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import HTTPException from '@application/core/exception.core';

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof HTTPException) {
    res.status(error.code).json({
      message: error.message,
      code: error.code,
      cause: error.cause,
      errors: error.errors,
    });
    return;
  }

  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of error.issues) {
      fieldErrors[issue.path.join('.')] = issue.message;
    }
    res.status(400).json({
      message: 'Validation error',
      code: 400,
      cause: 'INVALID_PAYLOAD_FORMAT',
      errors: fieldErrors,
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    message: 'Internal server error',
    code: 500,
    cause: 'INTERNAL_ERROR',
  });
}
```

### Usage in Use Cases

```typescript
import { type Either, left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';

async execute(payload: CreatePayload): Promise<Either<HTTPException, IEntity>> {
  const existing = await this.repository.findByEmail(payload.email);

  if (existing) {
    return left(
      HTTPException.Conflict('Entity already exists', 'ENTITY_ALREADY_EXISTS'),
    );
  }

  const entity = await this.repository.create(payload);
  return right(entity);
}
```

### Usage in Controllers

```typescript
const result = await this.useCase.execute(body);

if (result.isLeft()) {
  const error = result.value;
  return response.status(error.code).send({
    message: error.message,
    code: error.code,
    cause: error.cause,
  });
}

return response.status(201).send(result.value);
```

## Checklist

- [ ] Either monad with `Left`/`Right` classes
- [ ] `left()` and `right()` factory functions
- [ ] HTTPException with static factory methods for common status codes
- [ ] Error response format: `{ message, code, cause, errors? }`
- [ ] Unified error handler for HTTPException + ZodError + framework errors
- [ ] Use-cases return `Either<HTTPException, T>`
- [ ] No ternary operators — use if/else or early returns
- [ ] No `any` type — use `unknown`, concrete types, generics, or `Record<string, unknown>`
- [ ] No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- [ ] All functions have explicit return types
- [ ] Multiple conditions use const mapper (object lookup) instead of switch/if-else chains
