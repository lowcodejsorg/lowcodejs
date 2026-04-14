---
name: maiyu:backend-env
description: |
  Generates environment variable validation and configuration for backend Node.js projects.
  Use when: user asks to add env vars, validate environment, create env config,
  or mentions "env", "environment variables", ".env" setup.
  Supports: Zod, envalid, @t3-oss/env, joi, custom validation, AdonisJS v6/v7 Env.
  Frameworks: Fastify, Express, NestJS, AdonisJS v6/v7, Hono, Elysia/Bun.
  Databases: MongoDB, PostgreSQL.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **Validator**: `zod` | `envalid` | `@t3-oss/env-core` | `@t3-oss/env-nextjs` | `joi`
   - **Framework**: `fastify` | `express` | `@nestjs/core` | `@adonisjs/core` | `hono` | `elysia`
   - **Dotenv**: `dotenv` (already loaded by framework or needs explicit load)
3. Scan existing env config to detect:
   - Env file location (e.g., `start/env.ts`, `src/config/env.ts`, `src/env.ts`)
   - Current env var naming convention (SCREAMING_SNAKE_CASE)
   - Existing validation approach
4. If validator library not detected, ask user:
   ```
   Which validation library for env vars?
   1. Zod (most popular, full TypeScript inference)
   2. envalid (purpose-built for env validation)
   3. @t3-oss/env (T3 stack, framework-aware)
   4. Joi
   5. Custom (manual parsing)
   ```

## Conventions

### Naming
- File: `env.ts` (e.g., `start/env.ts`, `src/config/env.ts`)
- Schema export: `EnvSchema`
- Validated export: `Env` (typed, validated object)
- Env var names: `SCREAMING_SNAKE_CASE`

### File Placement
- `start/env.ts` (Fastify reference, AdonisJS-style)
- `src/config/env.ts` or `src/env.ts` (Express, NestJS, Hono)

### Rules
- Always validate ALL env vars at startup — fail fast
- Use `z.coerce.number()` for numeric env vars (they come as strings)
- Use `.default()` for optional vars with sensible defaults
- Use `.transform()` for list values (semicolon-separated → array)
- Group related vars with comments
- Support `.env.test` for test environments
- Export a single `Env` object — never read `process.env` elsewhere
- No ternary operators — use if/else or early returns
- No `any` type — use `unknown`, concrete types, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- All functions must have explicit return types
- Multiple conditions use const mapper (object lookup) instead of switch/if-else chains

## Env Var Categories

When user asks to add env vars, identify the category:

| Category | Examples | Validation Pattern |
|----------|----------|--------------------|
| **Server** | PORT, HOST, NODE_ENV | `z.coerce.number().default(3000)`, `z.enum([...])` |
| **Database** | DATABASE_URL, DB_NAME | `z.string().trim()`, `z.string().url()` |
| **Auth/JWT** | JWT_SECRET, JWT_PUBLIC_KEY, COOKIE_SECRET | `z.string().trim()` (required, no default) |
| **Email** | SMTP_HOST, SMTP_PORT, SMTP_USER | `z.string().trim()`, `z.coerce.number()` |
| **Storage** | S3_BUCKET, UPLOAD_MAX_SIZE | `z.string().trim()`, `z.coerce.number()` |
| **External APIs** | API_KEY, WEBHOOK_URL | `z.string().trim()` (required) |
| **Feature Flags** | ENABLE_FEATURE_X | `z.coerce.boolean().default(false)` |
| **URLs** | APP_URL, CLIENT_URL, ALLOWED_ORIGINS | `z.string().url()`, transform for lists |
| **Pagination** | PER_PAGE, MAX_PAGE_SIZE | `z.coerce.number().default(50)` |
| **File Upload** | MAX_SIZE, ACCEPTED_TYPES, MAX_FILES | `z.coerce.number()`, transform for lists |

## Templates

### Zod (Reference Implementation)

```typescript
import { config } from 'dotenv';
import { z } from 'zod';

let envFile = '.env';
if (process.env.NODE_ENV === 'test') {
  envFile = '.env.test';
}
config({ path: envFile });

const EnvSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.string().trim(),
  DB_NAME: z.string().trim().default('myapp'),

  // Authentication
  JWT_PUBLIC_KEY: z.string().trim(),
  JWT_PRIVATE_KEY: z.string().trim(),
  COOKIE_SECRET: z.string().trim(),
  COOKIE_DOMAIN: z.string().trim().optional(),

  // Email
  EMAIL_PROVIDER_HOST: z.string().trim(),
  EMAIL_PROVIDER_PORT: z.coerce.number(),
  EMAIL_PROVIDER_USER: z.string().trim(),
  EMAIL_PROVIDER_PASSWORD: z.string().trim(),

  // URLs
  APP_SERVER_URL: z.string().trim(),
  APP_CLIENT_URL: z.string().trim(),

  // CORS (semicolon-separated list)
  ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((val) =>
      val
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean),
    ),

  // File Upload
  FILE_UPLOAD_MAX_SIZE: z.coerce.number().default(1024 * 1024 * 5), // 5MB
  FILE_UPLOAD_ACCEPTED: z.string().transform((val) =>
    val
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean),
  ),
  FILE_UPLOAD_MAX_FILES_PER_UPLOAD: z.coerce.number().default(10),

  // Pagination
  PAGINATION_PER_PAGE: z.coerce.number().default(50),
});

const validation = EnvSchema.safeParse(process.env);

if (!validation.success) {
  console.error('Invalid environment variables', validation.error.issues);
  throw new Error('Invalid environment variables');
}

export const Env = validation.data;
```

