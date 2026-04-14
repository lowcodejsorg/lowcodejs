---
name: maiyu:backend-scaffold
description: |
  Scaffolds complete CRUD backend structure for a new entity in Node.js projects.
  Use when: user asks to scaffold, generate CRUD, create full resource, bootstrap entity,
  or wants all layers (model, repository, controllers, use-cases, validators, schemas, tests)
  generated at once for a new entity.
  Frameworks: Fastify, Express, NestJS, AdonisJS, Hono, Elysia/Bun.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **Framework**: `fastify` | `express` | `@nestjs/core` | `@adonisjs/core` | `hono` | `elysia`
   - **ORM**: `mongoose` | `@prisma/client` | `typeorm` | `drizzle-orm` | `knex` | `sequelize`
   - **DI**: `fastify-decorators` | `tsyringe` | `inversify` | `@nestjs/common` | `awilix` | manual
   - **Validator**: `zod` | `class-validator` | `joi` | `@sinclair/typebox`
   - **Test runner**: `vitest` | `jest`
3. Scan existing resources to detect:
   - Directory structure pattern
   - Naming conventions
   - Import path aliases
4. If any are missing, ask user with numbered options

## Interview

Before scaffolding, gather the following information:

### 1. Entity Name
```
What is the entity name? (e.g., Product, Category, Order)
```

### 2. Entity Fields
```
What fields does {Entity} have? List them with types.
Example format:
  - name: string (required)
  - price: number (required)
  - description: string (optional)
  - category: relationship to Category
  - status: enum [active, inactive] (default: active)
  - imageUrl: string (optional)
```

### 3. Actions to Generate
```
Which CRUD actions should I generate? (default: all)
1. create
2. show (find by ID)
3. paginated (list with pagination)
4. update
5. delete (permanent)
6. send-to-trash (soft delete)
7. remove-from-trash (restore)
```

### 4. Relationships
```
Does {Entity} have relationships? If so, which ones?
- belongs to (e.g., Category, User)
- has many (e.g., Items, Comments)
```

## Generated Structure

For each entity, the scaffold generates:

```
application/
├── core/
│   └── entity.core.ts          # Add I{Entity} type + E_{ENTITY}_STATUS enum
├── model/
│   └── {entity}.model.ts       # Database model
├── repositories/
│   └── {entity}/
│       ├── {entity}-contract.repository.ts
│       ├── {entity}-{orm}.repository.ts
│       └── {entity}-in-memory.repository.ts
└── resources/
    └── {entities}/
        ├── {entity}-base.validator.ts
        ├── create/
        │   ├── create.validator.ts
        │   ├── create.schema.ts
        │   ├── create.controller.ts
        │   ├── create.use-case.ts
        │   ├── create.use-case.spec.ts
        │   └── create.controller.spec.ts
        ├── show/
        │   ├── show.validator.ts
        │   ├── show.schema.ts
        │   ├── show.controller.ts
        │   ├── show.use-case.ts
        │   ├── show.use-case.spec.ts
        │   └── show.controller.spec.ts
        ├── paginated/
        │   ├── paginated.validator.ts
        │   ├── paginated.schema.ts
        │   ├── paginated.controller.ts
        │   ├── paginated.use-case.ts
        │   ├── paginated.use-case.spec.ts
        │   └── paginated.controller.spec.ts
        ├── update/
        │   ├── update.validator.ts
        │   ├── update.schema.ts
        │   ├── update.controller.ts
        │   ├── update.use-case.ts
        │   ├── update.use-case.spec.ts
        │   └── update.controller.spec.ts
        ├── delete/
        │   ├── delete.validator.ts
        │   ├── delete.schema.ts
        │   ├── delete.controller.ts
        │   ├── delete.use-case.ts
        │   ├── delete.use-case.spec.ts
        │   └── delete.controller.spec.ts
        ├── send-to-trash/
        │   ├── send-to-trash.validator.ts
        │   ├── send-to-trash.schema.ts
        │   ├── send-to-trash.controller.ts
        │   ├── send-to-trash.use-case.ts
        │   └── send-to-trash.use-case.spec.ts
        └── remove-from-trash/
            ├── remove-from-trash.validator.ts
            ├── remove-from-trash.schema.ts
            ├── remove-from-trash.controller.ts
            ├── remove-from-trash.use-case.ts
            └── remove-from-trash.use-case.spec.ts
```

## Generation Order

Generate files in this order (dependencies first):

1. **Entity type** — add `I{Entity}` to `entity.core.ts`
2. **Model** — `{entity}.model.ts` (uses entity type)
3. **Repository contract** — `{entity}-contract.repository.ts` (uses entity type)
4. **Repository implementation** — `{entity}-{orm}.repository.ts` (uses model + contract)
5. **Repository in-memory** — `{entity}-in-memory.repository.ts` (uses contract)
6. **DI registration** — add to `di-registry.ts`
7. **For each action**, generate in order:
   a. Validator (`{action}.validator.ts`)
   b. Schema (`{action}.schema.ts`)
   c. Use-case (`{action}.use-case.ts`)
   d. Controller (`{action}.controller.ts`)
   e. Unit test (`{action}.use-case.spec.ts`)
   f. E2E test (`{action}.controller.spec.ts`)

## Rules

- Use the corresponding `backend-*` skill for each layer's code generation
- No ternary operators — use if/else or early returns
- No `any` type — use `unknown`, concrete types, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- All functions must have explicit return types
- Multiple conditions use const mapper (object lookup) instead of switch/if-else chains
- `abstract class` for contracts, not `interface`
- Controllers: anonymous default export (fastify-decorators), named class (others)
- Payload types in contract file
- Detect project language for error messages and test descriptions
- Soft deletes as default (`trashed: boolean`, `trashedAt: Date | null`)
- Feature-based folder organization

For action-specific templates, see `references/crud-actions.md`.

## Post-Scaffold Checklist

After generation, verify:

1. Entity type added to core entity file
2. Model created with all fields, timestamps, and soft-delete
3. Repository contract has all payload types and abstract methods
4. Repository implementation registered in DI registry
5. All selected action directories created with all files
6. Base validator created with shared fields
7. All controllers are loadable by the bootstrap system
8. All unit tests pass independently (in-memory repos)
9. Import paths use project aliases (`@application/`, `@start/`, etc.)

## Example Output Summary

For a `Product` entity with fields `name`, `price`, `category`, generating all actions:

```
Created 25 files:
  ✓ application/core/entity.core.ts (updated — added IProduct, E_PRODUCT_STATUS)
  ✓ application/model/product.model.ts
  ✓ application/repositories/product/product-contract.repository.ts
  ✓ application/repositories/product/product-mongoose.repository.ts
  ✓ application/repositories/product/product-in-memory.repository.ts
  ✓ application/core/di-registry.ts (updated — added Product repository)
  ✓ application/resources/products/product-base.validator.ts
  ✓ application/resources/products/create/create.{validator,schema,controller,use-case,use-case.spec,controller.spec}.ts
  ✓ application/resources/products/show/show.{...}.ts
  ✓ application/resources/products/paginated/paginated.{...}.ts
  ✓ application/resources/products/update/update.{...}.ts
  ✓ application/resources/products/delete/delete.{...}.ts
  ✓ application/resources/products/send-to-trash/send-to-trash.{...}.ts
  ✓ application/resources/products/remove-from-trash/remove-from-trash.{...}.ts
```
