---
id: environment-variables
title: Variáveis de Ambiente
---

Aprenda como configurar e usar variáveis de ambiente de forma segura na sua aplicação TanStack Start em diferentes contextos (server functions, código do cliente e processos de build).

## Início Rápido

O TanStack Start carrega automaticamente arquivos `.env` e disponibiliza as variáveis tanto no contexto do servidor quanto do cliente, com limites de segurança apropriados.

```bash
# .env
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
VITE_APP_NAME=My TanStack Start App
```

```typescript
// Server function - pode acessar qualquer variável de ambiente
const getUser = createServerFn().handler(async () => {
  const db = await connect(process.env.DATABASE_URL) // ✅ Apenas servidor
  return db.user.findFirst()
})

// Componente do cliente - apenas variáveis com prefixo VITE_
export function AppHeader() {
  return <h1>{import.meta.env.VITE_APP_NAME}</h1> // ✅ Seguro para o cliente
}
```

## Contextos de Variáveis de Ambiente

### Contexto do Lado do Servidor (Server Functions e Rotas de API)

Server functions podem acessar **qualquer** variável de ambiente usando `process.env`:

```typescript
import { createServerFn } from "@tanstack/react-start";

// Conexão com banco de dados (apenas servidor)
const connectToDatabase = createServerFn().handler(async () => {
  const connectionString = process.env.DATABASE_URL; // Não precisa de prefixo
  const apiKey = process.env.EXTERNAL_API_SECRET; // Permanece no servidor

  // Essas variáveis nunca são expostas ao cliente
  return await database.connect(connectionString);
});

// Autenticação (apenas servidor)
const authenticateUser = createServerFn()
  .inputValidator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    const jwtSecret = process.env.JWT_SECRET; // Apenas servidor
    return jwt.verify(data.token, jwtSecret);
  });
```

### Contexto do Lado do Cliente (Componentes e Código do Cliente)

O código do cliente só pode acessar variáveis com o prefixo `VITE_`:

```typescript
// Configuração do cliente
export function ApiProvider({ children }: { children: React.ReactNode }) {
  const apiUrl = import.meta.env.VITE_API_URL     // ✅ Público
  const apiKey = import.meta.env.VITE_PUBLIC_KEY  // ✅ Público

  // Isso seria undefined (recurso de segurança):
  // const secret = import.meta.env.DATABASE_URL   // ❌ Undefined

  return (
    <ApiContext.Provider value={{ apiUrl, apiKey }}>
      {children}
    </ApiContext.Provider>
  )
}

// Feature flags
export function FeatureGatedComponent() {
  const enableNewFeature = import.meta.env.VITE_ENABLE_NEW_FEATURE === 'true'

  if (!enableNewFeature) return null

  return <NewFeature />
}
```

## Configuração dos Arquivos de Ambiente

### Hierarquia de Arquivos (Carregados em Ordem)

O TanStack Start carrega automaticamente os arquivos de ambiente nesta ordem:

```
.env.local          # Sobrescritas locais (adicione ao .gitignore)
.env.production     # Variáveis específicas de produção
.env.development    # Variáveis específicas de desenvolvimento
.env                # Variáveis padrão (commit no git)
```

### Exemplo de Configuração

**.env** (commitado no repositório):

```bash
# Configuração pública
VITE_APP_NAME=My TanStack Start App
VITE_API_URL=https://api.example.com
VITE_SENTRY_DSN=https://...

# Templates de configuração do servidor
DATABASE_URL=postgresql://localhost:5432/myapp_dev
REDIS_URL=redis://localhost:6379
```

**.env.local** (adicione ao .gitignore):

```bash
# Sobrescrita para desenvolvimento local
DATABASE_URL=postgresql://user:password@localhost:5432/myapp_local
STRIPE_SECRET_KEY=sk_test_...
JWT_SECRET=your-local-secret
```

**.env.production**:

```bash
# Sobrescritas de produção
VITE_API_URL=https://api.myapp.com
DATABASE_POOL_SIZE=20
```

## Padrões Comuns

### Configuração de Banco de Dados

```typescript
// src/lib/database.ts
import { createServerFn } from "@tanstack/react-start";

const getDatabaseConnection = createServerFn().handler(async () => {
  const config = {
    url: process.env.DATABASE_URL,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || "10"),
    ssl: process.env.NODE_ENV === "production",
  };

  return createConnection(config);
});
```

### Configuração do Provedor de Autenticação

```typescript
// src/lib/auth.ts (Servidor)
export const authConfig = {
  secret: process.env.AUTH_SECRET,
  providers: {
    auth0: {
      domain: process.env.AUTH0_DOMAIN,
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET, // Apenas servidor
    }
  }
}

// src/components/AuthProvider.tsx (Cliente)
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      // Sem client secret aqui - ele permanece no servidor
    >
      {children}
    </Auth0Provider>
  )
}
```

### Integração com API Externa

```typescript
// src/lib/external-api.ts
import { createServerFn } from "@tanstack/react-start";

// Chamadas de API no lado do servidor (pode usar chaves secretas)
const fetchUserData = createServerFn()
  .inputValidator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    const response = await fetch(
      `${process.env.EXTERNAL_API_URL}/users/${data.userId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.EXTERNAL_API_SECRET}`,
          "Content-Type": "application/json",
        },
      },
    );

    return response.json();
  });

// Chamadas de API no lado do cliente (apenas endpoints públicos)
export function usePublicData() {
  const apiUrl = import.meta.env.VITE_PUBLIC_API_URL;

  return useQuery({
    queryKey: ["public-data"],
    queryFn: () => fetch(`${apiUrl}/public/stats`).then((r) => r.json()),
  });
}
```

### Feature Flags e Configuração

```typescript
// src/config/features.ts
export const featureFlags = {
  enableNewDashboard: import.meta.env.VITE_ENABLE_NEW_DASHBOARD === 'true',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
}

// Uso em componentes
export function Dashboard() {
  if (featureFlags.enableNewDashboard) {
    return <NewDashboard />
  }

  return <LegacyDashboard />
}
```

## Segurança de Tipos

### Declarações TypeScript

Crie `src/env.d.ts` para adicionar segurança de tipos:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Variáveis de ambiente do lado do cliente
  readonly VITE_APP_NAME: string;
  readonly VITE_API_URL: string;
  readonly VITE_AUTH0_DOMAIN: string;
  readonly VITE_AUTH0_CLIENT_ID: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_ENABLE_NEW_DASHBOARD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Variáveis de ambiente do lado do servidor
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly DATABASE_URL: string;
      readonly REDIS_URL: string;
      readonly JWT_SECRET: string;
      readonly AUTH0_CLIENT_SECRET: string;
      readonly STRIPE_SECRET_KEY: string;
      readonly NODE_ENV: "development" | "production" | "test";
    }
  }
}

export {};
```

### Validação em Runtime

Use Zod para validação em runtime das variáveis de ambiente:

```typescript
// src/config/env.ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(["development", "production", "test"]),
});

const clientEnvSchema = z.object({
  VITE_APP_NAME: z.string(),
  VITE_API_URL: z.string().url(),
  VITE_AUTH0_DOMAIN: z.string(),
  VITE_AUTH0_CLIENT_ID: z.string(),
});

// Validar ambiente do servidor
export const serverEnv = envSchema.parse(process.env);

// Validar ambiente do cliente
export const clientEnv = clientEnvSchema.parse(import.meta.env);
```

## Melhores Práticas de Segurança

### 1. Nunca Exponha Segredos ao Cliente

```typescript
// ❌ ERRADO - Segredo exposto no bundle do cliente
const config = {
  apiKey: import.meta.env.VITE_SECRET_API_KEY, // Isso estará no seu bundle JS!
};