**Adding a new env var to an existing file:**
```typescript
// 1. Add to schema
const EnvSchema = z.object({
  // ... existing vars ...

  // Redis (new)
  REDIS_URL: z.string().trim().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().trim().optional(),
});

// 2. Add to .env and .env.example
// REDIS_URL=redis://localhost:6379
// REDIS_PASSWORD=
```

### envalid

```typescript
import { cleanEnv, str, num, bool, url, email } from 'envalid';

export const Env = cleanEnv(process.env, {
  // Server
  NODE_ENV: str({
    choices: ['development', 'test', 'production'],
    default: 'development',
  }),
  PORT: num({ default: 3000 }),

  // Database
  DATABASE_URL: str(),
  DB_NAME: str({ default: 'myapp' }),

  // Authentication
  JWT_PUBLIC_KEY: str(),
  JWT_PRIVATE_KEY: str(),
  COOKIE_SECRET: str(),

  // Email
  EMAIL_PROVIDER_HOST: str(),
  EMAIL_PROVIDER_PORT: num(),
  EMAIL_PROVIDER_USER: str(),
  EMAIL_PROVIDER_PASSWORD: str(),

  // URLs
  APP_SERVER_URL: url(),
  APP_CLIENT_URL: url(),
});
```

### @t3-oss/env (T3 Stack)

```typescript
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const Env = createEnv({
  server: {
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().trim(),
    JWT_SECRET: z.string().trim(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
```

### NestJS ConfigModule

```typescript
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().trim(),
  JWT_SECRET: z.string().trim(),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function validate(config: Record<string, unknown>): EnvConfig {
  const validation = EnvSchema.safeParse(config);

  if (!validation.success) {
    throw new Error(
      `Config validation error: ${validation.error.message}`,
    );
  }

  return validation.data;
}

// In app.module.ts:
// ConfigModule.forRoot({ validate, isGlobal: true })
```

### Joi

```typescript
import { config } from 'dotenv';
import Joi from 'joi';

config();

const EnvSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
}).unknown(true);

const { error, value } = EnvSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

// Joi validates and coerces the values, so the output is safe to type.
// Use a Zod-based approach (see above) for full type inference without assertions.
// With Joi, define a typed getter:

interface EnvConfig {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
}

export const Env: EnvConfig = value;
```

### AdonisJS v6/v7 (Env Validation)

```typescript
// start/env.ts
import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),

  // Database
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  // Redis
  REDIS_HOST: Env.schema.string({ format: 'host' }),
  REDIS_PORT: Env.schema.number(),
  REDIS_PASSWORD: Env.schema.string.optional(),

  // SMTP
  SMTP_HOST: Env.schema.string(),
  SMTP_PORT: Env.schema.number(),
  SMTP_USERNAME: Env.schema.string(),
  SMTP_PASSWORD: Env.schema.string(),
})
```

### PostgreSQL Connection (multiple frameworks)

**Fastify + pg:**
```typescript
import Fastify from 'fastify'
import fastifyPostgres from '@fastify/postgres'

const app = Fastify()
app.register(fastifyPostgres, {
  connectionString: process.env.DATABASE_URL,
  // OR individual fields:
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: getSslConfig(),
  max: 20, // pool size
})

function getSslConfig(): { rejectUnauthorized: boolean } | false {
  if (process.env.NODE_ENV === 'production') {
    return { rejectUnauthorized: false }
  }
  return false
}
```

**NestJS + TypeORM PostgreSQL:**
```typescript
// app.module.ts
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
      ssl: getSslConfig(), // see Fastify+pg example above for getSslConfig()
    }),
  ],
})
export class AppModule {}
```

**AdonisJS + Lucid PostgreSQL:**
```typescript
// config/database.ts
import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

export default defineConfig({
  connection: 'postgres',
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
      migrations: { naturalSort: true, paths: ['database/migrations'] },
      pool: { min: 2, max: 20 },
    },
  },
})
```

## .env.example Generation

When creating or updating env validation, also generate a `.env.example`:

```bash
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=mongodb://localhost:27017
DB_NAME=myapp

# Authentication
JWT_PUBLIC_KEY=
JWT_PRIVATE_KEY=
COOKIE_SECRET=
COOKIE_DOMAIN=

# Email
EMAIL_PROVIDER_HOST=smtp.example.com
EMAIL_PROVIDER_PORT=587
EMAIL_PROVIDER_USER=
EMAIL_PROVIDER_PASSWORD=

# URLs
APP_SERVER_URL=http://localhost:3000
APP_CLIENT_URL=http://localhost:5173

# CORS
ALLOWED_ORIGINS=http://localhost:3000;http://localhost:5173

# File Upload
FILE_UPLOAD_MAX_SIZE=5242880
FILE_UPLOAD_ACCEPTED=image/png;image/jpeg;application/pdf
FILE_UPLOAD_MAX_FILES_PER_UPLOAD=10

# Pagination
PAGINATION_PER_PAGE=50
```

## Checklist

When generating env validation:
- [ ] All env vars validated at startup (fail fast)
- [ ] Numeric vars use `z.coerce.number()`
- [ ] Boolean vars use `z.coerce.boolean()`
- [ ] List vars use `.transform()` with separator
- [ ] Optional vars have `.default()` or `.optional()`
- [ ] Secrets have no defaults (must be provided)
- [ ] `.env.example` updated with new vars
- [ ] Test env file (`.env.test`) considered
