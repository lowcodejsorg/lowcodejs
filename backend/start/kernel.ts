import 'reflect-metadata';

import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import _static from '@fastify/static';
import swagger from '@fastify/swagger';
import scalar from '@scalar/fastify-api-reference';
import fastify from 'fastify';
import { bootstrap } from 'fastify-decorators';
import { join } from 'node:path';
import z, { ZodError } from 'zod';

import { loadControllers } from '@application/core/controllers';
import { registerDependencies } from '@application/core/di-registry';
import HTTPException from '@application/core/exception.core';
import { Env } from '@start/env';

const kernel = fastify({
  logger: false,
});

kernel.register(cors, {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://lowcodejs.org',
      Env.APP_CLIENT_URL,
      Env.APP_SERVER_URL,
    ];

    // Permitir requisições sem origin (ex: Postman, mobile apps)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cookie',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'X-Timezone',
  ],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200,
  preflightContinue: false,
  preflight: true,
});

kernel.register(cookie, {
  secret: Env.COOKIE_SECRET,
});

const expiresIn = 60 * 60 * 24 * 1; // 1 day

kernel.register(jwt, {
  secret: {
    private: Buffer.from(Env.JWT_PRIVATE_KEY, 'base64'),
    public: Buffer.from(Env.JWT_PUBLIC_KEY, 'base64'),
  },
  sign: { expiresIn: expiresIn, algorithm: 'RS256' },
  verify: { algorithms: ['RS256'] },
  cookie: {
    signed: false,
    cookieName: 'accessToken',
  },
});

kernel.register(multipart, {});

kernel.register(_static, {
  root: join(process.cwd(), '_storage'),
  prefix: '/storage/',
});

kernel.setErrorHandler((error: Record<string, unknown>, _, response) => {
  // console.error('setErrorHandler', error);

  if (error instanceof HTTPException) {
    return response.status(error.code).send({
      message: error.message,
      code: error.code,
      cause: error.cause,
    });
  }

  if (error instanceof ZodError) {
    const fieldErrors = z.flattenError(error).fieldErrors as Record<
      string,
      string[]
    >;

    const errors = Object.entries(fieldErrors).reduce(
      (acc, [key, [value]]) => {
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>,
    );

    return response.status(400).send({
      message: 'Invalid request',
      code: 400,
      cause: 'INVALID_PAYLOAD_FORMAT',
      errors,
    });
  }

  if (error.code === 'FST_ERR_VALIDATION') {
    return response.status(Number(error.statusCode)).send({
      message: 'Invalid request',
      code: error.statusCode,
      cause: 'PAYLOAD_SERIALIZATION_ERROR',
    });
  }

  return response.status(500).send({
    message: 'Internal server error',
    cause: 'SERVER_ERROR',
    code: 500,
  });
});

kernel.register(swagger, {
  openapi: {
    info: {
      title: 'LowCodeJs API',
      version: '1.0.0',
      description: 'LowCodeJs API with JWT cookie-based authentication',
    },
    servers: [
      // {
      //   url: 'http://localhost:3000',
      //   description: 'Development server',
      // },
      {
        url: 'https://api.demo.lowcodejs.org',
        description: 'Demo server',
      },
      {
        url: 'https://api.develop.lowcodejs.org',
        description: 'Develop server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
        },
      },
    },
  },
});

kernel.register(scalar, {
  routePrefix: '/documentation',
  configuration: {
    title: 'LowCodeJs API',
    description: 'LowCodeJs API Documentation',
    version: '1.0.0',
    theme: 'default',
  },
});

registerDependencies();

kernel.register(bootstrap, {
  controllers: [...(await loadControllers())],
});

kernel.get('/openapi.json', async function () {
  return kernel.swagger();
});

export { kernel };
