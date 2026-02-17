# Diretorio `start/`

## Visao Geral

O diretorio `start/` contem os dois arquivos fundamentais para a inicializacao da aplicacao: a validacao de variaveis de ambiente e a configuracao completa da instancia Fastify (kernel).

---

## Estrutura

```
start/
├── env.ts       # Validacao e exportacao das variaveis de ambiente
└── kernel.ts    # Configuracao da instancia Fastify
```

---

## `env.ts`

Responsavel por carregar, validar e exportar todas as variaveis de ambiente da aplicacao utilizando Zod.

### Codigo fonte

```typescript
import { config } from 'dotenv';
import { z } from 'zod';

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
config({ path: envFile });

const EnvSchema = z.object({
  LOCALE: z.enum(['pt-br', 'en-us']).default('pt-br'),
  FILE_UPLOAD_MAX_SIZE: z.coerce.number().default(1024 * 1024 * 5),
  FILE_UPLOAD_ACCEPTED: z.string().transform((val) =>
    val.split(';').map((s) => s.trim()).filter(Boolean),
  ),
  FILE_UPLOAD_MAX_FILES_PER_UPLOAD: z.coerce.number().default(10),
  PAGINATION_PER_PAGE: z.coerce.number().default(50),

  DATABASE_URL: z.string().trim(),
  DB_NAME: z.string().trim().default('lowcodejs'),

  EMAIL_PROVIDER_PASSWORD: z.string().trim(),
  EMAIL_PROVIDER_HOST: z.string().trim(),
  EMAIL_PROVIDER_PORT: z.coerce.number(),
  EMAIL_PROVIDER_USER: z.string().trim(),

  JWT_PUBLIC_KEY: z.string().trim(),
  JWT_PRIVATE_KEY: z.string().trim(),
  COOKIE_SECRET: z.string().trim(),
  COOKIE_DOMAIN: z.string().trim().optional(),

  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),

  APP_SERVER_URL: z.string().trim(),
  APP_CLIENT_URL: z.string().trim(),

  LOGO_SMALL_URL: z.string().trim(),
  LOGO_LARGE_URL: z.string().trim(),
});

const validation = EnvSchema.safeParse(process.env);

if (!validation.success) {
  console.error('Invalid environment variables', validation.error.issues);
  throw new Error('Invalid environment variables');
}

export const Env = validation.data;
```

### Carregamento do arquivo `.env`

O arquivo `.env` carregado depende do ambiente:

| Ambiente | Arquivo |
|---|---|
| `test` | `.env.test` |
| `development` / `production` | `.env` |

### Variaveis de ambiente

#### Aplicacao

| Variavel | Tipo | Obrigatoria | Padrao | Descricao |
|---|---|---|---|---|
| `LOCALE` | `enum` | Nao | `pt-br` | Idioma da aplicacao (`pt-br` ou `en-us`) |
| `NODE_ENV` | `enum` | Nao | `development` | Ambiente de execucao (`development`, `test`, `production`) |
| `PORT` | `number` | Nao | `3000` | Porta do servidor HTTP |
| `APP_SERVER_URL` | `string` | Sim | - | URL base do servidor (ex: `http://localhost:3000`) |
| `APP_CLIENT_URL` | `string` | Sim | - | URL do frontend (usado em CORS e emails) |

#### Upload de arquivos

| Variavel | Tipo | Obrigatoria | Padrao | Descricao |
|---|---|---|---|---|
| `FILE_UPLOAD_MAX_SIZE` | `number` | Nao | `5242880` (5MB) | Tamanho maximo por arquivo em bytes |
| `FILE_UPLOAD_ACCEPTED` | `string` | Sim | - | Tipos aceitos separados por `;` (ex: `image/png;image/jpeg;application/pdf`) |
| `FILE_UPLOAD_MAX_FILES_PER_UPLOAD` | `number` | Nao | `10` | Numero maximo de arquivos por upload |

A variavel `FILE_UPLOAD_ACCEPTED` passa por uma transformacao: a string e dividida por `;`, cada item e trimado e valores vazios sao removidos, resultando em um array de strings.

#### Paginacao

| Variavel | Tipo | Obrigatoria | Padrao | Descricao |
|---|---|---|---|---|
| `PAGINATION_PER_PAGE` | `number` | Nao | `50` | Numero de itens por pagina |

#### Banco de dados

| Variavel | Tipo | Obrigatoria | Padrao | Descricao |
|---|---|---|---|---|
| `DATABASE_URL` | `string` | Sim | - | URL de conexao com o MongoDB |
| `DB_NAME` | `string` | Nao | `lowcodejs` | Nome do banco de dados |

