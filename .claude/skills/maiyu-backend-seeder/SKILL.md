---
name: maiyu:backend-seeder
description: |
  Generates database seeder files for backend Node.js projects.
  Use when: user asks to create seeders, seed data, populate database,
  initial data, fixtures, or mentions "seeder" for database population.
  Supports: Mongoose/MongoDB, Prisma, TypeORM, Knex, Drizzle, Sequelize.
  Frameworks: Fastify, Express, NestJS, AdonisJS, Hono, Elysia/Bun.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **ORM/ODM**: `mongoose` | `prisma` | `@prisma/client` | `typeorm` | `knex` | `drizzle-orm` | `sequelize`
   - **Framework**: `fastify` | `express` | `@nestjs/core` | `@adonisjs/core` | `hono` | `elysia`
   - **Password hashing**: `bcryptjs` | `bcrypt` | `argon2`
3. Scan existing seeders to detect:
   - Seeder location (e.g., `database/seeders/`)
   - Naming pattern (timestamp prefix, alphabetical order)
   - Runner/orchestrator pattern
   - Existing models/entities to reference
4. If ORM not detected, ask user:
   ```
   Which ORM/database does your project use?
   1. Mongoose (MongoDB)
   2. Prisma
   3. TypeORM
   4. Knex
   5. Drizzle
   6. Sequelize
   ```

## Conventions

### Naming
- File: `{timestamp}-{entity}.seed.ts` (e.g., `1720448435-permissions.seed.ts`)
- Timestamp ensures execution order (Unix epoch seconds or sequential number)
- Export: `default async function Seed(): Promise<void>`
- Runner: `main.ts` or `index.ts` in seeders directory

### File Placement
- `database/seeders/{timestamp}-{entity}.seed.ts` (reference)
- `prisma/seeders/` or `prisma/seed.ts` (Prisma)
- `src/database/seeders/` (NestJS)

### Rules
- Each seeder handles ONE entity/collection
- Use `deleteMany({})` before insert for idempotent re-runs (or use upsert)
- Order matters — seed dependencies first (e.g., permissions before groups, groups before users)
- Use typed payload arrays with explicit types
- Hash passwords before inserting user seeders
- Log progress with descriptive messages
- No ternary operators — use if/else or early returns
- No `any` type — use `unknown`, concrete types, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- All functions must have explicit return types
- Multiple conditions use const mapper (object lookup) instead of switch/if-else chains

## Templates

### Mongoose/MongoDB (Reference Implementation)

**Seeder Runner (auto-discovery):**
```typescript
import { glob } from 'glob';

import { MongooseConnect } from '@config/database.config';

async function seed(): Promise<void> {
  await MongooseConnect();
  const base = process.cwd().replace(/\\/g, '/');
  const [ts, js] = await Promise.all([
    glob(base + '/database/seeders/*.seed.ts'),
    glob(base + '/database/seeders/*.seed.js'),
  ]);
  let seeders = [...ts, ...js];

  seeders = seeders.sort((a, b) => {
    return a.localeCompare(b);
  });

  console.info('Seeding...\n');

  for (const seeder of seeders) {
    console.info(`Seeding ${seeder}`);
    const { default: main } = await import(seeder);
    await main();
  }

  console.info('\nSeeding complete!');
  process.exit(0);
}

seed();
```

**Entity Seeder (clear + insert):**
```typescript
import { Permission } from '@application/model/permission.model';

interface PermissionPayload {
  name: string;
  slug: string;
  description: string;
}

export default async function Seed(): Promise<void> {
  await Permission.deleteMany({});

  const permissions: PermissionPayload[] = [
    {
      name: 'Create resource',
      slug: 'CREATE_RESOURCE',
      description: 'Allows creating a new resource',
    },
    {
      name: 'Update resource',
      slug: 'UPDATE_RESOURCE',
      description: 'Allows updating an existing resource',
    },
    {
      name: 'Remove resource',
      slug: 'REMOVE_RESOURCE',
      description: 'Allows removing a resource',
    },
    {
      name: 'View resource',
      slug: 'VIEW_RESOURCE',
      description: 'Allows viewing a resource',
    },
  ];

  await Permission.insertMany(permissions);
  console.info('permissions seeded');
}
```

**User Seeder (with password hashing and upsert):**
```typescript
import bcrypt from 'bcryptjs';

import { User } from '@application/model/user.model';
import { Group } from '@application/model/group.model';

interface UserPayload {
  name: string;
  email: string;
  password: string;
  groupSlug: string;
  status: string;
}

export default async function Seed(): Promise<void> {
  const users: UserPayload[] = [
    {
      name: 'Admin',
      email: 'admin@example.com',
      password: '10203040',
      groupSlug: 'ADMINISTRATOR',
      status: 'active',
    },
    {
      name: 'User',
      email: 'user@example.com',
      password: '10203040',
      groupSlug: 'REGISTERED',
      status: 'active',
    },
  ];

  for (const userData of users) {
    const group = await Group.findOne({ slug: userData.groupSlug });

    if (!group) {
      console.warn(`Group ${userData.groupSlug} not found, skipping user ${userData.email}`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(userData.password, 6);

    await User.bulkWrite([
      {
        updateOne: {
          filter: { email: userData.email },
          update: {
            $set: {
              name: userData.name,
              email: userData.email,
              password: hashedPassword,
              group: group._id,
              status: userData.status,
            },
          },
          upsert: true,
        },
      },
    ]);
  }

  console.info('users seeded');
}
```

