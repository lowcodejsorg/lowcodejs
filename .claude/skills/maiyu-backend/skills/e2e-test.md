---
name: maiyu:backend-e2e-test
description: |
  Generates E2E test setup and helpers for backend Node.js projects.
  Use when: user asks to create E2E tests, integration tests, controller tests,
  API tests, or mentions "e2e", "end-to-end", "controller test" for HTTP testing.
  Supports: Vitest, Jest, AdonisJS v6/v7, Japa, isolated test database, auth helpers.
  Frameworks: Fastify, Express, NestJS, AdonisJS v6/v7, Japa, Hono.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating, detect:

1. From `devDependencies`: `vitest` | `jest` | `@nestjs/testing`
2. Check for existing test setup: `test/setup.e2e.ts`, `test/helpers/`
3. Check for existing test config: `vitest.e2e.config.ts`
4. Detect database: `mongoose` | `@prisma/client` | `typeorm`

## Conventions

### Rules
- No ternary operators — use if/else or early returns
- No `any` type — use `unknown`, concrete types, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- All functions must have explicit return types
- Multiple conditions use const mapper (object lookup) instead of switch/if-else chains

## Components

| Component | File | Purpose |
|-----------|------|---------|
| E2E config | `vitest.e2e.config.ts` | Vitest config for E2E (forks, timeout) |
| Setup | `test/setup.e2e.ts` | DB connection, cleanup |
| Auth helper | `test/helpers/auth.helper.ts` | Create authenticated user for tests |
| Test files | `*.controller.spec.ts` | Actual E2E tests |

## Templates

### Vitest E2E Config

```typescript
// vitest.e2e.config.ts
import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  plugins: [
    swc.vite({
      jsc: {
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
      },
    }),
  ],
  test: {
    include: ['**/*.controller.spec.ts'],
    globals: true,
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 1,
      },
    },
    testTimeout: 60000,
    hookTimeout: 30000,
    setupFiles: ['./test/setup.e2e.ts'],
  },
});
```

### E2E Setup — Mongoose

```typescript
// test/setup.e2e.ts
import 'reflect-metadata';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';

import { Env } from '@start/env';

const testDbName = `test_${randomUUID().replace(/-/g, '').slice(0, 12)}`;

beforeAll(async () => {
  await mongoose.connect(Env.DATABASE_URL, {
    autoCreate: true,
    dbName: testDbName,
  });
});

afterAll(async () => {
  await mongoose.connection.db?.dropDatabase();
  await mongoose.disconnect();
});
```

### E2E Setup — Prisma

```typescript
// test/setup.e2e.ts
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const testDbSuffix = randomUUID().slice(0, 8);
const testDbUrl = `${process.env.DATABASE_URL}_test_${testDbSuffix}`;

beforeAll(async () => {
  process.env.DATABASE_URL = testDbUrl;
  // Use execFileSync to avoid shell injection
  execFileSync('npx', ['prisma', 'db', 'push', '--skip-generate'], {
    env: { ...process.env, DATABASE_URL: testDbUrl },
  });
});

afterAll(async () => {
  const prisma = new PrismaClient({ datasourceUrl: testDbUrl });
  const dbName = testDbUrl.split('/').pop();
  if (dbName) {
    await prisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${dbName}"`);
  }
  await prisma.$disconnect();
});
```

### Auth Helper — Fastify

```typescript
// test/helpers/auth.helper.ts
import bcrypt from 'bcryptjs';

import { User } from '@application/model/user.model';
import { Group } from '@application/model/group.model';
import { Permission } from '@application/model/permission.model';

interface AuthenticatedUser {
  user: { _id: string; email: string; name: string };
  cookies: string;
  permissionIds: Array<string>;
}