#### Email

| Variavel | Tipo | Obrigatoria | Padrao | Descricao |
|---|---|---|---|---|
| `EMAIL_PROVIDER_HOST` | `string` | Sim | - | Host do servidor SMTP |
| `EMAIL_PROVIDER_PORT` | `number` | Sim | - | Porta do servidor SMTP |
| `EMAIL_PROVIDER_USER` | `string` | Sim | - | Usuario SMTP |
| `EMAIL_PROVIDER_PASSWORD` | `string` | Sim | - | Senha SMTP |

#### Autenticacao

| Variavel | Tipo | Obrigatoria | Padrao | Descricao |
|---|---|---|---|---|
| `JWT_PUBLIC_KEY` | `string` | Sim | - | Chave publica RS256 codificada em Base64 |
| `JWT_PRIVATE_KEY` | `string` | Sim | - | Chave privada RS256 codificada em Base64 |
| `COOKIE_SECRET` | `string` | Sim | - | Segredo para assinatura de cookies |
| `COOKIE_DOMAIN` | `string` | Nao | - | Dominio dos cookies (ex: `.lowcodejs.org`) |

#### Identidade visual

| Variavel | Tipo | Obrigatoria | Padrao | Descricao |
|---|---|---|---|---|
| `LOGO_SMALL_URL` | `string` | Sim | - | URL do logo pequeno |
| `LOGO_LARGE_URL` | `string` | Sim | - | URL do logo grande |

### Validacao

A validacao utiliza `safeParse` do Zod, que nao lanca excecoes. Se a validacao falhar:

1. Os erros sao logados no console com `console.error`
2. Um `Error('Invalid environment variables')` e lancado, impedindo a aplicacao de iniciar

```
// Exemplo de saida em caso de erro:
Invalid environment variables [
  {
    code: 'invalid_type',
    expected: 'string',
    received: 'undefined',
    path: ['DATABASE_URL'],
    message: 'Required'
  }
]
```

---

## `kernel.ts`

Arquivo central que configura a instancia do Fastify com todos os plugins, middlewares, error handler, documentacao e bootstrap dos controllers.

### Codigo fonte completo

```typescript
import 'reflect-metadata';

import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import _static from '@fastify/static';
import swagger from '@fastify/swagger';
import scalar from '@scalar/fastify-api-reference';
import ajv from 'ajv-errors';
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
  ajv: {
    customOptions: {
      allErrors: true,
    },
    plugins: [ajv],
  },
});

// ... configuracoes de plugins e error handler

export { kernel };
```

### Instancia Fastify

```typescript
const kernel = fastify({
  logger: false,
  ajv: {
    customOptions: {
      allErrors: true,   // Retorna todos os erros de validacao, nao apenas o primeiro
    },
    plugins: [ajv],       // ajv-errors para mensagens customizadas
  },
});
```

---

### Plugins registrados

#### 1. CORS

```typescript
kernel.register(cors, {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://lowcodejs.org',
      Env.APP_CLIENT_URL,
      Env.APP_SERVER_URL,
    ];

    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: [
    'Content-Type', 'Authorization', 'Cookie',
    'X-Requested-With', 'Accept', 'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'X-Timezone',
  ],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200,
});
```

**Origens permitidas:**
- `https://lowcodejs.org` (producao)
- `APP_CLIENT_URL` (variavel de ambiente)
- `APP_SERVER_URL` (variavel de ambiente)
- Requisicoes sem `origin` (Postman, apps mobile) sao permitidas

**Headers personalizados:**
- `X-Timezone`: enviado pelo frontend para operacoes com fuso horario

#### 2. Cookie

```typescript
kernel.register(cookie, {
  secret: Env.COOKIE_SECRET,
});
```

#### 3. JWT (RS256)

```typescript
const expiresIn = 60 * 60 * 24 * 1; // 1 dia (24h)

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
```

**Detalhes:**
- Algoritmo: **RS256** (RSA com SHA-256)
- Chaves: decodificadas de Base64 para Buffer
- Access token: expira em **24 horas**
- Refresh token: expira em **7 dias** (configurado no momento da assinatura)
- Cookie: o token e lido automaticamente do cookie `accessToken`
- Cookies nao sao assinados (`signed: false`) pois a seguranca esta no JWT

#### 4. Multipart

```typescript
kernel.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});
```

Limite de 5MB por arquivo no upload multipart.

#### 5. Static

```typescript
kernel.register(_static, {
  root: join(process.cwd(), '_storage'),
  prefix: '/storage/',
});
```

