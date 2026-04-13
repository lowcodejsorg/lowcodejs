---
name: maiyu:backend-schema
description: |
  Generates API schema/documentation code for backend Node.js projects.
  Use when: user asks to create API schemas, OpenAPI specs, route documentation,
  swagger definitions, or mentions "schema" for API routes.
  Supports: Fastify Schema, swagger-jsdoc, @nestjs/swagger, @hono/zod-openapi, AdonisJS v6/v7 OpenAPI.
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
   - **Framework**: `fastify` | `express` | `@nestjs/core` | `@adonisjs/core` | `hono` | `elysia`
   - **Schema style**: Fastify native → `FastifySchema` | Express → `swagger-jsdoc` | NestJS → `@nestjs/swagger` decorators | Hono → `@hono/zod-openapi`
   - **Validator**: `zod` | `class-validator` | `joi` | `@sinclair/typebox`
3. If framework not detected, ask user:
   ```
   Which framework does your project use?
   1. Fastify
   2. Express
   3. NestJS
   4. AdonisJS
   5. Hono
   6. Elysia/Bun
   ```

## Conventions

### Naming
- File: `{action}.schema.ts` (e.g., `create.schema.ts`)
- Export: `{Entity}{Action}Schema` (e.g., `UserCreateSchema`)

### File Placement
- Feature-based: `resources/{entity}/{action}/{action}.schema.ts`

### Rules
- Include all response status codes (success + error cases)
- Error response format: `{ message, code, cause }` consistently
- Include `tags`, `summary`, `description`, `security` sections
- No ternary operators — use if/else or early returns
- No `any` type — use `unknown`, concrete types, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- All functions must have explicit return types
- Multiple conditions use const mapper (object lookup) instead of switch/if-else chains
- Detect project language for descriptions

## Templates

### Fastify Schema (Reference Implementation)

**Create Schema:**
```typescript
import type { FastifySchema } from 'fastify';

export const {Entity}CreateSchema: FastifySchema = {
  tags: ['{Entities}'],
  summary: 'Create a new {entity}',
  description: 'Creates a new {entity} in the system.',
  security: [{ cookieAuth: [] }],

  body: {
    type: 'object',
    required: ['name', 'email'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        description: '{Entity} name',
        errorMessage: {
          type: 'Name must be a string',
          minLength: 'Name is required',
        },
      },
      email: {
        type: 'string',
        format: 'email',
        description: '{Entity} email address',
        errorMessage: {
          type: 'Email must be a string',
          format: 'Enter a valid email',
        },
      },
    },
    additionalProperties: false,
    errorMessage: {
      required: {
        name: 'Name is required',
        email: 'Email is required',
      },
      additionalProperties: 'Extra fields are not allowed',
    },
  },

  response: {
    201: {
      description: '{Entity} created successfully',
      type: 'object',
      properties: {
        _id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
    400: {
      description: 'Invalid request payload',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number' },
        cause: { type: 'string' },
      },
    },
    401: {
      description: 'Authentication required',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number' },
        cause: { type: 'string' },
      },
    },
    409: {
      description: '{Entity} already exists',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number' },
        cause: { type: 'string' },
      },
    },
    500: {
      description: 'Internal server error',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number' },
        cause: { type: 'string' },
      },
    },
  },
};
```

**Show Schema (with params):**
```typescript
import type { FastifySchema } from 'fastify';

export const {Entity}ShowSchema: FastifySchema = {
  tags: ['{Entities}'],
  summary: 'Get {entity} by ID',
  description: 'Returns a single {entity} by its ID.',
  security: [{ cookieAuth: [] }],

  params: {
    type: 'object',
    required: ['_id'],
    properties: {
      _id: { type: 'string', description: '{Entity} ID' },
    },
  },

  response: {
    200: {
      description: '{Entity} found',
      type: 'object',
      properties: {
        _id: { type: 'string' },
        name: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
    404: {
      description: '{Entity} not found',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number' },
        cause: { type: 'string' },
      },
    },
  },
};
```

**Paginated Schema (with querystring):**
```typescript
import type { FastifySchema } from 'fastify';

export const {Entity}PaginatedSchema: FastifySchema = {
  tags: ['{Entities}'],
  summary: 'List {entities} with pagination',
  description: 'Returns a paginated list of {entities}.',
  security: [{ cookieAuth: [] }],

  querystring: {
    type: 'object',
    properties: {
      page: { type: 'number', minimum: 1, default: 1 },
      perPage: { type: 'number', minimum: 1, maximum: 100, default: 50 },
      search: { type: 'string' },
    },
  },

  response: {
    200: {
      description: 'Paginated list of {entities}',
      type: 'object',
      properties: {
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            perPage: { type: 'number' },
            page: { type: 'number' },
            lastPage: { type: 'number' },
            firstPage: { type: 'number' },
          },
        },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  },
};
```

