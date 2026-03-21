---
name: backend-model
description: |
  Generates data model/entity code for backend Node.js projects.
  Use when: user asks to create models, entities, database schemas,
  collections, or mentions "model" for data structures.
  Supports: Mongoose, Prisma, TypeORM, Drizzle, Sequelize.
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
   - **Framework**: `fastify` | `express` | `@nestjs/core` | `@adonisjs/core` | `hono` | `elysia`
3. Scan existing models to detect:
   - Model directory location (e.g., `application/model/`, `src/entities/`, `src/models/`)
   - Naming patterns and conventions
   - Entity type definitions location (e.g., `core/entity.core.ts`)
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
- File: `{entity}.model.ts` (e.g., `user.model.ts`)
- Model export: `{Entity}` singular (e.g., `User`, `Product`)
- Schema export: `Schema` (Mongoose)
- Entity type: `I{Entity}` defined in core entity file

### File Placement
- Centralized: `application/model/{entity}.model.ts` or detected location
- Entity types: `application/core/entity.core.ts` or equivalent

### Rules
- Always include timestamps (`createdAt`, `updatedAt`)
- Always include soft delete fields (`trashed: boolean`, `trashedAt: Date | null`)
- Use enum validation for status/type fields
- Mongoose: use cache pattern `mongoose?.models?.X || mongoose.model(...)`
- Define entity interface in core types, reference in model
- No ternary operators — use if/else

For Mongoose sub-schema patterns and complex validators, see `references/mongoose-patterns.md`.

## Templates

### Mongoose (Reference Implementation)

```typescript
import mongoose from 'mongoose';
import { type I{Entity} as Core, Merge } from '@application/core/entity.core';

type Entity = Merge<Omit<Core, '_id'>, mongoose.Document>;

export const Schema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(E_{ENTITY}_STATUS),
      default: E_{ENTITY}_STATUS.ACTIVE,
    },
    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    id: false,
  },
);

export const {Entity} = (mongoose?.models?.{Entity} ||
  mongoose.model<Entity>('{Entity}', Schema, '{entities}')) as mongoose.Model<Entity>;
```

**With Relationships:**
```typescript
export const Schema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    id: false,
  },
);
```

### Prisma

Add to `prisma/schema.prisma`:
```prisma
model {Entity} {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  name      String
  status    {Entity}Status @default(ACTIVE)
  trashed   Boolean  @default(false)
  trashedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("{entities}")
}

enum {Entity}Status {
  ACTIVE
  INACTIVE
}
```

### TypeORM

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('{entities}')
export class {Entity}Entity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: E_{ENTITY}_STATUS,
    default: E_{ENTITY}_STATUS.ACTIVE,
  })
  status: string;

  @Column({ default: false })
  trashed: boolean;

  @Column({ type: 'timestamp', nullable: true, default: null })
  trashedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Drizzle ORM

**MongoDB (with drizzle-orm/mongodb):**
```typescript
import { pgTable, text, boolean, timestamp, uuid } from 'drizzle-orm/pg-core';

export const {entities} = pgTable('{entities}', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  status: text('status').notNull().default('ACTIVE'),
  trashed: boolean('trashed').notNull().default(false),
  trashedAt: timestamp('trashed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at'),
});
```

## Entity Type Definition

When creating a new model, also define its type in the core entity file:

```typescript
// In entity.core.ts or equivalent
export type I{Entity} = Merge<
  Base,
  {
    name: string;
    status: ValueOf<typeof E_{ENTITY}_STATUS>;
    // ... entity-specific fields
  }
>;

export const E_{ENTITY}_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;
```

## Examples

### Complete Mongoose Model (User)

```typescript
import mongoose from 'mongoose';
import { E_USER_STATUS, Merge, type IUser as Core } from '@application/core/entity.core';

type Entity = Merge<Omit<Core, '_id'>, mongoose.Document>;

export const Schema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(E_USER_STATUS),
      default: E_USER_STATUS.INACTIVE,
    },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'UserGroup' },
    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    id: false,
  },
);

export const User = (mongoose?.models?.User ||
  mongoose.model<Entity>('User', Schema, 'users')) as mongoose.Model<Entity>;
```
