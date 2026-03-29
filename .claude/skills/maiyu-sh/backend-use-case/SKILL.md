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

### Clone/Duplicate Resource Use-Case

```typescript
import { Service } from 'fastify-decorators';
import { type Either, left, right } from '@application/core/either.core';
import { HTTPException } from '@application/core/exception.core';
import type { I{Entity} } from '@application/core/entity.core';
import { {Entity}ContractRepository } from '@application/repositories/{entity}/{entity}-contract.repository';

type Payload = { _id: string };
type Response = Either<HTTPException, I{Entity}>;

@Service()
export class {Entity}CloneUseCase {
  constructor(
    private readonly {entity}Repository: {Entity}ContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const original = await this.{entity}Repository.findBy({
        _id: payload._id,
        exact: true,
      });

      if (!original) {
        return left(
          HTTPException.NotFound(
            '{Entity} not found',
            '{ENTITY}_NOT_FOUND',
          ),
        );
      }

      const timestamp = Date.now();
      const { _id, ...rest } = original;
      const cloneData = {
        ...rest,
        slug: `${original.slug}-copy-${timestamp}`,
        name: `${original.name} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const created = await this.{entity}Repository.create(cloneData);

      // If the entity has children (e.g. fields, items), clone them too
      // Exclude trashed/deleted children from the clone
      // const children = await this.childRepository.findMany({
      //   parentId: original._id,
      //   trashed: false,
      // });
      //
      // for (const child of children) {
      //   const { _id: childId, ...childRest } = child;
      //   await this.childRepository.create({
      //     ...childRest,
      //     parentId: created._id,
      //     createdAt: new Date(),
      //     updatedAt: new Date(),
      //   });
      // }

      return right(created);
    } catch (_error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'CLONE_{ENTITY}_ERROR',
        ),
      );
    }
  }
}
```

### Import Resource Use-Case

```typescript
import { Service } from 'fastify-decorators';
import { type Either, left, right } from '@application/core/either.core';
import { HTTPException } from '@application/core/exception.core';
import { z } from 'zod';

const {Entity}ImportSchema = z.object({
  name: z.string().min(1),
  // Add other required fields here
});

type {Entity}ImportRow = z.infer<typeof {Entity}ImportSchema>;

type Payload = {
  rows: unknown[];
};

type ImportResult = {
  created: number;
  errors: Array<{ index: number; message: string }>;
};

type Response = Either<HTTPException, ImportResult>;

@Service()
export class {Entity}ImportUseCase {
  constructor(
    private readonly {entity}Repository: {Entity}ContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const result: ImportResult = {
        created: 0,
        errors: [],
      };

      for (let i = 0; i < payload.rows.length; i++) {
        const row = payload.rows[i];
        const parsed = {Entity}ImportSchema.safeParse(row);

        if (!parsed.success) {
          result.errors.push({
            index: i,
            message: parsed.error.errors.map((e) => e.message).join(', '),
          });
          continue;
        }

        try {
          await this.{entity}Repository.create(parsed.data);
          result.created++;
        } catch (createError) {
          const message =
            createError instanceof Error
              ? createError.message
              : 'Unknown creation error';
          result.errors.push({ index: i, message });
        }
      }

      return right(result);
    } catch (_error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'IMPORT_{ENTITY}_ERROR',
        ),
      );
    }
  }
}
```

### Export Resource Use-Case

```typescript
import { Service } from 'fastify-decorators';
import { type Either, left, right } from '@application/core/either.core';
import { HTTPException } from '@application/core/exception.core';
import type { I{Entity} } from '@application/core/entity.core';
import { {Entity}ContractRepository } from '@application/repositories/{entity}/{entity}-contract.repository';

type Payload = {
  _id: string;
  format: 'json' | 'csv';
};

type ExportResult = {
  content: string;
  contentType: string;
  filename: string;
};

type Response = Either<HTTPException, ExportResult>;

@Service()
export class {Entity}ExportUseCase {
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

      // Fetch related data if needed
      // const children = await this.childRepository.findMany({
      //   parentId: entity._id,
      //   trashed: false,
      // });

      if (payload.format === 'json') {
        const exportPayload = {
          ...entity,
          exportedAt: new Date().toISOString(),
        };

        return right({
          content: JSON.stringify(exportPayload, null, 2),
          contentType: 'application/json',
          filename: `${entity.slug}-export.json`,
        });
      }

      // CSV serialization
      const fields = Object.keys(entity);
      const header = fields.join(',');
      const values = fields
        .map((field) => {
          const value = (entity as Record<string, unknown>)[field];
          if (value === null || value === undefined) {
            return '';
          }
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(',');

      return right({
        content: `${header}\n${values}`,
        contentType: 'text/csv',
        filename: `${entity.slug}-export.csv`,
      });
    } catch (_error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'EXPORT_{ENTITY}_ERROR',
        ),
      );
    }
  }
}
```

### Bulk Operations Use-Case

```typescript
import { Service } from 'fastify-decorators';
import { type Either, left, right } from '@application/core/either.core';
import { HTTPException } from '@application/core/exception.core';
import { {Entity}ContractRepository } from '@application/repositories/{entity}/{entity}-contract.repository';

type Payload = {
  ids: string[];
  operation: 'trash' | 'delete' | 'restore';
};

type BulkResult = {
  success: number;
  failed: number;
  errors: Array<{ id: string; message: string }>;
};

type Response = Either<HTTPException, BulkResult>;

