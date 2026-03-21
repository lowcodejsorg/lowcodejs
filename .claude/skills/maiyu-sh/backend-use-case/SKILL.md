---
name: backend-use-case
description: |
  Generates use-case/business logic code for backend Node.js projects.
  Use when: user asks to create use-cases, business logic, application logic,
  domain operations, or mentions "use-case" or "use case".
  Follows Either pattern for error handling.
  Frameworks: Fastify, Express, NestJS, AdonisJS, Hono, Elysia/Bun.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **DI**: `fastify-decorators` | `tsyringe` | `inversify` | `@nestjs/common` | `awilix` | manual
   - **Framework**: `fastify` | `express` | `@nestjs/core` | `@adonisjs/core` | `hono` | `elysia`
   - **Error handling**: scan for `Either`/`Result` pattern or try/catch convention
3. Scan existing use-cases to detect:
   - Location (e.g., `application/resources/{entity}/{action}/`)
   - Error handling style (Either, neverthrow Result, plain throw)
   - Import patterns
4. If error handling pattern not detected, default to Either pattern

## Conventions

### Naming
- File: `{action}.use-case.ts` (e.g., `create.use-case.ts`)
- Class: `{Entity}{Action}UseCase` (e.g., `UserCreateUseCase`)
- Type aliases: `type Response = Either<HTTPException, I{Entity}>`
- Type aliases: `type Payload = {Entity}{Action}Payload`

### File Placement
- Feature-based: `resources/{entity}/{action}/{action}.use-case.ts`

### Rules
- DI decorator on class (`@Service()`, `@Injectable()`, etc.)
- Dependencies injected via constructor (contracts only, never implementations)
- Returns `Either<HTTPException, SuccessType>` — NEVER throws
- Outer try/catch wraps entire execute() returning InternalServerError on unexpected errors
- No ternary operators — use if/else
- Validate inputs at the start, fail fast with `left()`
- One use-case per action (Single Responsibility)

## Templates

### Create Use-Case

```typescript
import { Service } from 'fastify-decorators';
import { type Either, left, right } from '@application/core/either.core';
import { HTTPException } from '@application/core/exception.core';
import type { I{Entity} } from '@application/core/entity.core';
import {
  {Entity}ContractRepository,
  type {Entity}CreatePayload,
} from '@application/repositories/{entity}/{entity}-contract.repository';

type Payload = {Entity}CreatePayload;
type Response = Either<HTTPException, I{Entity}>;

@Service()
export default class {Entity}CreateUseCase {
  constructor(
    private readonly {entity}Repository: {Entity}ContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      // Validate unique constraints
      const existing = await this.{entity}Repository.findBy({
        email: payload.email,
        exact: true,
      });

      if (existing) {
        return left(
          HTTPException.Conflict(
            '{Entity} already exists',
            '{ENTITY}_ALREADY_EXISTS',
          ),
        );
      }

      // Execute business logic
      const created = await this.{entity}Repository.create(payload);

      return right(created);
    } catch (_error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'CREATE_{ENTITY}_ERROR',
        ),
      );
    }
  }
}
```

### Show (Find By ID) Use-Case

```typescript
import { Service } from 'fastify-decorators';
import { type Either, left, right } from '@application/core/either.core';
import { HTTPException } from '@application/core/exception.core';
import type { I{Entity} } from '@application/core/entity.core';
import { {Entity}ContractRepository } from '@application/repositories/{entity}/{entity}-contract.repository';

type Payload = { _id: string };
type Response = Either<HTTPException, I{Entity}>;

@Service()
export default class {Entity}ShowUseCase {
  constructor(
    private readonly {entity}Repository: {Entity}ContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const entity = await this.{entity}Repository.findBy({
        _id: payload._id,
        exact: true,
      });

      if (!entity) {
        return left(
          HTTPException.NotFound(
            '{Entity} not found',
            '{ENTITY}_NOT_FOUND',
          ),
        );
      }

      return right(entity);
    } catch (_error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'SHOW_{ENTITY}_ERROR',
        ),
      );
    }
  }
}
```

### Paginated (List) Use-Case

```typescript
import { Service } from 'fastify-decorators';
import { type Either, left, right } from '@application/core/either.core';
import { HTTPException } from '@application/core/exception.core';
import type { I{Entity}, IMeta } from '@application/core/entity.core';
import { {Entity}ContractRepository } from '@application/repositories/{entity}/{entity}-contract.repository';

type Payload = {
  page: number;
  perPage: number;
  search?: string;
  sort?: Record<string, 'asc' | 'desc'>;
};

type Response = Either<HTTPException, { meta: IMeta; data: I{Entity}[] }>;

@Service()
export default class {Entity}PaginatedUseCase {
  constructor(
    private readonly {entity}Repository: {Entity}ContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const data = await this.{entity}Repository.findMany(payload);
      const total = await this.{entity}Repository.count(payload);

      const lastPage = Math.ceil(total / payload.perPage);
      const meta: IMeta = {
        total,
        perPage: payload.perPage,
        page: payload.page,
        lastPage,
        firstPage: total > 0 ? 1 : 0,
      };

      return right({ meta, data });
    } catch (_error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'LIST_{ENTITY}_PAGINATED_ERROR',
        ),
      );
    }
  }
}
```

