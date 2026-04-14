---
name: maiyu:backend
description: |
  Activates ALL 24 backend skills for Node.js projects.
  Use when: any backend task — controllers, services, repositories, models,
  auth, middleware, migrations, testing, scaffolding, seeders, validators,
  error handling, WebSocket, email templates, environment variables,
  dependency injection, monorepo setup.
  Frameworks: Fastify, Express, NestJS, AdonisJS, Hono, Elysia/Bun.
  ORM/DB: Mongoose, Prisma, TypeORM, Drizzle, Sequelize, Knex, Lucid.
metadata:
  author: jhollyfer
  version: "1.0.0"
---

# maiyu:backend — All Backend Skills

When this skill is activated, you have access to **all 24 backend skills**. Identify the task and read the matching skill before generating code.

## How to Operate

1. **Detect the project** — Read `package.json` (walk up directories if needed) and identify:
   - **Framework**: `fastify` | `express` | `@nestjs/core` | `@adonisjs/core` | `hono` | `elysia`
   - **ORM**: `mongoose` | `@prisma/client` | `typeorm` | `drizzle-orm` | `knex` | `sequelize`
   - **DI**: `fastify-decorators` | `tsyringe` | `inversify` | `@nestjs/common` | `awilix` | manual
   - **Validator**: `zod` | `class-validator` | `joi` | `@sinclair/typebox`
   - **Test runner**: `vitest` | `jest`
   - **Package manager**: `npm` | `pnpm` | `yarn`
2. **Identify the task** — Match to a module below
3. **Read the module** — Use `Read` tool on the relative path (e.g., `skills/scaffold.md`)
4. **Follow conventions** — All code MUST follow the rules below

## Available Modules

| Task | Module to read |
|------|---------------|
| Scaffold CRUD / generate all layers | `skills/scaffold.md` + `references/crud-actions.md` |
| Create controller / route handler | `skills/controller.md` |
| Create service / business logic | `skills/service.md` |
| Create use case | `skills/use-case.md` |
| Create repository (contract + impl) | `skills/repository.md` + `references/repository-templates.md` |
| Create model / entity | `skills/model.md` + `references/mongoose-patterns.md` |
| Add authentication (JWT, OAuth) | `skills/auth.md` |
| Create middleware / hooks | `skills/middleware.md` |
| Add data validation | `skills/validator.md` |
| Create API schema / docs | `skills/schema.md` |
| Create database migration | `skills/migration.md` |
| Create database seeder | `skills/seeder.md` |
| Configure database connection | `skills/database-config.md` |
| Configure environment variables | `skills/env.md` |
| Configure dependency injection | `skills/di-registry.md` |
| Configure server bootstrap | `skills/kernel.md` |
| Define project folder structure | `skills/structure.md` |
| Add error handling / exceptions | `skills/error-handling.md` |
| Add unit tests | `skills/test.md` + `references/test-patterns.md` |
| Add E2E test setup | `skills/e2e-test.md` |
| Add email service with templates | `skills/email-template.md` |
| Add WebSocket / real-time | `skills/realtime.md` |
| Add sandboxed script execution | `skills/sandbox.md` |
| Add clone, import, or export | `skills/clone-import-export.md` |
| Set up fullstack monorepo | `skills/fullstack-monorepo.md` |

## Compound Tasks

- **"Create a CRUD for X"** — Read: `scaffold`, `controller`, `service`, `repository`, `model`, `schema`, `validator`
- **"Set up the project"** — Read: `structure`, `kernel`, `env`, `database-config`, `di-registry`
- **"Add authentication"** — Read: `auth`, `middleware`
- **"Add tests"** — Read: `test`, `e2e-test`

## Conventions

All generated code MUST follow these rules:

- **Zero `any`** — use concrete types, `unknown`, generics, `Record<string, unknown>`
- **Zero ternaries** — use if/else, early return, const mapper
- **Zero `as TYPE`** — use type guards, generics (except `as const`)
- **Explicit return types** on all functions
- **Multiple conditions** — const mapper (object lookup instead of switch/if-else chains)
- **Named exports only** — no default exports (except fastify-decorators)
- **Soft deletes by default** — `trashed: boolean`, `trashedAt: Date | null`
- **Either pattern** for error handling — left = error, right = success
