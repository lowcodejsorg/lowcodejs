# Skill: Kernel (Startup)

O kernel e o ponto de entrada do servidor backend. Ele cria a instancia do Fastify, registra todos os plugins (CORS, Cookie, JWT, Multipart, Swagger), configura o error handler global, executa o registro de dependencias e faz o bootstrap dos controllers. Este arquivo e o "fio condutor" que conecta todas as camadas da aplicacao: plugins de infraestrutura, DI container, rotas e tratamento de erros. Qualquer alteracao na inicializacao do servidor passa obrigatoriamente por aqui.

---

## Estrutura do Arquivo

```
backend/
  start/
    kernel.ts                <-- arquivo principal de inicializacao
    env.ts                   <-- variaveis de ambiente (Zod schema)
  application/
    core/
      di-registry.ts         <-- registro de dependencias (chamado pelo kernel)
      controllers.ts         <-- loader de controllers (chamado pelo kernel)
      exception.ts      <-- HTTPException (usado no error handler)
```

- O kernel vive em `backend/start/kernel.ts`.
- Ele importa e orquestra modulos de `@application/core/` e `@start/`.
- O arquivo exporta a instancia configurada do Fastify: `export { kernel }`.

---

## Template

```typescript
// backend/start/kernel.ts

import 'reflect-metadata';                               // DEVE ser o primeiro import

import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import scalar from '@scalar/fastify-api-reference';
import fastify from 'fastify';
import { bootstrap } from 'fastify-decorators';
import { ZodError } from 'zod';

import { loadControllers } from '@application/core/controllers';
import { registerDependencies } from '@application/core/di-registry';
import HTTPException from '@application/core/exception';
import { Env } from '@start/env';

const kernel = fastify({
  logger: false,
  ajv: { customOptions: { allErrors: true }, plugins: [/* ajv plugins */] },
});

// 1. CORS
kernel.register(cors, {
  origin: (origin, cb) => {
    const allowedOrigins = [/* lista de origens permitidas */];
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
});

// 2. Cookie
kernel.register(cookie, { secret: Env.COOKIE_SECRET });

// 3. JWT (RS256)
kernel.register(jwt, {
  secret: {
    private: Buffer.from(Env.JWT_PRIVATE_KEY, 'base64'),
    public: Buffer.from(Env.JWT_PUBLIC_KEY, 'base64'),
  },
  sign: { algorithm: 'RS256' },
});

// 4. Multipart
kernel.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });

// 5. Static files
import _static from '@fastify/static';
import { join } from 'node:path';
kernel.register(_static, {
  root: join(process.cwd(), '_storage'),
  prefix: '/storage/',
});

// 6. Swagger + Scalar (API docs at /documentation)
kernel.register(swagger, {
  openapi: { info: { title: 'API', version: '1.0.0' } },
});
kernel.register(scalar, {
  routePrefix: '/documentation',
  configuration: { title: 'API', theme: 'default' },
});

// 6. Error handler global
kernel.setErrorHandler((error, request, response) => {
  // HTTPException (erros de dominio)
  if (error instanceof HTTPException) {
    return response.status(error.code).send({
      message: error.message,
      code: error.code,
      cause: error.cause,
    });
  }

  // ZodError (erros de validacao Zod)
  if (error instanceof ZodError) {
    const flatErrors = error.flatten();
    return response.status(400).send({
      message: 'Validation error',
      code: 400,
      cause: 'VALIDATION_ERROR',
      errors: flatErrors.fieldErrors,
    });
  }

  // Fastify validation error (FST_ERR_VALIDATION)
  if (error.code === 'FST_ERR_VALIDATION') {
    return response.status(400).send({
      message: error.message,
      code: 400,
      cause: 'VALIDATION_ERROR',
    });
  }

  // Erro generico (500)
  return response.status(500).send({
    message: 'Internal server error',
    cause: 'SERVER_ERROR',
    code: 500,
  });
});

// 7. Registro de dependencias (ANTES do bootstrap)
registerDependencies();

// 8. Bootstrap dos controllers
kernel.register(bootstrap, {
  controllers: [...(await loadControllers())],
});

export { kernel };
```

---

## Exemplo Real

