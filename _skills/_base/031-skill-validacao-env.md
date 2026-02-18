# Skill: Validacao de Environment

Toda variavel de ambiente da aplicacao deve ser validada antes do uso. O backend usa `dotenv` + Zod `safeParse` em `start/env.ts`, exportando o objeto tipado `Env`. O frontend usa `@t3-oss/env-core` + Zod em `src/env.ts`, exportando `env` com separacao de variaveis server/client e prefixo `VITE_` obrigatorio para variaveis do cliente. Adicionar uma nova variavel de ambiente requer declara-la no schema correspondente, no `.env.example` e usa-la exclusivamente via `Env` (backend) ou `env` (frontend).

---

## Estrutura do Arquivo

```
backend/
  start/
    env.ts                                       <-- validacao backend (dotenv + Zod)
  .env                                           <-- variaveis de ambiente (nao commitado)
  .env.example                                   <-- template com todas as variaveis
  .env.test                                      <-- variaveis para testes

frontend/
  src/
    env.ts                                       <-- validacao frontend (@t3-oss/env-core + Zod)
  .env                                           <-- variaveis de ambiente
  .env.example                                   <-- template
```

---

## Template: Backend (`start/env.ts`)

```typescript
import { config } from 'dotenv';
import { z } from 'zod';

if (process.env.NODE_ENV === 'test') {
  config({ path: '.env.test' });
}

if (!(process.env.NODE_ENV === 'test')) {
  config();
}

const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(4000),

  // {{NOVA_VARIAVEL}}: z.string().trim(),
});

const validation = schema.safeParse(process.env);

if (!validation.success) {
  console.error('Invalid environment variables', validation.error.format());
  throw new Error('Invalid environment variables');
}

export const Env = validation.data;
```

## Template: Frontend (`src/env.ts`)

```typescript
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    // Variaveis server-only (nao expostas ao cliente)
  },

  clientPrefix: 'VITE_',

  client: {
    // Variaveis client (prefixo VITE_ obrigatorio)
    VITE_API_BASE_URL: z.url().default('http://localhost:4000'),
    // VITE_{{NOVA_VARIAVEL}}: z.string().min(1),
  },

  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
});
```

---

## Exemplo Real

### Backend

```typescript
// start/env.ts
import { config } from 'dotenv';
import { z } from 'zod';

if (process.env.NODE_ENV === 'test') {
  config({ path: '.env.test' });
}

if (!(process.env.NODE_ENV === 'test')) {
  config();
}

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),

  JWT_PUBLIC_KEY: z.string().trim(),
  JWT_PRIVATE_KEY: z.string().trim(),
  COOKIE_SECRET: z.string().trim(),
  COOKIE_DOMAIN: z.string().trim().optional(),

  DATABASE_URL: z.string().trim(),
  DB_HOST: z.string().trim().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().trim(),
  DB_PASSWORD: z.string().trim(),
  DB_DATABASE: z.string().trim(),

  ADMINISTRATOR_EMAIL: z.email().trim(),
  ADMINISTRATOR_PASSWORD: z.string().trim(),

  SERVER_URL: z.string().trim(),
  CLIENT_URL: z.string().trim(),

  EMAIL_PROVIDER_PASSWORD: z.string().trim(),
  EMAIL_PROVIDER_HOST: z.string().trim(),
  EMAIL_PROVIDER_PORT: z.coerce.number(),
  EMAIL_PROVIDER_USER: z.string().trim(),
});

const validation = schema.safeParse(process.env);

if (!validation.success) {
  console.error('Invalid environment variables', validation.error.format());
  throw new Error('Invalid environment variables');
}

export const Env = validation.data;
```

### Frontend

```typescript
// src/env.ts
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    SERVER_URL: z.url().optional(),
  },
  clientPrefix: 'VITE_',
  client: {
    VITE_APP_TITLE: z.string().min(1).optional(),
    VITE_API_BASE_URL: z.url().default('http://localhost:4000'),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
});
```

### Uso

```typescript
// Backend: qualquer arquivo
import { Env } from '@start/env';
kernel.listen({ port: Env.PORT, host: '0.0.0.0' });

// Frontend: qualquer arquivo
import { env } from '@/env';
const API = axios.create({ baseURL: env.VITE_API_BASE_URL });
```

**Leitura do exemplo:**

1. **Backend**: `dotenv` carrega `.env` (ou `.env.test` para testes) antes da validacao. O schema Zod valida e tipa todas as variaveis. `safeParse` retorna success/error sem lançar excecao. Se falhar, o processo exibe os erros formatados e faz `throw` para impedir inicializacao.
2. **Frontend**: `createEnv` do `@t3-oss/env-core` combina validacao Zod com separacao server/client. O `clientPrefix: 'VITE_'` garante que apenas variaveis com esse prefixo sao expostas ao bundle. `emptyStringAsUndefined: true` trata strings vazias como undefined (evita que defaults nao sejam aplicados).
3. **Export**: Backend exporta `Env` (uppercase), frontend exporta `env` (lowercase). Ambos sao objetos tipados pelo Zod.
4. **`z.coerce.number()`**: usado para variaveis que sao numeros mas vem como string no `process.env` (ex.: PORT, DB_PORT).
5. **`.trim()`**: aplicado em todas as strings para remover espacos acidentais.
6. **`.optional()` e `.default()`**: `.optional()` para variaveis nao obrigatorias, `.default()` para valores fallback.

