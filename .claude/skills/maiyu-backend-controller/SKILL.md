---
name: maiyu:backend-controller
description: |
  Generates HTTP controller/route handler code for backend Node.js projects.
  Use when: user asks to create controllers, routes, endpoints, HTTP handlers,
  or mentions "controller" for request handling.
  Supports: Fastify decorators, Express Router, NestJS @Controller, Hono, AdonisJS v6/v7, Elysia.
  Frameworks: Fastify, Express, NestJS, AdonisJS v6/v7, Hono, Elysia/Bun.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **Framework**: `fastify` | `express` | `@nestjs/core` | `@adonisjs/core` | `hono` | `elysia`
   - **DI**: `fastify-decorators` | `tsyringe` | `inversify` | `@nestjs/common` | `awilix` | manual
   - **Validator**: `zod` | `class-validator` | `joi` | `@sinclair/typebox`
3. Scan existing controllers to detect:
   - Controller location (e.g., `application/resources/{entity}/{action}/`)
   - Middleware patterns (authentication, authorization)
   - Error handling patterns (Either check, NestJS filters)
4. If framework not detected, ask user:
   ```
   Which framework does your project use?
   1. Fastify (with fastify-decorators)
   2. Fastify (plain)
   3. Express
   4. NestJS
   5. AdonisJS v6/v7
   6. Hono
   7. Elysia/Bun
   ```

## Conventions

### Naming
- File: `{action}.controller.ts` (e.g., `create.controller.ts`)
- Fastify decorators: anonymous default export class
- NestJS/others: named class `{Entity}{Action}Controller` or `{Entity}Controller`

### File Placement
- Feature-based: `resources/{entity}/{action}/{action}.controller.ts`

### Rules
- Parse input with validator BEFORE calling use-case
- Check Either result: `isLeft()` → error response, `isRight()` → success response
- Status codes: 201 create, 200 read/update, 204 delete
- Error response format: `{ message, code, cause }`
- Middleware via decorator options (Fastify) or decorators (NestJS)
- No ternary operators — use if/else or early returns
- No `any` type — use `unknown`, concrete types, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- All functions must have explicit return types
- Multiple conditions use const mapper (object lookup) instead of switch/if-else chains

## Templates

### Fastify + fastify-decorators (Reference Implementation)

**Create Controller (POST):**
```typescript
import { Controller, POST } from 'fastify-decorators';
import { getInstanceByToken } from 'fastify-decorators';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { {Entity}CreateBodyValidator } from './{action}.validator';
import { {Entity}CreateSchema } from './{action}.schema';
import {Entity}CreateUseCase from './{action}.use-case';

@Controller()
export default class {
  constructor(
    private readonly useCase: {Entity}CreateUseCase = getInstanceByToken(
      {Entity}CreateUseCase,
    ),
  ) {}

  @POST({
    url: '/{entities}',
    options: {
      onRequest: [
        AuthenticationMiddleware({ optional: false }),
      ],
      schema: {Entity}CreateSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const body = {Entity}CreateBodyValidator.parse(request.body);

    const result = await this.useCase.execute(body);

    if (result.isLeft()) {
      const error = result.value;
      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return response.status(201).send(result.value);
  }
}
```

**Show Controller (GET with params):**
```typescript
@Controller()
export default class {
  constructor(
    private readonly useCase: {Entity}ShowUseCase = getInstanceByToken(
      {Entity}ShowUseCase,
    ),
  ) {}

  @GET({
    url: '/{entities}/:_id',
    options: {
      onRequest: [AuthenticationMiddleware({ optional: false })],
      schema: {Entity}ShowSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = {Entity}ShowParamValidator.parse(request.params);

    const result = await this.useCase.execute(params);

    if (result.isLeft()) {
      const error = result.value;
      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return response.status(200).send(result.value);
  }
}
```

**Paginated Controller (GET with querystring):**
```typescript
@Controller()
export default class {
  constructor(
    private readonly useCase: {Entity}PaginatedUseCase = getInstanceByToken(
      {Entity}PaginatedUseCase,
    ),
  ) {}

  @GET({
    url: '/{entities}',
    options: {
      onRequest: [AuthenticationMiddleware({ optional: false })],
      schema: {Entity}PaginatedSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const query = {Entity}PaginatedQueryValidator.parse(request.query);

    const result = await this.useCase.execute(query);

    if (result.isLeft()) {
      const error = result.value;
      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return response.status(200).send(result.value);
  }
}
```

**Update Controller (PATCH):**
```typescript
@Controller()
export default class {
  constructor(
    private readonly useCase: {Entity}UpdateUseCase = getInstanceByToken(
      {Entity}UpdateUseCase,
    ),
  ) {}

  @PATCH({
    url: '/{entities}/:_id',
    options: {
      onRequest: [AuthenticationMiddleware({ optional: false })],
      schema: {Entity}UpdateSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = {Entity}UpdateParamsValidator.parse(request.params);
    const body = {Entity}UpdateBodyValidator.parse(request.body);

    const result = await this.useCase.execute({ ...params, ...body });

    if (result.isLeft()) {
      const error = result.value;
      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return response.status(200).send(result.value);
  }
}
```

**Delete Controller (DELETE):**
```typescript
@Controller()
export default class {
  constructor(
    private readonly useCase: {Entity}DeleteUseCase = getInstanceByToken(
      {Entity}DeleteUseCase,
    ),
  ) {}

  @DELETE({
    url: '/{entities}/:_id',
    options: {
      onRequest: [AuthenticationMiddleware({ optional: false })],
      schema: {Entity}DeleteSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = {Entity}DeleteParamValidator.parse(request.params);

    const result = await this.useCase.execute(params);

    if (result.isLeft()) {
      const error = result.value;
      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return response.status(204).send();
  }
}
```