export async function createAuthenticatedUser(
  app: FastifyInstance,
  overrides?: { email?: string; name?: string; role?: string },
): Promise<AuthenticatedUser> {
  // 1. Create permissions
  const permissions = await Permission.find({});
  let permissionIds = permissions.map((p) => p._id);

  if (permissionIds.length === 0) {
    const created = await Permission.insertMany([
      { name: 'View', slug: 'view-table', description: 'View tables' },
      { name: 'Create', slug: 'create-table', description: 'Create tables' },
    ]);
    permissionIds = created.map((p) => p._id);
  }

  // 2. Find or create group
  const roleName = overrides?.role ?? 'MASTER';
  let group = await Group.findOne({ slug: roleName });

  if (!group) {
    group = await Group.create({
      name: roleName,
      slug: roleName,
      permissions: permissionIds,
    });
  }

  // 3. Create user
  const password = 'TestPassword123!';
  const hashedPassword = await bcrypt.hash(password, 6);
  const email = overrides?.email ?? `test-${Date.now()}@test.com`;

  const user = await User.create({
    name: overrides?.name ?? 'Test User',
    email,
    password: hashedPassword,
    group: group._id,
    status: 'active',
  });

  // 4. Sign in to get cookies
  const response = await app.inject({
    method: 'POST',
    url: '/authentication/sign-in',
    payload: { email, password },
  });

  const cookies = response.headers['set-cookie'];
  let cookieString = '';
  if (Array.isArray(cookies)) {
    cookieString = cookies.map((c) => c.split(';')[0]).join('; ');
  } else if (cookies) {
    cookieString = cookies.split(';')[0];
  }

  return {
    user: { _id: user._id.toString(), email, name: user.name },
    cookies: cookieString,
    permissionIds: permissionIds.map(String),
  };
}
```

### E2E Test Example — Fastify

```typescript
// application/resources/users/create/create.controller.spec.ts
import { describe, it, expect, beforeAll } from 'vitest';

import { kernel } from '@start/kernel';
import { createAuthenticatedUser } from '@test/helpers/auth.helper';

describe('POST /users', () => {
  let app: FastifyInstance;
  let auth: Awaited<ReturnType<typeof createAuthenticatedUser>>;

  beforeAll(async () => {
    app = await kernel();
    await app.ready();
    auth = await createAuthenticatedUser(app);
  });

  it('should create a user', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/users',
      headers: { cookie: auth.cookies },
      payload: {
        name: 'New User',
        email: 'new@test.com',
        password: 'Password123!',
        group: auth.permissionIds[0],
      },
    });

    expect(response.statusCode).toBe(201);

    const body = JSON.parse(response.body);
    expect(body.name).toBe('New User');
    expect(body.email).toBe('new@test.com');
    expect(body.password).toBeUndefined();
  });

  it('should return 401 without authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { name: 'Test', email: 'test@test.com', password: 'Pass123!' },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should return 400 with invalid payload', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/users',
      headers: { cookie: auth.cookies },
      payload: { name: '' },
    });

    expect(response.statusCode).toBe(400);
  });
});
```

### package.json Script

```json
{
  "scripts": {
    "test:e2e": "vitest run --config vitest.e2e.config.ts"
  }
}
```

### AdonisJS v6/v7 (Japa + API Client)

**E2E Test:**
```typescript
// tests/functional/{entity}/create.spec.ts
import { test } from '@japa/runner'
import { UserFactory } from '#database/factories/user_factory'

test.group('{Entity} Create', (group) => {
  group.each.setup(async () => {
    // Runs migration or truncate
  })

  test('should create entity', async ({ client, assert }) => {
    const user = await UserFactory.merge({ role: 'MASTER' }).create()

    const response = await client
      .post('/{entities}')
      .loginAs(user)
      .json({ name: 'Test', status: 'active' })

    response.assertStatus(201)
    response.assertBodyContains({ name: 'Test' })
  })

  test('should return 401 when not authenticated', async ({ client }) => {
    const response = await client
      .post('/{entities}')
      .json({ name: 'Test' })

    response.assertStatus(401)
  })

  test('should return 403 when role is insufficient', async ({ client }) => {
    const user = await UserFactory.merge({ role: 'REGISTERED' }).create()

    const response = await client
      .post('/{entities}')
      .loginAs(user)
      .json({ name: 'Test' })

    response.assertStatus(403)
  })
})
```

**Factory (AdonisJS):**
```typescript
// database/factories/user_factory.ts
import Factory from '@adonisjs/lucid/factories'
import User from '#models/user'

export const UserFactory = Factory.define(User, ({ faker }) => ({
  name: faker.person.fullName(),
  email: faker.internet.email(),
  password: 'password123',
  role: 'REGISTERED',
  status: 'active',
})).build()
```

## Checklist

- [ ] Separate vitest config for E2E (forks, timeout, setup)
- [ ] Isolated database per test run (randomUUID)
- [ ] Auth helper creating user + group + permissions + sign-in
- [ ] Cookie extraction from sign-in response
- [ ] Test pattern: arrange, act, assert
- [ ] Tests for success, auth failure, and validation error
- [ ] Database cleanup in afterAll
