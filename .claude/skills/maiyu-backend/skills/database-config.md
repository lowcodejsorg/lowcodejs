---
name: maiyu:backend-database-config
description: |
  Generates database connection configuration for backend Node.js projects.
  Use when: user asks to configure database, setup connection, add database,
  or mentions "database config", "connection string", "pool".
  Supports: MongoDB, PostgreSQL, MySQL, SQLite.
  Frameworks: Fastify, Express, NestJS, AdonisJS v6/v7, Hono.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

1. Find `package.json` (walk up directories if needed)
2. Detect database driver: `mongoose` | `pg` | `mysql2` | `better-sqlite3` | `@libsql/client`
3. Detect ORM: `@prisma/client` | `typeorm` | `drizzle-orm` | `knex` | `@adonisjs/lucid`
4. Detect framework from dependencies
5. If not detected, ask user which database and framework

## Conventions

### Rules
- No ternary operators — use if/else or early returns
- No `any` type — use `unknown`, concrete types, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- All functions must have explicit return types
- Multiple conditions use const mapper (object lookup) instead of switch/if-else chains

## Templates

### MongoDB (Mongoose)

```typescript
// config/database.config.ts
import mongoose from 'mongoose'

export async function connectDatabase() {
  const url = process.env.DATABASE_URL!
  const dbName = process.env.DB_NAME || 'app'

  await mongoose.connect(url, {
    dbName,
    autoCreate: true,
  })

  console.log(`Connected to MongoDB: ${dbName}`)
}
```

### PostgreSQL (pg / node-postgres)

```typescript
// config/database.config.ts
import { Pool } from 'pg'

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // OR individual fields:
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_DATABASE || 'app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: getSslConfig(),
})

function getSslConfig(): { rejectUnauthorized: boolean } | false {
  if (process.env.NODE_ENV === 'production') {
    return { rejectUnauthorized: false }
  }
  return false
}

pool.on('error', (err) => {
  console.error('Unexpected database error', err)
  process.exit(-1)
})
```

### PostgreSQL (Drizzle ORM)

```typescript
// config/database.config.ts
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '../database/schema'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
})

export const db = drizzle(pool, { schema })
```

### PostgreSQL (Prisma)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

```typescript
// config/database.config.ts
import { PrismaClient } from '@prisma/client'

// Extend globalThis to cache PrismaClient across hot reloads
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

function getPrismaLogLevels(): Array<'query' | 'error' | 'warn'> {
  if (process.env.NODE_ENV === 'development') {
    return ['query', 'error', 'warn']
  }
  return ['error']
}

export const prisma = globalThis.__prisma || new PrismaClient({
  log: getPrismaLogLevels(),
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}
```

### AdonisJS v6/v7 (Lucid)

```typescript
// config/database.ts
import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

export default defineConfig({
  connection: env.get('DB_CONNECTION', 'postgres'),
  connections: {
    postgres: {
      client: 'pg',
      connection: {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      seeders: {
        paths: ['database/seeders'],
      },
      pool: { min: 2, max: 20 },
      healthCheck: true,
      debug: env.get('NODE_ENV') === 'development',
    },
    sqlite: {
      client: 'better-sqlite3',
      connection: { filename: env.get('DB_DATABASE', 'database/db.sqlite3') },
      useNullAsDefault: true,
      migrations: { naturalSort: true, paths: ['database/migrations'] },
    },
    mongo: {
      client: 'mongodb',
      connection: { url: env.get('DATABASE_URL') },
    },
  },
})
```

### NestJS (TypeORM)

```typescript
// app.module.ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'

function getSslConfigFromEnv(nodeEnv: string | undefined): { rejectUnauthorized: boolean } | false {
  if (nodeEnv === 'production') {
    return { rejectUnauthorized: false }
  }
  return false
}

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') !== 'production',
        ssl: getSslConfigFromEnv(config.get('NODE_ENV')),
      }),
    }),
  ],
})
export class AppModule {}
```

### Fastify Plugin

```typescript
// plugins/database.ts
import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import mongoose from 'mongoose'

export default fp(async (fastify: FastifyInstance) => {
  await mongoose.connect(process.env.DATABASE_URL!, {
    dbName: process.env.DB_NAME,
  })

  fastify.addHook('onClose', async () => {
    await mongoose.disconnect()
  })
})
```

## .env Examples

```bash
# MongoDB
DATABASE_URL=mongodb://localhost:27017
DB_NAME=myapp

# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/myapp
# OR individual:
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=myapp
DB_USER=postgres
DB_PASSWORD=password

# SQLite
DB_DATABASE=./database/app.sqlite3
```

## Checklist

- [ ] Connection string uses environment variables
- [ ] Pool size configured (default 20 for PostgreSQL)
- [ ] SSL configured for production
- [ ] Error handler registered
- [ ] Graceful shutdown (disconnect on close)
- [ ] Health check endpoint available
- [ ] Logging configured per environment