### Express Router

```typescript
import { Router } from 'express';
import type { Request, Response } from 'express';
import { authMiddleware } from '@middlewares/auth.middleware';

const router = Router();

router.post(
  '/{entities}',
  authMiddleware,
  async (req: Request, res: Response) => {
    const body = {Entity}CreateBodyValidator.parse(req.body);
    const result = await useCase.execute(body);

    if (result.isLeft()) {
      const error = result.value;
      return res.status(error.code).json({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return res.status(201).json(result.value);
  },
);

export default router;
```

### NestJS @Controller

```typescript
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@guards/auth.guard';

@Controller('{entities}')
@UseGuards(AuthGuard)
export class {Entity}Controller {
  constructor(
    private readonly createUseCase: {Entity}CreateUseCase,
    private readonly showUseCase: {Entity}ShowUseCase,
    private readonly paginatedUseCase: {Entity}PaginatedUseCase,
    private readonly updateUseCase: {Entity}UpdateUseCase,
    private readonly deleteUseCase: {Entity}DeleteUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: Create{Entity}Dto) {
    const result = await this.createUseCase.execute(dto);

    if (result.isLeft()) {
      const error = result.value;
      throw error;
    }

    return result.value;
  }

  @Get(':id')
  async show(@Param('id') id: string) {
    const result = await this.showUseCase.execute({ _id: id });

    if (result.isLeft()) {
      const error = result.value;
      throw error;
    }

    return result.value;
  }

  @Get()
  async paginated(@Query() query: Paginated{Entity}QueryDto) {
    const result = await this.paginatedUseCase.execute(query);

    if (result.isLeft()) {
      const error = result.value;
      throw error;
    }

    return result.value;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: Update{Entity}Dto) {
    const result = await this.updateUseCase.execute({ _id: id, ...dto });

    if (result.isLeft()) {
      const error = result.value;
      throw error;
    }

    return result.value;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    const result = await this.deleteUseCase.execute({ _id: id });

    if (result.isLeft()) {
      const error = result.value;
      throw error;
    }
  }
}
```

### Hono

```typescript
import { Hono } from 'hono';
import { authMiddleware } from '@middlewares/auth.middleware';

const app = new Hono();

app.use('/{entities}/*', authMiddleware);

app.post('/{entities}', async (c) => {
  const body = {Entity}CreateBodyValidator.parse(await c.req.json());
  const result = await useCase.execute(body);

  if (result.isLeft()) {
    const error = result.value;
    return c.json({ message: error.message, code: error.code, cause: error.cause }, error.code);
  }

  return c.json(result.value, 201);
});

export default app;
```

### Elysia/Bun

```typescript
import { Elysia } from 'elysia';

const app = new Elysia({ prefix: '/{entities}' })
  .post('/', async ({ body }) => {
    const validated = {Entity}CreateBodyValidator.parse(body);
    const result = await useCase.execute(validated);

    if (result.isLeft()) {
      const error = result.value;
      return new Response(
        JSON.stringify({ message: error.message, code: error.code, cause: error.cause }),
        { status: error.code },
      );
    }

    return new Response(JSON.stringify(result.value), { status: 201 });
  });

export default app;
```

### AdonisJS v6/v7 (HttpContext)

**CRUD Controller:**
```typescript
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import {Entity}CreateValidator from '#validators/{entity}_create'
import {Entity}UpdateValidator from '#validators/{entity}_update'

@inject()
export default class {Entity}Controller {
  constructor(
    private readonly createUseCase: {Entity}CreateUseCase,
    private readonly showUseCase: {Entity}ShowUseCase,
    private readonly paginatedUseCase: {Entity}PaginatedUseCase,
    private readonly updateUseCase: {Entity}UpdateUseCase,
    private readonly deleteUseCase: {Entity}DeleteUseCase,
  ) {}

  async index({ request, response }: HttpContext) {
    const query = request.qs()
    const result = await this.paginatedUseCase.execute(query)

    if (result.isLeft()) {
      const error = result.value
      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      })
    }

    return response.status(200).send(result.value)
  }

  async store({ request, response }: HttpContext) {
    const body = await request.validateUsing({Entity}CreateValidator)
    const result = await this.createUseCase.execute(body)

    if (result.isLeft()) {
      const error = result.value
      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      })
    }

    return response.status(201).send(result.value)
  }

  async show({ params, response }: HttpContext) {
    const result = await this.showUseCase.execute({ id: params.id })

    if (result.isLeft()) {
      const error = result.value
      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      })
    }

    return response.status(200).send(result.value)
  }

  async update({ params, request, response }: HttpContext) {
    const body = await request.validateUsing({Entity}UpdateValidator)
    const result = await this.updateUseCase.execute({ id: params.id, ...body })

    if (result.isLeft()) {
      const error = result.value
      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      })
    }

    return response.status(200).send(result.value)
  }

  async destroy({ params, response }: HttpContext) {
    const result = await this.deleteUseCase.execute({ id: params.id })

    if (result.isLeft()) {
      const error = result.value
      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      })
    }

    return response.status(204).send()
  }
}
```

**Route registration (AdonisJS v6/v7):**
```typescript
// start/routes.ts
import router from '@adonisjs/core/services/router'

const {Entity}Controller = () => import('#controllers/{entity}_controller')

router.group(() => {
  router.get('/{entities}', [{Entity}Controller, 'index'])
  router.post('/{entities}', [{Entity}Controller, 'store'])
  router.get('/{entities}/:id', [{Entity}Controller, 'show'])
  router.put('/{entities}/:id', [{Entity}Controller, 'update'])
  router.delete('/{entities}/:id', [{Entity}Controller, 'destroy'])
}).middleware('auth')
```