```typescript
import 'reflect-metadata';

import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import scalar from '@scalar/fastify-api-reference';
import fastify from 'fastify';
import { bootstrap } from 'fastify-decorators';
import { ZodError } from 'zod';

import { loadControllers } from '@application/core/controllers';
import { registerDependencies } from '@application/core/di-registry';
import HTTPException from '@application/core/exception';
import { Env } from '@start/env';

const kernel = fastify({ logger: false, ajv: { customOptions: { allErrors: true } } });

// CORS com allowlist
kernel.register(cors, {
  origin: (origin, cb) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      Env.FRONTEND_URL,
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
});

// Cookie com secret do ambiente
kernel.register(cookie, { secret: Env.COOKIE_SECRET });

// JWT RS256 com chaves em base64
kernel.register(jwt, {
  secret: {
    private: Buffer.from(Env.JWT_PRIVATE_KEY, 'base64'),
    public: Buffer.from(Env.JWT_PUBLIC_KEY, 'base64'),
  },
  sign: { algorithm: 'RS256' },
});

// Upload de arquivos com limite de 5MB
kernel.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });

// Documentacao da API
kernel.register(swagger, {
  openapi: {
    info: { title: 'project-name API', version: '1.0.0' },
  },
});
kernel.register(scalar, {
  routePrefix: '/documentation',
});

// Error handler centralizado
kernel.setErrorHandler((error, request, response) => {
  if (error instanceof HTTPException) {
    return response.status(error.code).send({
      message: error.message,
      code: error.code,
      cause: error.cause,
    });
  }

  if (error instanceof ZodError) {
    const flatErrors = error.flatten();
    return response.status(400).send({
      message: 'Validation error',
      code: 400,
      cause: 'VALIDATION_ERROR',
      errors: flatErrors.fieldErrors,
    });
  }

  if (error.code === 'FST_ERR_VALIDATION') {
    return response.status(400).send({
      message: error.message,
      code: 400,
      cause: 'VALIDATION_ERROR',
    });
  }

  return response.status(500).send({
    message: 'Internal server error',
    cause: 'SERVER_ERROR',
    code: 500,
  });
});

// DI antes do bootstrap
registerDependencies();

// Bootstrap dos controllers
kernel.register(bootstrap, {
  controllers: [...(await loadControllers())],
});

export { kernel };
```

**Leitura do exemplo:**

1. `reflect-metadata` e o primeiro import do arquivo. Ele e obrigatorio para que os decorators do `fastify-decorators` funcionem corretamente em runtime.
2. Os plugins sao registrados na ordem: CORS, Cookie, JWT, Multipart, Swagger/Scalar. Essa ordem importa porque alguns plugins dependem de outros (ex.: JWT depende de Cookie para assinar tokens nos cookies).
3. O CORS usa uma allowlist explicita de origens. Origens nao listadas sao rejeitadas. O `credentials: true` permite envio de cookies cross-origin.
4. O JWT usa algoritmo RS256 com par de chaves publica/privada codificadas em base64. Isso e mais seguro que HMAC (HS256) pois a chave privada nunca precisa ser compartilhada.
5. O error handler trata 4 categorias na ordem de prioridade: `HTTPException` (erros de dominio vindos dos use cases via Either), `ZodError` (validacao de schema), `FST_ERR_VALIDATION` (validacao nativa do Fastify/AJV), e fallback generico 500.
6. `registerDependencies()` e chamado **antes** do `bootstrap`. Isso garante que todos os bindings de DI estejam prontos quando os controllers forem instanciados e suas dependencias resolvidas.
7. `loadControllers()` carrega dinamicamente todos os controllers registrados, e o `bootstrap` os registra como rotas no Fastify.

---

## Regras e Convencoes

1. **`reflect-metadata` como primeiro import** -- este import deve ser a primeira linha do arquivo, antes de qualquer outro import. Sem ele, os decorators `@Controller`, `@Service`, `@Inject` do `fastify-decorators` nao funcionam.

2. **Ordem de registro dos plugins** -- sempre registrar na sequencia: CORS, Cookie, JWT, Multipart, `@fastify/static` (para servir arquivos estaticos como uploads em `/_storage`), Swagger, Scalar. Alterar a ordem pode causar problemas de dependencia entre plugins.

3. **CORS com allowlist** -- nunca use `origin: true` ou `origin: '*'` em producao. Sempre mantenha uma lista explicita de origens permitidas. Inclua as URLs de desenvolvimento (localhost) e a URL do frontend em producao via `Env.FRONTEND_URL`.

4. **JWT RS256 com chaves base64 e autenticacao via cookie** -- as chaves JWT sao armazenadas como strings base64 nas variaveis de ambiente e decodificadas com `Buffer.from(key, 'base64')`. O JWT e transportado via cookie HTTP-only (`accessToken`), configurado com `cookie: { signed: false, cookieName: 'accessToken' }` no plugin JWT. Nunca armazene chaves PEM diretamente em variaveis de ambiente.

5. **Error handler trata 4 camadas** -- a ordem de checagem no error handler e importante:
   - `HTTPException` (erros de dominio -- 4xx/5xx)
   - `ZodError` (validacao de schemas -- 400)
   - `FST_ERR_VALIDATION` (validacao do Fastify/AJV -- 400)
   - Fallback generico (qualquer outro erro -- 500)

