---
id: server-functions
title: Server Functions
---

## O que são Server Functions?

Server functions permitem definir lógica exclusiva do servidor que pode ser chamada de qualquer lugar da sua aplicação — loaders, componentes, hooks ou outras server functions. Elas são executadas no servidor, mas podem ser invocadas a partir do código do cliente de forma transparente.

```tsx
import { createServerFn } from "@tanstack/react-start";

export const getServerTime = createServerFn().handler(async () => {
  // Isto é executado apenas no servidor
  return new Date().toISOString();
});

// Chame de qualquer lugar — componentes, loaders, hooks, etc.
const time = await getServerTime();
```

Server functions fornecem capacidades do servidor (acesso ao banco de dados, variáveis de ambiente, sistema de arquivos) mantendo a segurança de tipos através da fronteira de rede.

## Uso Básico

Server functions são criadas com `createServerFn()` e podem especificar o método HTTP:

```tsx
import { createServerFn } from "@tanstack/react-start";

// Requisição GET (padrão)
export const getData = createServerFn().handler(async () => {
  return { message: "Hello from server!" };
});

// Requisição POST
export const saveData = createServerFn({ method: "POST" }).handler(async () => {
  // Lógica exclusiva do servidor
  return { success: true };
});
```

## Onde Chamar Server Functions

Chame server functions a partir de:

- **Route loaders** - Ideal para busca de dados
- **Componentes** - Use com o hook `useServerFn()`
- **Outras server functions** - Componha lógica de servidor
- **Event handlers** - Lide com envios de formulários, cliques, etc.

```tsx
// Em um route loader
export const Route = createFileRoute("/posts")({
  loader: () => getPosts(),
});

// Em um componente
function PostList() {
  const getPosts = useServerFn(getServerPosts);

  const { data } = useQuery({
    queryKey: ["posts"],
    queryFn: () => getPosts(),
  });
}
```

## Organização de Arquivos

Para aplicações maiores, considere organizar o código do lado do servidor em arquivos separados. Aqui está uma abordagem:

```
src/utils/
├── users.functions.ts   # Wrappers de server functions (createServerFn)
├── users.server.ts      # Helpers exclusivos do servidor (consultas ao BD, lógica interna)
└── schemas.ts           # Schemas de validação compartilhados (seguros para o cliente)
```

- **`.functions.ts`** - Exporta wrappers de `createServerFn`, seguros para importar em qualquer lugar
- **`.server.ts`** - Código exclusivo do servidor, importado apenas dentro de handlers de server functions
- **`.ts`** (sem sufixo) - Código seguro para o cliente (tipos, schemas, constantes)

### Exemplo

```tsx
// users.server.ts - Helpers exclusivos do servidor
import { db } from "~/db";

export async function findUserById(id: string) {
  return db.query.users.findFirst({ where: eq(users.id, id) });
}
```

```tsx
// users.functions.ts - Server functions
import { createServerFn } from "@tanstack/react-start";
import { findUserById } from "./users.server";

export const getUser = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return findUserById(data.id);
  });
```

### Importações Estáticas São Seguras

Server functions podem ser importadas estaticamente em qualquer arquivo, incluindo componentes do cliente:

```tsx
// ✅ Seguro - o processo de build lida com a separação de ambientes
import { getUser } from "~/utils/users.functions";

function UserProfile({ id }) {
  const { data } = useQuery({
    queryKey: ["user", id],
    queryFn: () => getUser({ data: { id } }),
  });
}
```

O processo de build substitui as implementações das server functions por stubs RPC nos bundles do cliente. O código real do servidor nunca chega ao navegador.

> [!WARNING]
> Evite importações dinâmicas para server functions:
>
> ```tsx
> // ❌ Pode causar problemas no bundler
> const { getUser } = await import("~/utils/users.functions");
> ```

## Parâmetros e Validação

Server functions aceitam um único parâmetro `data`. Como elas atravessam a fronteira de rede, a validação garante segurança de tipos e correção em tempo de execução.

### Parâmetros Básicos

```tsx
import { createServerFn } from "@tanstack/react-start";

export const greetUser = createServerFn({ method: "GET" })
  .inputValidator((data: { name: string }) => data)
  .handler(async ({ data }) => {
    return `Hello, ${data.name}!`;
  });

await greetUser({ data: { name: "John" } });
```

### Validação com Zod

Para uma validação robusta, use bibliotecas de schemas como o Zod:

```tsx
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const UserSchema = z.object({
  name: z.string().min(1),
  age: z.number().min(0),
});

export const createUser = createServerFn({ method: "POST" })
  .inputValidator(UserSchema)
  .handler(async ({ data }) => {
    // data está totalmente tipado e validado
    return `Created user: ${data.name}, age ${data.age}`;
  });
```

### Dados de Formulário

Lide com envios de formulários usando FormData:

```tsx
export const submitForm = createServerFn({ method: "POST" })
  .inputValidator((data) => {
    if (!(data instanceof FormData)) {
      throw new Error("Expected FormData");
    }

    return {
      name: data.get("name")?.toString() || "",
      email: data.get("email")?.toString() || "",
    };
  })
  .handler(async ({ data }) => {
    // Processa os dados do formulário
    return { success: true };
  });
```