### Update Use-Case

```typescript
import { Service } from 'fastify-decorators';
import { type Either, left, right } from '@application/core/either.core';
import { HTTPException } from '@application/core/exception.core';
import type { I{Entity} } from '@application/core/entity.core';
import {
  {Entity}ContractRepository,
  type {Entity}UpdatePayload,
} from '@application/repositories/{entity}/{entity}-contract.repository';

type Payload = {Entity}UpdatePayload;
type Response = Either<HTTPException, I{Entity}>;

@Service()
export default class {Entity}UpdateUseCase {
  constructor(
    private readonly {entity}Repository: {Entity}ContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const existing = await this.{entity}Repository.findBy({
        _id: payload._id,
        exact: true,
      });

      if (!existing) {
        return left(
          HTTPException.NotFound(
            '{Entity} not found',
            '{ENTITY}_NOT_FOUND',
          ),
        );
      }

      const updated = await this.{entity}Repository.update(payload);

      return right(updated);
    } catch (_error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'UPDATE_{ENTITY}_ERROR',
        ),
      );
    }
  }
}
```

### Delete (Soft Delete) Use-Case

```typescript
import { Service } from 'fastify-decorators';
import { type Either, left, right } from '@application/core/either.core';
import { HTTPException } from '@application/core/exception.core';
import { {Entity}ContractRepository } from '@application/repositories/{entity}/{entity}-contract.repository';

type Payload = { _id: string };
type Response = Either<HTTPException, void>;

@Service()
export default class {Entity}DeleteUseCase {
  constructor(
    private readonly {entity}Repository: {Entity}ContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const existing = await this.{entity}Repository.findBy({
        _id: payload._id,
        exact: true,
      });

      if (!existing) {
        return left(
          HTTPException.NotFound(
            '{Entity} not found',
            '{ENTITY}_NOT_FOUND',
          ),
        );
      }

      await this.{entity}Repository.delete(payload._id);

      return right(undefined);
    } catch (_error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'DELETE_{ENTITY}_ERROR',
        ),
      );
    }
  }
}
```

### Send to Trash / Remove from Trash Use-Cases

```typescript
// send-to-trash.use-case.ts
@Service()
export default class {Entity}SendToTrashUseCase {
  constructor(
    private readonly {entity}Repository: {Entity}ContractRepository,
  ) {}

  async execute(payload: { _id: string }): Promise<Either<HTTPException, I{Entity}>> {
    try {
      const existing = await this.{entity}Repository.findBy({
        _id: payload._id,
        exact: true,
      });

      if (!existing) {
        return left(HTTPException.NotFound('{Entity} not found', '{ENTITY}_NOT_FOUND'));
      }

      const updated = await this.{entity}Repository.update({
        _id: payload._id,
        trashed: true,
        trashedAt: new Date(),
      });

      return right(updated);
    } catch (_error) {
      return left(
        HTTPException.InternalServerError('Internal server error', 'SEND_TO_TRASH_{ENTITY}_ERROR'),
      );
    }
  }
}

// remove-from-trash.use-case.ts
@Service()
export default class {Entity}RemoveFromTrashUseCase {
  constructor(
    private readonly {entity}Repository: {Entity}ContractRepository,
  ) {}

  async execute(payload: { _id: string }): Promise<Either<HTTPException, I{Entity}>> {
    try {
      const existing = await this.{entity}Repository.findBy({
        _id: payload._id,
        exact: true,
      });

      if (!existing) {
        return left(HTTPException.NotFound('{Entity} not found', '{ENTITY}_NOT_FOUND'));
      }

      const updated = await this.{entity}Repository.update({
        _id: payload._id,
        trashed: false,
        trashedAt: null,
      });

      return right(updated);
    } catch (_error) {
      return left(
        HTTPException.InternalServerError('Internal server error', 'REMOVE_FROM_TRASH_{ENTITY}_ERROR'),
      );
    }
  }
}
```

## Error Handling Variants

### Either Pattern (Reference — recommended)

```typescript
import { type Either, left, right } from '@application/core/either.core';
type Response = Either<HTTPException, I{Entity}>;
// return left(HTTPException.BadRequest(...))
// return right(entity)
```

### neverthrow Result Pattern

```typescript
import { ok, err, type Result } from 'neverthrow';
type Response = Result<I{Entity}, HTTPException>;
// return err(HTTPException.BadRequest(...))
// return ok(entity)
```

### Plain throw (NestJS style)

```typescript
import { BadRequestException, ConflictException } from '@nestjs/common';
// throw new ConflictException('{Entity} already exists');
// return entity;
```

## DI Decorator Variants

| DI Library | Decorator |
|------------|-----------|
| fastify-decorators | `@Service()` |
| tsyringe | `@injectable()` |
| inversify | `@injectable()` |
| NestJS | `@Injectable()` |
| awilix | No decorator (registered in container) |
| manual | No decorator (instantiated manually) |
