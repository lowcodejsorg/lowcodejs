---
name: backend-repository
description: |
  Generates repository pattern code (contract + implementation + in-memory) for backend Node.js projects.
  Use when: user asks to create repositories, data access layer, database operations,
  or mentions "repository" for data persistence.
  Supports: Mongoose, Prisma, TypeORM, Drizzle, Knex, Sequelize.
  Frameworks: Fastify, Express, NestJS, AdonisJS, Hono, Elysia/Bun.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **ORM**: `mongoose` | `@prisma/client` | `typeorm` | `drizzle-orm` | `knex` | `sequelize`
   - **DI**: `fastify-decorators` | `tsyringe` | `inversify` | `@nestjs/common` | `awilix` | manual
   - **Framework**: `fastify` | `express` | `@nestjs/core` | `@adonisjs/core` | `hono` | `elysia`
3. Scan existing repositories to detect:
   - Repository directory location (e.g., `application/repositories/`)
   - DI registry location (e.g., `core/di-registry.ts`)
   - Naming patterns
4. If ORM not detected, ask user:
   ```
   Which ORM/ODM does your project use?
   1. Mongoose (MongoDB)
   2. Prisma
   3. TypeORM
   4. Drizzle ORM
   5. Knex
   6. Sequelize
   ```

## Conventions

### Naming
- Contract: `{entity}-contract.repository.ts`
- Implementation: `{entity}-{orm}.repository.ts` (e.g., `user-mongoose.repository.ts`)
- In-Memory: `{entity}-in-memory.repository.ts`
- Contract class: `{Entity}ContractRepository` (abstract class, NOT interface)
- Implementation class: `{Entity}{Orm}Repository`
- In-Memory class: `{Entity}InMemoryRepository`

### File Placement
- Directory: `application/repositories/{entity}/` or detected location
- 3 files per entity: contract + implementation + in-memory

### Rules
- Use `abstract class` for contracts (required for runtime DI, not `interface`)
- Payload types defined IN the contract file (not separate files)
- Standard methods: `create`, `findBy`, `findMany`, `update`, `delete`, `count`
- Implementation uses `@Service()` (or equivalent DI decorator)
- After creating, register in DI registry
- No ternary operators — use if/else
- Soft delete: update `trashed`/`trashedAt` instead of actual deletion

For complete implementation templates, see `references/repository-templates.md`.

## Templates

### Contract (All ORMs)

```typescript
import type { I{Entity}, Merge, ValueOf } from '@application/core/entity.core';

export type {Entity}CreatePayload = Pick<I{Entity}, 'name'> & {
  // entity-specific create fields
};

export type {Entity}UpdatePayload = Merge<
  Pick<I{Entity}, '_id'>,
  Partial<{Entity}CreatePayload>
>;

export type {Entity}FindByPayload = Partial<Pick<I{Entity}, '_id'>> & {
  exact: boolean;
};

export type {Entity}QueryPayload = {
  page?: number;
  perPage?: number;
  search?: string;
  trashed?: boolean;
  sort?: Record<string, 'asc' | 'desc'>;
};

export abstract class {Entity}ContractRepository {
  abstract create(payload: {Entity}CreatePayload): Promise<I{Entity}>;
  abstract findBy(payload: {Entity}FindByPayload): Promise<I{Entity} | null>;
  abstract findMany(payload?: {Entity}QueryPayload): Promise<I{Entity}[]>;
  abstract update(payload: {Entity}UpdatePayload): Promise<I{Entity}>;
  abstract delete(_id: string): Promise<void>;
  abstract count(payload?: {Entity}QueryPayload): Promise<number>;
}
```

### Mongoose Implementation

```typescript
import { Service } from 'fastify-decorators';
import { {Entity} as Model } from '@application/model/{entity}.model';
import type { I{Entity} } from '@application/core/entity.core';
import {
  {Entity}ContractRepository,
  type {Entity}CreatePayload,
  type {Entity}FindByPayload,
  type {Entity}QueryPayload,
  type {Entity}UpdatePayload,
} from './{entity}-contract.repository';

@Service()
export default class {Entity}MongooseRepository implements {Entity}ContractRepository {
  private readonly populateOptions: mongoose.PopulateOptions[] = [];

  private async buildWhereClause(
    payload?: {Entity}QueryPayload,
  ): Promise<Record<string, unknown>> {
    const where: Record<string, unknown> = {};

    if (payload?.trashed !== undefined) {
      where.trashed = payload.trashed;
    } else {
      where.trashed = false;
    }

    if (payload?.search) {
      where.$or = [
        { name: { $regex: payload.search, $options: 'i' } },
      ];
    }

    return where;
  }

  private transform(entity: InstanceType<typeof Model>): I{Entity} {
    return {
      ...entity.toJSON({ flattenObjectIds: true }),
      _id: entity._id.toString(),
    };
  }

  async create(payload: {Entity}CreatePayload): Promise<I{Entity}> {
    const created = await Model.create(payload);
    const populated = await created.populate(this.populateOptions);
    return this.transform(populated);
  }

  async findBy({
    exact = false,
    ...payload
  }: {Entity}FindByPayload): Promise<I{Entity} | null> {
    const conditions: Record<string, unknown>[] = [];
    if (payload._id) conditions.push({ _id: payload._id });

    if (conditions.length === 0) return null;

    const whereClause = exact ? { $and: conditions } : { $or: conditions };
    const entity = await Model.findOne(whereClause).populate(this.populateOptions);
    if (!entity) return null;
    return this.transform(entity);
  }

  async findMany(payload?: {Entity}QueryPayload): Promise<I{Entity}[]> {
    const where = await this.buildWhereClause(payload);

    let skip: number | undefined;
    let take: number | undefined;

    if (payload?.page && payload?.perPage) {
      skip = (payload.page - 1) * payload.perPage;
      take = payload.perPage;
    }

    const sortOption = payload?.sort && Object.keys(payload.sort).length > 0
      ? payload.sort
      : { name: 'asc' as const };

    const entities = await Model.find(where)
      .populate(this.populateOptions)
      .sort(sortOption)
      .skip(skip ?? 0)
      .limit(take ?? 0);

    return entities.map((e) => this.transform(e));
  }

  async update({ _id, ...payload }: {Entity}UpdatePayload): Promise<I{Entity}> {
    const entity = await Model.findOne({ _id });
    if (!entity) throw new Error('{Entity} not found');
    entity.set(payload);
    await entity.save();
    const populated = await entity.populate(this.populateOptions);
    return this.transform(populated);
  }

  async delete(_id: string): Promise<void> {
    await Model.updateOne(
      { _id },
      { $set: { trashed: true, trashedAt: new Date() } },
    );
  }

  async count(payload?: {Entity}QueryPayload): Promise<number> {
    const where = await this.buildWhereClause(payload);
    return Model.countDocuments(where);
  }
}
```