## Tratamento de Erros e Redirecionamentos

Server functions podem lançar erros, redirecionamentos e respostas not-found que são tratados automaticamente quando chamados a partir de ciclos de vida de rotas ou componentes usando `useServerFn()`.

### Erros Básicos

```tsx
import { createServerFn } from "@tanstack/react-start";

export const riskyFunction = createServerFn().handler(async () => {
  if (Math.random() > 0.5) {
    throw new Error("Something went wrong!");
  }
  return { success: true };
});

// Erros são serializados para o cliente
try {
  await riskyFunction();
} catch (error) {
  console.log(error.message); // "Something went wrong!"
}
```

### Redirecionamentos

Use redirecionamentos para autenticação, navegação, etc:

```tsx
import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";

export const requireAuth = createServerFn().handler(async () => {
  const user = await getCurrentUser();

  if (!user) {
    throw redirect({ to: "/login" });
  }

  return user;
});
```

### Not Found

Lance erros not-found para recursos inexistentes:

```tsx
import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";

export const getPost = createServerFn()
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const post = await db.findPost(data.id);

    if (!post) {
      throw notFound();
    }

    return post;
  });
```

## Tópicos Avançados

Para padrões e funcionalidades mais avançados de server functions, consulte estes guias dedicados:

### Contexto do Servidor e Tratamento de Requisições

Acesse headers de requisição, cookies e personalize respostas:

```tsx
import { createServerFn } from "@tanstack/react-start";
import {
  getRequest,
  getRequestHeader,
  setResponseHeaders,
  setResponseStatus,
} from "@tanstack/react-start/server";

export const getCachedData = createServerFn({ method: "GET" }).handler(
  async () => {
    // Acessa a requisição recebida
    const request = getRequest();
    const authHeader = getRequestHeader("Authorization");

    // Define headers de resposta (ex: para cache)
    setResponseHeaders(
      new Headers({
        "Cache-Control": "public, max-age=300",
        "CDN-Cache-Control": "max-age=3600, stale-while-revalidate=600",
      }),
    );

    // Opcionalmente define o código de status
    setResponseStatus(200);

    return fetchData();
  },
);
```

Utilitários disponíveis:

- `getRequest()` - Acessa o objeto Request completo
- `getRequestHeader(name)` - Lê um header de requisição específico
- `setResponseHeader(name, value)` - Define um único header de resposta
- `setResponseHeaders(headers)` - Define múltiplos headers de resposta via objeto Headers
- `setResponseStatus(code)` - Define o código de status HTTP

### Streaming

Transmita dados tipados de server functions para o cliente. Consulte o [guia de Streaming de Dados a partir de Server Functions](./streaming-data-from-server-functions).

### Respostas Brutas

Retorne objetos `Response`, dados binários ou tipos de conteúdo personalizados.

### Progressive Enhancement

Use server functions sem JavaScript aproveitando a propriedade `.url` com formulários HTML.

### Middleware

Componha server functions com middleware para autenticação, logging e lógica compartilhada. Consulte o [guia de Middleware](./middleware.md).

### Server Functions Estáticas

Armazene em cache resultados de server functions em tempo de build para geração estática. Consulte [Server Functions Estáticas](./static-server-functions).

### Cancelamento de Requisições

Lide com o cancelamento de requisições usando `AbortSignal` para operações de longa duração.

### Geração de ID de função para build de produção

Server functions são endereçadas por um ID de função gerado e estável internamente. Esses IDs são incorporados nos builds do cliente/SSR e usados pelo servidor para localizar e importar o módulo correto em tempo de execução.

Por padrão, os IDs são hashes SHA256 da mesma semente para manter os bundles compactos e evitar a exposição de caminhos de arquivos.
Se duas server functions acabarem com o mesmo ID (inclusive ao usar um gerador personalizado), o sistema desduplicará adicionando um sufixo incremental como `_1`, `_2`, etc.

Personalização:

Você pode personalizar a geração de IDs de função para o build de produção fornecendo uma função `generateFunctionId` ao configurar o plugin Vite do TanStack Start.

Prefira entradas determinísticas (filename + functionName) para que os IDs permaneçam estáveis entre builds.

Note que esta personalização é **experimental** e está sujeita a alterações.

Exemplo:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  plugins: [
    tanstackStart({
      serverFns: {
        generateFunctionId: ({ filename, functionName }) => {
          // Retorna uma string de ID personalizada
          return crypto
            .createHash("sha1")
            .update(`${filename}--${functionName}`)
            .digest("hex");

          // Se você retornar undefined, o padrão será usado
          // return undefined
        },
      },
    }),
    react(),
  ],
});
```

---

> **Nota**: Server functions usam um processo de compilação que extrai o código do servidor dos bundles do cliente, mantendo padrões de chamada transparentes. No cliente, as chamadas se tornam requisições `fetch` para o servidor.