### swagger-jsdoc (Express)

```typescript
/**
 * @openapi
 * /api/{entities}:
 *   post:
 *     tags: [{Entities}]
 *     summary: Create a new {entity}
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: {Entity} created successfully
 *       400:
 *         description: Invalid request
 *       409:
 *         description: {Entity} already exists
 */
```

### @nestjs/swagger (NestJS)

```typescript
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('{entities}')
@ApiBearerAuth()
@Controller('{entities}')
export class {Entity}Controller {
  @Post()
  @ApiOperation({ summary: 'Create a new {entity}' })
  @ApiResponse({ status: 201, description: '{Entity} created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 409, description: '{Entity} already exists' })
  async create(@Body() dto: Create{Entity}Dto) {
    // ...
  }
}
```

### @hono/zod-openapi (Hono)

```typescript
import { createRoute, z } from '@hono/zod-openapi';

export const create{Entity}Route = createRoute({
  method: 'post',
  path: '/{entities}',
  tags: ['{Entities}'],
  summary: 'Create a new {entity}',
  request: {
    body: {
      content: {
        'application/json': {
          schema: {Entity}CreateBodyValidator,
        },
      },
    },
  },
  responses: {
    201: {
      description: '{Entity} created successfully',
      content: {
        'application/json': {
          schema: z.object({
            _id: z.string(),
            name: z.string(),
          }),
        },
      },
    },
  },
});
```

### AdonisJS v6/v7 (OpenAPI with @adonisjs/swagger or manual)

**Manual OpenAPI Schema:**
```typescript
// app/schemas/{entity}_schema.ts
export const {Entity}CreateSchema = {
  tags: ['{entities}'],
  description: 'Create a new {entity}',
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 255 },
      status: { type: 'string', enum: ['active', 'inactive'] },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        name: { type: 'string' },
        status: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    400: { $ref: '#/components/schemas/ErrorResponse' },
    401: { $ref: '#/components/schemas/ErrorResponse' },
  },
}
```

**With @adonisjs/swagger (auto-generated from Lucid models):**
```typescript
// config/swagger.ts
import { defineConfig } from '@adonisjs/swagger'

export default defineConfig({
  path: '/documentation',
  title: 'API Documentation',
  version: '1.0.0',
  snakeCase: false,
})
```

## Examples

### Complete Fastify Schema (User Create)

```typescript
import type { FastifySchema } from 'fastify';

export const UserCreateSchema: FastifySchema = {
  tags: ['Users'],
  summary: 'Create a new user',
  description: 'Creates a new user account in the system.',
  security: [{ cookieAuth: [] }],

  body: {
    type: 'object',
    required: ['name', 'email', 'password', 'group'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        description: 'User full name',
        errorMessage: {
          type: 'O nome deve ser um texto',
          minLength: 'O nome é obrigatório',
        },
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address',
        errorMessage: {
          type: 'O email deve ser um texto',
          format: 'Digite um email válido',
        },
      },
      password: {
        type: 'string',
        minLength: 6,
        description: 'User password',
        errorMessage: {
          type: 'A senha deve ser um texto',
          minLength: 'A senha deve ter no mínimo 6 caracteres',
        },
      },
      group: {
        type: 'string',
        minLength: 1,
        description: 'Group ID',
        errorMessage: {
          type: 'O grupo deve ser um texto',
          minLength: 'O grupo é obrigatório',
        },
      },
    },
    additionalProperties: false,
    errorMessage: {
      required: {
        name: 'O nome é obrigatório',
        email: 'O email é obrigatório',
        password: 'A senha é obrigatória',
        group: 'O grupo é obrigatório',
      },
      additionalProperties: 'Campos extras não são permitidos',
    },
  },

  response: {
    201: {
      description: 'User created successfully',
      type: 'object',
      properties: {
        _id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        group: { type: 'object' },
        status: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
    400: {
      description: 'Invalid request payload',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number' },
        cause: { type: 'string' },
      },
    },
    401: {
      description: 'Authentication required',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number' },
        cause: { type: 'string' },
      },
    },
    409: {
      description: 'User already exists',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number' },
        cause: { type: 'string' },
      },
    },
    500: {
      description: 'Internal server error',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number' },
        cause: { type: 'string' },
      },
    },
  },
};
```