Serve arquivos do diretorio `_storage/` na rota `/storage/`. Por exemplo, um arquivo em `_storage/imagem.png` fica acessivel em `http://servidor/storage/imagem.png`.

#### 6. Swagger

```typescript
kernel.register(swagger, {
  openapi: {
    info: {
      title: 'LowCodeJs API',
      version: '1.0.0',
      description: 'LowCodeJs API with JWT cookie-based authentication',
    },
    servers: [
      {
        url: Env.APP_SERVER_URL,
        description: 'Base URL',
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
```

Gera a especificacao OpenAPI 3.0 automaticamente a partir dos schemas dos controllers.

#### 7. Scalar

```typescript
kernel.register(scalar, {
  routePrefix: '/documentation',
  configuration: {
    title: 'LowCodeJs API',
    description: 'LowCodeJs API Documentation',
    version: '1.0.0',
    theme: 'default',
  },
});
```

Interface grafica para a documentacao da API, acessivel em `/documentation`.

---

### Error Handler

O error handler global padroniza todas as respostas de erro da aplicacao:

```typescript
kernel.setErrorHandler((error, request, response) => {
  // 1. HTTPException (erros de negocio)
  if (error instanceof HTTPException) {
    return response.status(error.code).send({
      message: error.message,
      code: error.code,
      cause: error.cause,
      ...(error.errors && { errors: error.errors }),
    });
  }

  // 2. ZodError (validacao Zod)
  if (error instanceof ZodError) {
    const fieldErrors = z.flattenError(error).fieldErrors;
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

  // 3. FST_ERR_VALIDATION (validacao AJV/Fastify)
  if (error.code === 'FST_ERR_VALIDATION') {
    // ... extrai erros de validacao
    return response.status(error.statusCode).send({
      message: 'Invalid request',
      code: error.statusCode,
      cause: 'INVALID_PAYLOAD_FORMAT',
      ...(Object.keys(errors).length > 0 && { errors }),
    });
  }

  // 4. Erro generico (fallback)
  return response.status(500).send({
    message: 'Internal server error',
    cause: 'SERVER_ERROR',
    code: 500,
  });
});
```

**Formato padrao de resposta de erro:**

```json
{
  "message": "Descricao do erro",
  "code": 400,
  "cause": "CODIGO_DA_CAUSA",
  "errors": {
    "campo": "Mensagem de erro do campo"
  }
}
```

| Tipo de erro | Status | Causa |
|---|---|---|
| `HTTPException` | Variavel (400-511) | Definida pelo desenvolvedor |
| `ZodError` | 400 | `INVALID_PAYLOAD_FORMAT` |
| `FST_ERR_VALIDATION` | Variavel | `INVALID_PAYLOAD_FORMAT` |
| Erro generico | 500 | `SERVER_ERROR` |

---

### Registro de Dependencias

```typescript
registerDependencies();
```

Chamado antes do bootstrap dos controllers, registra todos os pares contrato-implementacao no `injectablesHolder` do fastify-decorators.

---

### Bootstrap de Controllers

```typescript
kernel.register(bootstrap, {
  controllers: [...(await loadControllers())],
});
```

O carregamento dos controllers e feito dinamicamente pela funcao `loadControllers()`:

```typescript
// application/core/controllers.ts
export async function loadControllers(): Promise<Controllers> {
  const controllers: Controllers = [];
  const controllersPath = join(process.cwd(), 'application/resources');
  const files = await readdir(controllersPath, { recursive: true });

  const controllerFiles = files
    .filter((file) => controllerPattern.test(file))
    .sort((a, b) => a.localeCompare(b));

  for (const file of controllerFiles) {
    const module = await import(join(controllersPath, file));
    controllers.push(module.default);
  }

  return controllers;
}
```

**Comportamento:**
- Busca recursivamente todos os arquivos `*.controller.ts` (ou `.js`) dentro de `application/resources/`
- Exclui arquivos de teste (`*.spec.*`)
- Ordena alfabeticamente para carregamento deterministico
- Em modo `development`, loga cada controller carregado no console

---

### Endpoint OpenAPI JSON

```typescript
kernel.get('/openapi.json', async function () {
  return kernel.swagger();
});
```

Disponibiliza a especificacao OpenAPI em formato JSON, util para integracao com ferramentas externas.

---

### Resumo dos endpoints de infraestrutura

| Rota | Descricao |
|---|---|
| `/documentation` | Interface Scalar para documentacao da API |
| `/openapi.json` | Especificacao OpenAPI 3.0 em JSON |
| `/storage/*` | Arquivos estaticos do diretorio `_storage/` |