@Service()
export class {Entity}BulkOperationUseCase {
  constructor(
    private readonly {entity}Repository: {Entity}ContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      if (!payload.ids.length) {
        return left(
          HTTPException.BadRequest(
            'No IDs provided',
            '{ENTITY}_BULK_NO_IDS',
          ),
        );
      }

      const result: BulkResult = {
        success: 0,
        failed: 0,
        errors: [],
      };

      // Validate all entities exist
      for (const id of payload.ids) {
        const existing = await this.{entity}Repository.findBy({
          _id: id,
          exact: true,
        });

        if (!existing) {
          result.failed++;
          result.errors.push({ id, message: '{Entity} not found' });
          continue;
        }

        try {
          if (payload.operation === 'trash') {
            await this.{entity}Repository.update({
              _id: id,
              trashed: true,
              trashedAt: new Date(),
            });
          } else if (payload.operation === 'restore') {
            await this.{entity}Repository.update({
              _id: id,
              trashed: false,
              trashedAt: null,
            });
          } else if (payload.operation === 'delete') {
            await this.{entity}Repository.delete(id);
          }

          result.success++;
        } catch (opError) {
          result.failed++;
          const message =
            opError instanceof Error
              ? opError.message
              : 'Unknown operation error';
          result.errors.push({ id, message });
        }
      }

      return right(result);
    } catch (_error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'BULK_{ENTITY}_ERROR',
        ),
      );
    }
  }
}
```

### Lifecycle Hooks Pattern

```typescript
// lifecycle-hooks.registry.ts

type HookContext<T = unknown> = {
  entity: string;
  action: 'create' | 'update' | 'delete';
  data: T;
};

type HookFn<T = unknown> = (context: HookContext<T>) => Promise<void>;

type HookRegistry = Record<string, Array<HookFn>>;

const beforeSaveHooks: HookRegistry = {};
const afterSaveHooks: HookRegistry = {};

export function registerBeforeSaveHook(entity: string, hook: HookFn): void {
  if (!beforeSaveHooks[entity]) {
    beforeSaveHooks[entity] = [];
  }
  beforeSaveHooks[entity].push(hook);
}

export function registerAfterSaveHook(entity: string, hook: HookFn): void {
  if (!afterSaveHooks[entity]) {
    afterSaveHooks[entity] = [];
  }
  afterSaveHooks[entity].push(hook);
}

export async function executeBeforeSaveHooks<T>(
  context: HookContext<T>,
): Promise<Either<HTTPException, void>> {
  const hooks = beforeSaveHooks[context.entity];

  if (!hooks || hooks.length === 0) {
    return right(undefined);
  }

  for (const hook of hooks) {
    try {
      await hook(context as HookContext);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Before save hook failed';
      return left(
        HTTPException.BadRequest(message, `${context.entity.toUpperCase()}_BEFORE_SAVE_HOOK_FAILED`),
      );
    }
  }

  return right(undefined);
}

export async function executeAfterSaveHooks<T>(
  context: HookContext<T>,
): Promise<Array<{ hook: string; error: string }>> {
  const hooks = afterSaveHooks[context.entity];
  const errors: Array<{ hook: string; error: string }> = [];

  if (!hooks || hooks.length === 0) {
    return errors;
  }

  for (let i = 0; i < hooks.length; i++) {
    try {
      await hooks[i](context as HookContext);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'After save hook failed';
      errors.push({ hook: `hook-${i}`, error: message });
    }
  }

  return errors;
}
```

Usage inside a use-case:

```typescript
// Inside any create/update use-case
import {
  executeBeforeSaveHooks,
  executeAfterSaveHooks,
} from '@application/core/lifecycle-hooks.registry';

// Before saving
const beforeResult = await executeBeforeSaveHooks({
  entity: '{entity}',
  action: 'create',
  data: payload,
});

if (beforeResult.isLeft()) {
  return left(beforeResult.value);
}

// Save the entity
const created = await this.{entity}Repository.create(payload);

// After saving (fire and collect errors, do not abort)
const afterErrors = await executeAfterSaveHooks({
  entity: '{entity}',
  action: 'create',
  data: created,
});

if (afterErrors.length > 0) {
  // Log errors but do not fail the operation
  console.warn('After save hook errors:', afterErrors);
}

return right(created);
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

## Checklist

Before delivering a use-case, verify all items:

- [ ] File named `{action}.use-case.ts` and placed in `resources/{entity}/{action}/`
- [ ] Class named `{Entity}{Action}UseCase`
- [ ] Named export used (no `export default` on new templates; legacy CRUD templates may still use default)
- [ ] DI decorator matches the project stack (e.g., `@Service()` for fastify-decorators)
- [ ] Dependencies injected via constructor using contracts, never implementations
- [ ] Return type is `Either<HTTPException, SuccessType>` -- never throws
- [ ] Outer `try/catch` wraps entire `execute()`, returns `InternalServerError` on unexpected errors
- [ ] No ternary operators -- all conditionals use `if/else`
- [ ] Inputs validated at the start with fail-fast `left()` returns
- [ ] Single Responsibility: one use-case per action
- [ ] Clone use-cases: original fetched by ID, `_id` removed from copy, new slug generated with `-copy-{timestamp}`
- [ ] Clone use-cases: children deep-cloned, trashed/deleted children excluded
- [ ] Import use-cases: schema validated with Zod, errors collected per row, result includes `created` count and `errors` array
- [ ] Export use-cases: supports JSON and CSV formats, returns `{ content, contentType, filename }`
- [ ] Bulk use-cases: all IDs validated before operation, result includes `success`, `failed`, and `errors` array
- [ ] Lifecycle hooks: `beforeSave` failures abort the operation, `afterSave` failures are collected but do not abort