// ✅ CORRETO - Mantenha segredos no servidor
const getApiData = createServerFn().handler(async () => {
  const response = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${process.env.SECRET_API_KEY}` },
  });
  return response.json();
});
```

### 2. Use Prefixos Apropriados

```bash
# ✅ Apenas servidor (sem prefixo)
DATABASE_URL=postgresql://...
JWT_SECRET=super-secret-key
STRIPE_SECRET_KEY=sk_live_...

# ✅ Seguro para o cliente (prefixo VITE_)
VITE_APP_NAME=My App
VITE_API_URL=https://api.example.com
VITE_SENTRY_DSN=https://...
```

### 3. Valide Variáveis Obrigatórias

```typescript
// src/config/validation.ts
const requiredServerEnv = ["DATABASE_URL", "JWT_SECRET"] as const;

const requiredClientEnv = ["VITE_APP_NAME", "VITE_API_URL"] as const;

// Validar na inicialização do servidor
for (const key of requiredServerEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

// Validar ambiente do cliente no momento do build
for (const key of requiredClientEnv) {
  if (!import.meta.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
```

## Checklist de Produção

- [ ] Todas as variáveis sensíveis são apenas do servidor (sem prefixo `VITE_`)
- [ ] Variáveis do cliente usam o prefixo `VITE_`
- [ ] `.env.local` está no `.gitignore`
- [ ] Variáveis de ambiente de produção estão configuradas na plataforma de hospedagem
- [ ] Variáveis de ambiente obrigatórias são validadas na inicialização
- [ ] Sem segredos hardcoded no código-fonte
- [ ] URLs de banco de dados usam connection pooling em produção
- [ ] Chaves de API são rotacionadas regularmente

## Problemas Comuns

### Variável de Ambiente é Undefined

**Problema**: `import.meta.env.MY_VARIABLE` retorna `undefined`

**Soluções**:

1. **Adicione o prefixo correto**: Use o prefixo `VITE_` (ex: `VITE_MY_VARIABLE`)
2. **Reinicie o servidor de desenvolvimento** após adicionar novas variáveis
3. **Verifique a localização do arquivo**: O arquivo `.env` deve estar na raiz do projeto
4. **Verifique a configuração do bundler**: Certifique-se de que as variáveis estão sendo injetadas corretamente

**Exemplo**:

```bash
# ❌ Não funcionará no código do cliente
API_KEY=abc123

# ✅ Funciona no código do cliente
VITE_API_KEY=abc123

# ❌ Não incluirá a variável no bundle (assumindo que ela não está definida no ambiente do build)
npm run build

# ✅ Funciona no código do cliente e incluirá a variável no bundle de produção
VITE_API_KEY=abc123 npm run build
```

### Variáveis de Ambiente do Cliente em Runtime na Produção

**Problema**: Se variáveis `VITE_` são substituídas apenas no momento do build, como tornar variáveis de runtime disponíveis no cliente?

**Soluções**:

Passe variáveis do servidor para o cliente:

```tsx
const getRuntimeVar = createServerFn({ method: "GET" }).handler(() => {
  return process.env.MY_RUNTIME_VAR; // note `process.env` no servidor, e sem prefixo `VITE_`
});

export const Route = createFileRoute("/")({
  loader: async () => {
    const foo = await getRuntimeVar();
    return { foo };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { foo } = Route.useLoaderData();
  // ... use sua variável como quiser
}
```

### Variável Não Atualiza

**Problema**: Alterações na variável de ambiente não são refletidas

**Soluções**:

1. Reinicie o servidor de desenvolvimento
2. Verifique se você está modificando o arquivo `.env` correto
3. Verifique a hierarquia de arquivos (`.env.local` sobrescreve `.env`)

### Erros de TypeScript

**Problema**: `Property 'VITE_MY_VAR' does not exist on type 'ImportMetaEnv'`

**Solução**: Adicione ao `src/env.d.ts`:

```typescript
interface ImportMetaEnv {
  readonly VITE_MY_VAR: string;
}
```

### Segurança: Segredo Exposto ao Cliente

**Problema**: Dados sensíveis aparecendo no bundle do cliente

**Soluções**:

1. Remova o prefixo `VITE_` de variáveis sensíveis
2. Mova operações sensíveis para server functions
3. Use ferramentas de build para verificar se não há segredos no bundle do cliente

### Erros de Build em Produção

**Problema**: Variáveis de ambiente ausentes no build de produção

**Soluções**:

1. Configure as variáveis na plataforma de hospedagem
2. Valide variáveis obrigatórias no momento do build
3. Use arquivos `.env` específicos para cada deploy

## Configuração de Build do Servidor

### Substituição Estática de `NODE_ENV`

Por padrão, o TanStack Start substitui estaticamente `process.env.NODE_ENV` nos **builds do servidor** no momento do build. Isso permite a eliminação de código morto (tree-shaking) para caminhos de código exclusivos de desenvolvimento no seu bundle do servidor.

**Por que isso importa:** O Vite substitui automaticamente `process.env.NODE_ENV` nos builds do cliente, mas builds do servidor rodam no Node.js onde `process.env` é um objeto real de runtime. Sem a substituição estática, código como este permaneceria no seu bundle de produção do servidor:

```typescript
if (process.env.NODE_ENV === "development") {
  // Este código NÃO seria eliminado sem a substituição estática
  enableDevTools();
  logDebugInfo();
}
```

Com a substituição estática habilitada (o padrão), o bundler vê `"production" === 'development'` e elimina o bloco inteiro.

### Configurando a Substituição Estática

A substituição é controlada pela opção `server.build.staticNodeEnv`:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    tanstackStart({
      server: {
        build: {
          // Substituir process.env.NODE_ENV no momento do build (padrão: true)
          staticNodeEnv: true,
        },
      },
    }),
    viteReact(),
  ],
});
```

O valor da substituição é determinado nesta ordem:

1. `process.env.NODE_ENV` no momento do build (se definido)
2. O `mode` do Vite (ex: de `--mode staging`)
3. `"production"` (fallback)

### Quando Desabilitar a Substituição Estática

Defina `staticNodeEnv: false` se você precisa que `NODE_ENV` permaneça dinâmico em runtime:

```ts
tanstackStart({
  server: {
    build: {
      staticNodeEnv: false, // Manter NODE_ENV dinâmico em runtime
    },
  },
});
```

Razões comuns para desabilitar:

- **Mesmo build, múltiplos ambientes**: Fazendo deploy de um único artefato de build para staging e produção
- **Detecção de ambiente em runtime**: Código que precisa verificar o ambiente real de runtime
- **Testando builds de produção localmente**: Executando builds de produção com `NODE_ENV=development`

> **Nota:** Desabilitar a substituição estática significa que caminhos de código exclusivos de desenvolvimento permanecerão no seu bundle de produção e serão avaliados em runtime.

> **Importante:** Se você desabilitar `staticNodeEnv`, você **deve** definir `NODE_ENV=production` em runtime ao executar seu servidor em produção. Sem isso, o React (e possivelmente outras bibliotecas) rodará em modo de desenvolvimento, que é significativamente mais lento e inclui avisos e verificações extras não destinados ao uso em produção.

## Recursos Relacionados

- [Padrões de Execução de Código](./code-execution-patterns.md) - Aprenda sobre execução de código no servidor vs cliente
- [Server Functions](./server-functions.md) - Saiba mais sobre código do lado do servidor
- [Hospedagem](./hosting.md) - Configuração de variáveis de ambiente específica por plataforma
- [Variáveis de Ambiente do Vite](https://vitejs.dev/guide/env-and-mode.html) - Documentação oficial do Vite