**Relational Seeder (group with permissions):**
```typescript
import { Group } from '@application/model/group.model';
import { Permission } from '@application/model/permission.model';

interface GroupPayload {
  name: string;
  slug: string;
  permissionSlugs: string[];
}

export default async function Seed(): Promise<void> {
  await Group.deleteMany({});

  const allPermissions = await Permission.find({}).lean();

  const groups: GroupPayload[] = [
    {
      name: 'Administrator',
      slug: 'ADMINISTRATOR',
      permissionSlugs: allPermissions.map((p) => p.slug),
    },
    {
      name: 'Manager',
      slug: 'MANAGER',
      permissionSlugs: [
        'CREATE_RESOURCE',
        'UPDATE_RESOURCE',
        'VIEW_RESOURCE',
      ],
    },
    {
      name: 'Registered',
      slug: 'REGISTERED',
      permissionSlugs: ['VIEW_RESOURCE'],
    },
  ];

  for (const groupData of groups) {
    const permissionIds = allPermissions
      .filter((p) => groupData.permissionSlugs.includes(p.slug))
      .map((p) => p._id);

    await Group.create({
      name: groupData.name,
      slug: groupData.slug,
      permissions: permissionIds,
    });
  }

  console.info('groups seeded');
}
```

### Prisma

**Seed File (prisma/seed.ts):**
```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Seed permissions
  const permissions = await Promise.all([
    prisma.permission.upsert({
      where: { slug: 'CREATE_RESOURCE' },
      update: {},
      create: {
        name: 'Create resource',
        slug: 'CREATE_RESOURCE',
        description: 'Allows creating a new resource',
      },
    }),
    prisma.permission.upsert({
      where: { slug: 'VIEW_RESOURCE' },
      update: {},
      create: {
        name: 'View resource',
        slug: 'VIEW_RESOURCE',
        description: 'Allows viewing a resource',
      },
    }),
  ]);

  console.info('permissions seeded');

  // Seed admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.info('users seeded');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

### TypeORM

```typescript
import { DataSource } from 'typeorm';
import bcrypt from 'bcryptjs';

import { Permission } from '../entities/permission.entity';
import { User } from '../entities/user.entity';
import { AppDataSource } from '../data-source';

export async function seedPermissions(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(Permission);

  await repo.clear();

  const permissions = repo.create([
    { name: 'Create resource', slug: 'CREATE_RESOURCE', description: 'Allows creating a new resource' },
    { name: 'View resource', slug: 'VIEW_RESOURCE', description: 'Allows viewing a resource' },
  ]);

  await repo.save(permissions);
  console.info('permissions seeded');
}

export async function seedUsers(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(User);
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await repo.upsert(
    { name: 'Admin', email: 'admin@example.com', password: hashedPassword, role: 'ADMIN' },
    ['email'],
  );

  console.info('users seeded');
}

// Runner
async function seed(): Promise<void> {
  const dataSource = await AppDataSource.initialize();

  await seedPermissions(dataSource);
  await seedUsers(dataSource);

  await dataSource.destroy();
  console.info('Seeding complete!');
}

seed();
```

### Knex

```typescript
import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing entries
  await knex('permissions').del();

  // Insert seed entries
  await knex('permissions').insert([
    { name: 'Create resource', slug: 'CREATE_RESOURCE', description: 'Allows creating a new resource' },
    { name: 'View resource', slug: 'VIEW_RESOURCE', description: 'Allows viewing a resource' },
  ]);
}
```

### Drizzle

```typescript
import { db } from '../db';
import { permissions, users } from '../schema';
import bcrypt from 'bcryptjs';

async function seed(): Promise<void> {
  // Clear and insert permissions
  await db.delete(permissions);

  await db.insert(permissions).values([
    { name: 'Create resource', slug: 'CREATE_RESOURCE', description: 'Allows creating a new resource' },
    { name: 'View resource', slug: 'VIEW_RESOURCE', description: 'Allows viewing a resource' },
  ]);

  console.info('permissions seeded');

  // Upsert admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await db
    .insert(users)
    .values({
      name: 'Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
    })
    .onConflictDoNothing({ target: users.email });

  console.info('users seeded');
}

seed();
```

## package.json Script

Add a seed script to `package.json`:

```json
{
  "scripts": {
    "seed": "tsx database/seeders/main.ts",
    "seed:prisma": "prisma db seed"
  }
}
```

For Prisma, also add to `package.json`:
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

## Checklist

When generating seeders:
- [ ] Timestamp prefix for execution order
- [ ] Dependencies seeded first (permissions → groups → users)
- [ ] Idempotent (safe to re-run: deleteMany or upsert)
- [ ] Passwords hashed before insert
- [ ] Typed payload arrays
- [ ] Progress logging for each entity
- [ ] Runner script with auto-discovery (or Prisma seed file)
- [ ] `package.json` seed script added