6. **`registerDependencies()` antes do `bootstrap`** -- esta e uma regra critica. Se o bootstrap ocorrer antes do registro de dependencias, os controllers tentarao resolver injecoes que ainda nao existem, resultando em `Cannot resolve dependency`.

7. **Arquivo unico de kernel** -- toda a configuracao de inicializacao do servidor fica neste arquivo. Nao crie multiplos arquivos de bootstrap ou configuracao espalhados.

8. **Export nomeado** -- o kernel e exportado como named export: `export { kernel }`. O arquivo `server.ts` ou `index.ts` importa e chama `kernel.listen()`.

9. **Logger desabilitado por padrao** -- o Fastify e criado com `logger: false`. Se necessario, ative via variavel de ambiente, nao hardcoded.

10. **Limite de upload explicito** -- o `multipart` sempre deve ter um `fileSize` limit configurado. O padrao do projeto e 5MB (`5 * 1024 * 1024`).

---

## Checklist

- [ ] O arquivo esta em `backend/start/kernel.ts`.
- [ ] `import 'reflect-metadata'` e o primeiro import do arquivo.
- [ ] Os plugins estao registrados na ordem: CORS, Cookie, JWT, Multipart, Static, Swagger, Scalar.
- [ ] `@fastify/static` configurado para servir arquivos de `_storage` no prefixo `/storage/`.
- [ ] Scalar configurado com `routePrefix: '/documentation'` para documentacao da API.
- [ ] O CORS usa allowlist explicita de origens (nao `origin: true`).
- [ ] O CORS tem `credentials: true`.
- [ ] O JWT usa algoritmo RS256 com chaves decodificadas de base64.
- [ ] O Multipart tem `fileSize` limit configurado.
- [ ] O error handler trata `HTTPException`, `ZodError`, `FST_ERR_VALIDATION` e fallback 500.
- [ ] `registerDependencies()` e chamado antes de `kernel.register(bootstrap, ...)`.
- [ ] Os controllers sao carregados via `loadControllers()` e passados ao `bootstrap`.
- [ ] O kernel e exportado como named export: `export { kernel }`.
- [ ] Nenhuma chave secreta esta hardcoded -- todas vem de `Env`.

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| `Cannot resolve dependency` no startup | `registerDependencies()` nao foi chamado ou foi chamado depois do `bootstrap` | Mover `registerDependencies()` para antes de `kernel.register(bootstrap, ...)` |
| Decorators nao funcionam em runtime | `reflect-metadata` nao foi importado ou nao e o primeiro import | Adicionar `import 'reflect-metadata'` como primeira linha do arquivo |
| CORS bloqueando requests do frontend | Origem do frontend nao esta na allowlist | Adicionar a URL do frontend ao array `allowedOrigins` |
| Cookies nao enviados em requests cross-origin | `credentials: true` nao esta configurado no CORS | Adicionar `credentials: true` na configuracao do CORS |
| JWT `invalid algorithm` | Chaves RSA sendo usadas com algoritmo HS256 (ou vice-versa) | Garantir que `sign: { algorithm: 'RS256' }` esta configurado e as chaves sao RSA |
| JWT `invalid key` | Chaves base64 mal formatadas ou trocadas (privada no lugar da publica) | Verificar que `private` recebe a chave privada e `public` recebe a chave publica, ambas em base64 valido |
| Upload rejeitado sem mensagem clara | Arquivo excede o limite de `fileSize` do multipart | Ajustar o limite em `multipart.limits.fileSize` ou tratar o erro no controller |
| `ZodError` retornando 500 ao inves de 400 | Error handler nao trata `ZodError` antes do fallback generico | Adicionar checagem `error instanceof ZodError` antes do fallback 500 |
| Erros de validacao do Fastify retornando 500 | Error handler nao trata `FST_ERR_VALIDATION` | Adicionar checagem `error.code === 'FST_ERR_VALIDATION'` no error handler |
| Swagger nao carregando em `/documentation` | Plugin Scalar nao registrado ou `routePrefix` incorreto | Registrar `scalar` com `routePrefix: '/documentation'` apos o registro do `swagger` |
| Plugins registrados fora de ordem | JWT registrado antes do Cookie, causando erro de dependencia | Seguir a ordem: CORS, Cookie, JWT, Multipart, Static, Swagger, Scalar |

---

**Cross-references:** ver [011-skill-di-registry.md](./011-skill-di-registry.md) para o registro de dependencias chamado pelo kernel, [010-skill-core-either.md](./010-skill-core-either.md) para o `HTTPException` tratado no error handler, [013-skill-utils.md](./013-skill-utils.md) para os utils de JWT e Cookie que dependem dos plugins registrados aqui.