### In-Memory Implementation

```typescript
import type { I{Entity} } from '@application/core/entity.core';
import {
  {Entity}ContractRepository,
  type {Entity}CreatePayload,
  type {Entity}FindByPayload,
  type {Entity}QueryPayload,
  type {Entity}UpdatePayload,
} from './{entity}-contract.repository';

export default class {Entity}InMemoryRepository implements {Entity}ContractRepository {
  private items: I{Entity}[] = [];

  async create(payload: {Entity}CreatePayload): Promise<I{Entity}> {
    const entity: I{Entity} = {
      ...payload,
      _id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      trashedAt: null,
      trashed: false,
    };
    this.items.push(entity);
    return entity;
  }

  async findBy({ exact, ...payload }: {Entity}FindByPayload): Promise<I{Entity} | null> {
    const entity = this.items.find((item) => {
      if (exact) {
        return payload._id ? item._id === payload._id : true;
      }
      return item._id === payload._id;
    });
    return entity ?? null;
  }

  async findMany(payload?: {Entity}QueryPayload): Promise<I{Entity}[]> {
    let result = [...this.items];

    // Filter trashed
    if (payload?.trashed !== undefined) {
      result = result.filter((item) => item.trashed === payload.trashed);
    } else {
      result = result.filter((item) => !item.trashed);
    }

    // Search
    if (payload?.search) {
      const search = payload.search.toLowerCase();
      result = result.filter((item) =>
        item.name.toLowerCase().includes(search),
      );
    }

    // Sort
    if (payload?.sort) {
      const [key, direction] = Object.entries(payload.sort)[0];
      result.sort((a, b) => {
        const aVal = String((a as Record<string, unknown>)[key] ?? '');
        const bVal = String((b as Record<string, unknown>)[key] ?? '');
        if (direction === 'asc') return aVal.localeCompare(bVal);
        return bVal.localeCompare(aVal);
      });
    }

    // Pagination
    if (payload?.page && payload?.perPage) {
      const start = (payload.page - 1) * payload.perPage;
      result = result.slice(start, start + payload.perPage);
    }

    return result;
  }

  async update({ _id, ...payload }: {Entity}UpdatePayload): Promise<I{Entity}> {
    const index = this.items.findIndex((item) => item._id === _id);
    if (index === -1) throw new Error('{Entity} not found');
    this.items[index] = {
      ...this.items[index],
      ...payload,
      updatedAt: new Date(),
    };
    return this.items[index];
  }

  async delete(_id: string): Promise<void> {
    const index = this.items.findIndex((item) => item._id === _id);
    if (index === -1) return;
    this.items[index].trashed = true;
    this.items[index].trashedAt = new Date();
  }

  async count(payload?: {Entity}QueryPayload): Promise<number> {
    const items = await this.findMany(payload);
    return items.length;
  }
}
```

### DI Registration

After creating the repository, register it in the DI registry:

**fastify-decorators:**
```typescript
// In di-registry.ts
import { {Entity}ContractRepository } from '@application/repositories/{entity}/{entity}-contract.repository';
import {Entity}MongooseRepository from '@application/repositories/{entity}/{entity}-mongoose.repository';

injectablesHolder.injectService({Entity}ContractRepository, {Entity}MongooseRepository);
```

**tsyringe:**
```typescript
container.register({Entity}ContractRepository, { useClass: {Entity}MongooseRepository });
```

**NestJS:**
```typescript
@Module({
  providers: [
    { provide: {Entity}ContractRepository, useClass: {Entity}MongooseRepository },
  ],
  exports: [{Entity}ContractRepository],
})
```

**inversify:**
```typescript
container.bind<{Entity}ContractRepository>(TYPES.{Entity}Repository).to({Entity}MongooseRepository);
```
