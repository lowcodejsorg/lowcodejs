---
name: maiyu:backend-test
description: |
  Generates test code (unit and E2E) for backend Node.js projects.
  Use when: user asks to create tests, specs, unit tests, integration tests,
  E2E tests, or mentions "test" for backend code.
  Supports: Vitest, Jest, Supertest, AdonisJS v6/v7, Japa, in-memory repositories.
  Frameworks: Fastify, Express, NestJS, AdonisJS v6/v7, Japa, Hono, Elysia/Bun.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **Test runner**: `vitest` | `jest` | `@jest/core` | `mocha`
   - **HTTP testing**: `supertest` | `light-my-request` (Fastify built-in)
   - **Framework**: `fastify` | `express` | `@nestjs/core` | `@adonisjs/core` | `hono` | `elysia`
   - **ORM**: `mongoose` | `@prisma/client` | `typeorm` | `drizzle-orm`
3. Scan existing tests to detect:
   - Test file location pattern (co-located vs separate `test/` directory)
   - Naming convention (`*.spec.ts` vs `*.test.ts`)
   - Test language (Portuguese vs English descriptions)
   - Setup/teardown patterns
   - Authentication helpers

For test patterns and examples, see `references/test-patterns.md`.

## Conventions

### Naming
- Unit test: `{action}.use-case.spec.ts`
- E2E test: `{action}.controller.spec.ts`
- Service test: `{action}.service.spec.ts`

### File Placement
- Co-located with source: `resources/{entity}/{action}/{action}.use-case.spec.ts`
- Same directory as the file being tested

### Rules
- Unit tests use in-memory repositories (no database)
- E2E tests use real kernel + supertest + database
- `sut` naming for System Under Test
- `beforeEach` to reset state
- Test happy path + all error cases
- No ternary operators — use if/else or early returns
- No `any` type — use `unknown`, concrete types, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- All functions must have explicit return types
- Multiple conditions use const mapper (object lookup) instead of switch/if-else chains
- Detect test language from existing tests

## Templates

### Unit Test (Use-Case)

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {Entity}InMemoryRepository from '@application/repositories/{entity}/{entity}-in-memory.repository';
import {Entity}{Action}UseCase from './{action}.use-case';

let {entity}InMemoryRepository: {Entity}InMemoryRepository;
let sut: {Entity}{Action}UseCase;

