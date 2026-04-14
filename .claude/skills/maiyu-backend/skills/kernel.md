---
name: maiyu:backend-kernel
description: |
  Generates server bootstrap/kernel setup for backend Node.js projects.
  Use when: user asks to create server setup, bootstrap, kernel, app initialization,
  or mentions "kernel", "bootstrap", "server setup" for initial server configuration.
  Supports: CORS, JWT, cookies, file upload, Swagger, error handling, DI.
  Frameworks: Fastify, Express, NestJS, Hono.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating, detect:

1. From `dependencies`: `fastify` | `express` | `@nestjs/core` | `hono`
2. Detect plugins: `@fastify/cors` | `@fastify/jwt` | `@fastify/cookie` | `@fastify/multipart` | `@fastify/swagger`
3. Check for existing kernel: `start/kernel.ts` | `src/app.ts` | `src/main.ts`

## Conventions

### Rules
- No ternary operators — use if/else or early returns
- No `any` type — use `unknown`, concrete types, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- All functions must have explicit return types
- Multiple conditions use const mapper (object lookup) instead of switch/if-else chains

### File Placement
- `start/kernel.ts` (Fastify)
- `src/app.ts` (Express)
- `src/main.ts` (NestJS)
- `src/index.ts` (Hono)

## Templates

### Fastify Kernel (Reference Implementation)

```typescript
// start/kernel.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import swagger from '@fastify/swagger';
import scalar from '@scalar/fastify-api-reference';
import { bootstrap } from 'fastify-decorators';
import { ZodError } from 'zod';
import path from 'node:path';

import { Env } from '@start/env';
import HTTPException from '@application/core/exception.core';
import { registerDependencies } from '@application/core/di-registry';

// Wildcard CORS origin matching (e.g., *.example.com)
function matchOrigin(origin: string, allowedOrigins: Array<string>): boolean {
  for (const allowed of allowedOrigins) {
    if (allowed === origin) return true;

    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      if (origin.endsWith(domain)) return true;
    }
  }
  return false;
}

export async function kernel(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  // CORS
  await app.register(cors, {
    credentials: true,
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (matchOrigin(origin, Env.ALLOWED_ORIGINS)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'), false);
    },
  });

  // JWT (RS256 asymmetric)
  await app.register(jwt, {
    secret: {
      public: Env.JWT_PUBLIC_KEY,
      private: Env.JWT_PRIVATE_KEY,
    },
    sign: { algorithm: 'RS256' },
  });

  // Cookies
  await app.register(cookie, {
    secret: Env.COOKIE_SECRET,
  });

  // File upload
  await app.register(multipart, {
    limits: {
      fileSize: Env.FILE_UPLOAD_MAX_SIZE,
      files: Env.FILE_UPLOAD_MAX_FILES_PER_UPLOAD,
    },
  });

  // Static files
  await app.register(fastifyStatic, {
    root: path.resolve(process.cwd(), '_storage'),
    prefix: '/_storage/',
  });

  // Swagger/OpenAPI
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'API',
        version: '1.0.0',
      },
    },
  });

  await app.register(scalar, {
    routePrefix: '/docs',
  });

  // Error handler
  app.setErrorHandler((error, request, reply) => {
    // HTTPException (custom errors)
    if (error instanceof HTTPException) {
      return reply.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
        errors: error.errors,
      });
    }

    // ZodError (validation)
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of error.issues) {
        fieldErrors[issue.path.join('.')] = issue.message;
      }
      return reply.status(400).send({
        message: 'Validation error',
        code: 400,
        cause: 'INVALID_PAYLOAD_FORMAT',
        errors: fieldErrors,
      });
    }

    // Fastify validation (AJV)
    if ('validation' in error && error.validation) {
      return reply.status(400).send({
        message: error.message,
        code: 400,
        cause: 'SCHEMA_VALIDATION_ERROR',
      });
    }

    // Unknown
    request.log.error(error);
    return reply.status(500).send({
      message: 'Internal server error',
      code: 500,
      cause: 'INTERNAL_ERROR',
    });
  });

  // Register DI
  registerDependencies();

  // Bootstrap controllers
  await app.register(bootstrap, {
    directory: path.resolve(process.cwd(), 'application', 'resources'),
    mask: /\.controller\./,
  });

  return app;
}
```

### Express App

```typescript
// src/app.ts
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { Env } from '@/config/env';
import { errorHandler } from '@/middlewares/error-handler';

const app = express();

// Middleware
app.use(cors({ origin: Env.ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());
app.use(cookieParser(Env.COOKIE_SECRET));

// Static files
app.use('/_storage', express.static('_storage'));

// Routes
app.use('/users', usersRouter);
app.use('/authentication', authRouter);

// Health check
app.get('/health-check', (_req, res) => res.json({ status: 'ok' }));

// Error handler (MUST be last)
app.use(errorHandler);

export { app };
```

### NestJS Main

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: process.env.ALLOWED_ORIGINS, credentials: true });
  app.use(cookieParser(process.env.COOKIE_SECRET));
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
```

### Server Entry Point

```typescript
// bin/server.ts
import { MongooseConnect } from '@config/database.config';
import { kernel } from '@start/kernel';
import { Env } from '@start/env';

async function main(): Promise<void> {
  await MongooseConnect();
  const app = await kernel();
  await app.ready();
  await app.listen({ port: Env.PORT, host: '0.0.0.0' });
}

main();
```

## Checklist

- [ ] CORS with wildcard subdomain support
- [ ] JWT setup (RS256 or HS256)
- [ ] Cookie parsing with secret
- [ ] File upload limits
- [ ] Swagger/OpenAPI documentation
- [ ] Unified error handler
- [ ] DI registration
- [ ] Controller/route discovery
- [ ] Health check endpoint
