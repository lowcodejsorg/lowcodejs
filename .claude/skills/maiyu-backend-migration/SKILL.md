---
name: maiyu:backend-migration
description: |
  Generates database migration files for backend Node.js projects.
  Use when: user asks to create migrations, database changes, schema alterations,
  add/remove columns, create tables, or mentions "migration".
  Supports: Prisma, TypeORM, Drizzle Kit, Knex, Lucid (AdonisJS), Mongoose (no migrations).
  Frameworks: Fastify, Express, NestJS, AdonisJS v6/v7, Hono.
  Databases: PostgreSQL, MongoDB, MySQL, SQLite.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **ORM**: `@prisma/client` | `typeorm` | `drizzle-orm` | `knex` | `@adonisjs/lucid` | `mongoose`
   - **Database**: `pg` | `mysql2` | `better-sqlite3` | `mongoose`
3. Scan existing migrations to detect:
   - Migration directory (`database/migrations/`, `src/migrations/`, `prisma/migrations/`)
   - Naming convention (timestamp-prefix, sequential)
4. If ORM not detected, ask user

## Conventions

### Naming
- Prisma: auto-generated in `prisma/migrations/`
- TypeORM: `{timestamp}-{description}.ts` in `src/migrations/`
- Drizzle: `{number}_{description}.ts` in `drizzle/`
- Knex: `{timestamp}_{description}.ts` in `database/migrations/`
- Lucid: `{timestamp}_{description}.ts` in `database/migrations/`

### Rules
- Always include rollback (down) function
- Never drop columns in production without data migration
- Use transactions for multi-step migrations
- Add indexes for frequently queried columns
- No ternary operators — use if/else or early returns
- No `any` type — use `unknown`, concrete types, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- All functions must have explicit return types
- Multiple conditions use const mapper (object lookup) instead of switch/if-else chains

## Templates

### Prisma (PostgreSQL)

```prisma
// prisma/schema.prisma — add model, then run: npx prisma migrate dev --name {description}
model {Entity} {
  id        String   @id @default(uuid())
  name      String
  status    {Entity}Status @default(ACTIVE)
  trashed   Boolean  @default(false)
  trashedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  ownerId   String
  owner     User     @relation(fields: [ownerId], references: [id])

  @@map("{entities}")
  @@index([ownerId])
  @@index([status])
}

enum {Entity}Status {
  ACTIVE
  INACTIVE
}
```

### TypeORM (PostgreSQL)

```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm'

export class Create{Entity}Table{TIMESTAMP} implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: '{entities}',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', length: '255' },
          { name: 'status', type: 'enum', enum: ['active', 'inactive'], default: "'active'" },
          { name: 'trashed', type: 'boolean', default: false },
          { name: 'trashed_at', type: 'timestamp', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    )

    await queryRunner.createIndex('{entities}', new TableIndex({ columnNames: ['status'] }))
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('{entities}')
  }
}
```

### Drizzle Kit (PostgreSQL)

```typescript
// drizzle/{number}_{description}.ts
import { sql } from 'drizzle-orm'
import { pgTable, uuid, varchar, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core'

export const statusEnum = pgEnum('{entity}_status', ['active', 'inactive'])

export const {entities} = pgTable('{entities}', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  status: statusEnum('status').notNull().default('active'),
  trashed: boolean('trashed').notNull().default(false),
  trashedAt: timestamp('trashed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Run: npx drizzle-kit generate && npx drizzle-kit migrate
```

### Knex (PostgreSQL)

```typescript
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('{entities}', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('name', 255).notNull()
    table.enum('status', ['active', 'inactive']).defaultTo('active')
    table.boolean('trashed').defaultTo(false)
    table.timestamp('trashed_at').nullable()
    table.timestamps(true, true)

    table.index(['status'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('{entities}')
}
```

### AdonisJS v6/v7 (Lucid)

```typescript
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = '{entities}'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 255).notNull()
      table.enum('status', ['active', 'inactive']).defaultTo('active')
      table.boolean('trashed').defaultTo(false)
      table.timestamp('trashed_at').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index(['status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

// Run: node ace make:migration create_{entities}_table
// Run: node ace migration:run
```

### Add Column Migration

```typescript
// Knex / AdonisJS pattern:
async up() {
  this.schema.alterTable('{entities}', (table) => {
    table.string('email', 255).nullable().after('name')
    table.index(['email'])
  })
}

async down() {
  this.schema.alterTable('{entities}', (table) => {
    table.dropColumn('email')
  })
}
```

### Mongoose (No Migrations)

```typescript
// MongoDB does not use migrations — schema changes are applied at runtime
// For data migrations, create a script:
// database/scripts/migrate-{description}.ts

import mongoose from 'mongoose'
import { {Entity} } from '@application/model/{entity}.model'

async function migrate() {
  await mongoose.connect(process.env.DATABASE_URL!)
  
  // Add new field with default value
  await {Entity}.updateMany(
    { newField: { $exists: false } },
    { $set: { newField: 'default_value' } },
  )

  console.log('Migration complete')
  await mongoose.disconnect()
}

migrate()
```

## CLI Commands

| ORM | Create | Run | Rollback |
|-----|--------|-----|----------|
| Prisma | `npx prisma migrate dev --name {name}` | `npx prisma migrate deploy` | `npx prisma migrate reset` |
| TypeORM | `npx typeorm migration:create src/migrations/{name}` | `npx typeorm migration:run` | `npx typeorm migration:revert` |
| Drizzle | `npx drizzle-kit generate` | `npx drizzle-kit migrate` | manual |
| Knex | `npx knex migrate:make {name}` | `npx knex migrate:latest` | `npx knex migrate:rollback` |
| Lucid | `node ace make:migration {name}` | `node ace migration:run` | `node ace migration:rollback` |

## Checklist

- [ ] Migration has both up() and down()
- [ ] Indexes added for queried columns
- [ ] Enum values match application constants
- [ ] Timestamps included (created_at, updated_at)
- [ ] Soft delete fields included (trashed, trashed_at)
- [ ] Foreign keys have proper references
- [ ] No destructive operations without data backup plan