---

## Como Adicionar Uma Nova Variavel

### Passo 1: Adicionar ao `.env.example`

```bash
# backend/.env.example
NOVA_VARIAVEL=valor_padrao
```

### Passo 2: Adicionar ao schema Zod

```typescript
// Backend: start/env.ts
const schema = z.object({
  // ... existentes
  NOVA_VARIAVEL: z.string().trim(),
});

// Frontend: src/env.ts (com prefixo VITE_)
client: {
  VITE_NOVA_VARIAVEL: z.string().min(1),
},
```

### Passo 3: Usar via import tipado

```typescript
// Backend
import { Env } from '@start/env';
const valor = Env.NOVA_VARIAVEL;

// Frontend
import { env } from '@/env';
const valor = env.VITE_NOVA_VARIAVEL;
```

---

## Regras e Convencoes

1. **Toda variavel passa pelo schema** -- nunca acesse `process.env.VARIAVEL` ou `import.meta.env.VARIAVEL` diretamente. Sempre use `Env.VARIAVEL` (backend) ou `env.VARIAVEL` (frontend).

2. **`safeParse` no backend, `createEnv` no frontend** -- backend usa `schema.safeParse(process.env)` com tratamento de erro manual. Frontend usa `createEnv` que trata erros automaticamente.

3. **Prefixo `VITE_` obrigatorio no frontend** -- variaveis do cliente (acessiveis no browser) devem ter prefixo `VITE_`. Variaveis server-only ficam na secao `server` do `createEnv`.

4. **`.trim()` em toda string** -- sempre adicione `.trim()` para evitar problemas com espacos em variaveis copiadas.

5. **`z.coerce.number()` para numeros** -- variaveis numericas (PORT, DB_PORT) usam `z.coerce.number()` pois `process.env` retorna sempre strings.

6. **`.env.example` sempre atualizado** -- ao adicionar uma variavel, atualize o `.env.example` correspondente para documentar a variavel.

7. **Dados sensiveis nao vao no `.env.example`** -- JWT keys, passwords e secrets devem ter valor vazio ou placeholder no `.env.example`.

8. **`.env.test` para testes** -- o backend carrega `.env.test` quando `NODE_ENV === 'test'`, permitindo configuracao isolada para testes.

9. **Validacao bloqueia inicializacao** -- se qualquer variavel obrigatoria estiver ausente, a aplicacao nao deve iniciar. Backend faz `throw`, frontend faz o `createEnv` lancar erro.

10. **Export naming convention** -- backend exporta como `Env` (PascalCase), frontend exporta como `env` (camelCase).

---

## Checklist

- [ ] A nova variavel esta no schema Zod (`start/env.ts` ou `src/env.ts`).
- [ ] A variavel esta documentada no `.env.example`.
- [ ] Variaveis frontend usam prefixo `VITE_`.
- [ ] Variaveis numericas usam `z.coerce.number()`.
- [ ] Variaveis string usam `.trim()`.
- [ ] Variaveis opcionais usam `.optional()` ou `.default()`.
- [ ] O codigo usa `Env.VARIAVEL` (backend) ou `env.VARIAVEL` (frontend), nunca `process.env` diretamente.
- [ ] O `.env.test` foi atualizado (se a variavel e usada em testes).
- [ ] Dados sensiveis nao possuem valor real no `.env.example`.

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| `Invalid environment variables` no startup | Variavel obrigatoria ausente no `.env` | Adicionar a variavel ao `.env` com valor valido |
| Variavel frontend undefined em runtime | Falta prefixo `VITE_` na variavel | Renomear para `VITE_VARIAVEL` no schema e no `.env` |
| PORT vem como string | Uso de `z.string()` em vez de `z.coerce.number()` | Trocar para `z.coerce.number()` |
| Default nao aplicado para string vazia | Frontend nao usa `emptyStringAsUndefined` | Verificar que `emptyStringAsUndefined: true` esta no `createEnv` |
| Acesso direto a `process.env` | Bypass da validacao | Substituir por `Env.VARIAVEL` importado de `@start/env` |
| Testes falham por variavel ausente | `.env.test` nao tem a nova variavel | Adicionar ao `.env.test` |
| Erro de tipo no uso da variavel | Variavel declarada como `string` mas usada como `number` | Usar `z.coerce.number()` no schema |

---

**Cross-references:** ver [014-skill-kernel.md](./014-skill-kernel.md), [025-skill-http-client.md](./025-skill-http-client.md).