describe('{Entity} {Action} Use Case', () => {
  beforeEach(() => {
    {entity}InMemoryRepository = new {Entity}InMemoryRepository();
    sut = new {Entity}{Action}UseCase({entity}InMemoryRepository);
  });

  it('should {action} a {entity} successfully', async () => {
    const result = await sut.execute({
      // valid payload
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.name).toBe('expected');
    }
  });

  it('should return error when {error condition}', async () => {
    // Setup error condition
    const result = await sut.execute({
      // payload that triggers error
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(400); // or 404, 409, etc.
      expect(result.value.cause).toBe('ERROR_CAUSE');
    }
  });

  it('should return internal server error on unexpected failure', async () => {
    vi.spyOn({entity}InMemoryRepository, 'findBy').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({
      // valid payload
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('{ACTION}_{ENTITY}_ERROR');
    }
  });
});
```

### E2E Test (Controller)

```typescript
import supertest from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { {Entity} } from '@application/model/{entity}.model';
import { kernel } from '@start/kernel';
import { createAuthenticatedUser } from '@test/helpers/auth.helper';

describe('E2E {Entity} {Action} Controller', () => {
  beforeEach(async () => {
    await kernel.ready();
    await {Entity}.deleteMany({});
  });

  afterAll(async () => {
    await kernel.close();
  });

  describe('{METHOD} /{entities}', () => {
    it('should {action} successfully', async () => {
      const { cookies } = await createAuthenticatedUser();

      const response = await supertest(kernel.server)
        .post('/{entities}')
        .set('Cookie', cookies)
        .send({
          // valid payload
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.name).toBe('expected');
    });

    it('should return {errorCode} when {error condition}', async () => {
      const { cookies } = await createAuthenticatedUser();

      const response = await supertest(kernel.server)
        .post('/{entities}')
        .set('Cookie', cookies)
        .send({
          // invalid payload
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.cause).toBe('ERROR_CAUSE');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await supertest(kernel.server)
        .post('/{entities}')
        .send({
          // payload
        });

      expect(response.statusCode).toBe(401);
    });
  });
});
```

### Service Unit Test

```typescript
import { beforeEach, describe, expect, it } from 'vitest';
import InMemory{Service}Service from '@application/services/{service}/in-memory-{service}.service';

let sut: InMemory{Service}Service;

describe('{Service} Service', () => {
  beforeEach(() => {
    sut = new InMemory{Service}Service();
  });

  it('should execute successfully', async () => {
    const result = await sut.execute({
      // valid input
    });

    expect(result.success).toBe(true);
  });

  it('should record calls for verification', async () => {
    await sut.execute({ /* input */ });
    await sut.execute({ /* input */ });

    expect(sut.getCalls()).toHaveLength(2);
  });
});
```

## Test Patterns by Action

### Create Tests
- Happy path: creates and returns entity
- Conflict: entity already exists (409)
- Validation: missing required fields (400)
- Internal: database error (500)

### Show Tests
- Happy path: finds and returns entity
- Not found: entity doesn't exist (404)
- Internal: database error (500)

### Paginated Tests
- Happy path: returns paginated list with meta
- Empty: returns empty list with correct meta
- Search: filters by search term
- Sort: respects sort parameters
- Internal: database error (500)

### Update Tests
- Happy path: updates and returns entity
- Not found: entity doesn't exist (404)
- Partial: updates only provided fields
- Internal: database error (500)

### Delete Tests
- Happy path: soft deletes entity (204)
- Not found: entity doesn't exist (404)
- Internal: database error (500)

### Send to Trash / Remove from Trash Tests
- Happy path: toggles trashed flag
- Not found: entity doesn't exist (404)
- Internal: database error (500)

## DI and Test Setup Variants

### Vitest (Reference)
```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';
```

### Jest
```typescript
// No import needed if using globals
describe('{Entity} {Action}', () => {
  beforeEach(() => { /* ... */ });
  it('should work', async () => { /* ... */ });
});
```

### NestJS Testing Module
```typescript
import { Test, TestingModule } from '@nestjs/testing';

let module: TestingModule;
let sut: {Entity}{Action}UseCase;

beforeEach(async () => {
  module = await Test.createTestingModule({
    providers: [
      {Entity}{Action}UseCase,
      {
        provide: {Entity}ContractRepository,
        useClass: {Entity}InMemoryRepository,
      },
    ],
  }).compile();

  sut = module.get<{Entity}{Action}UseCase>({Entity}{Action}UseCase);
});
```

### AdonisJS v6/v7 (Japa)

**Unit Test:**
```typescript
// tests/unit/{entity}/{action}.spec.ts
import { test } from '@japa/runner'
import { InMemory{Entity}Repository } from '#tests/mocks/{entity}_in_memory'
import { {Entity}CreateUseCase } from '#use-cases/{entity}/create.use-case'

test.group('{Entity} Create', (group) => {
  let repository: InMemory{Entity}Repository
  let useCase: {Entity}CreateUseCase

  group.each.setup(() => {
    repository = new InMemory{Entity}Repository()
    useCase = new {Entity}CreateUseCase(repository)
  })

  test('should create entity successfully', async ({ assert }) => {
    const result = await useCase.execute({
      name: 'Test Entity',
      status: 'active',
    })

    assert.isTrue(result.isRight())
    if (result.isRight()) {
      assert.equal(result.value.name, 'Test Entity')
    }
  })

  test('should return left when name is empty', async ({ assert }) => {
    const result = await useCase.execute({ name: '', status: 'active' })

    assert.isTrue(result.isLeft())
    if (result.isLeft()) {
      assert.equal(result.value.code, 400)
    }
  })
})
```
