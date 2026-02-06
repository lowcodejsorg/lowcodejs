---
id: server-routes
title: Rotas de Servidor
---

Rotas de servidor são um recurso poderoso do TanStack Start que permite criar endpoints no lado do servidor em sua aplicação. Elas são úteis para lidar com requisições HTTP brutas, envio de formulários, autenticação de usuários e muito mais.

As rotas de servidor podem ser definidas no diretório `./src/routes` do seu projeto **junto às suas rotas do TanStack Router** e são automaticamente tratadas pelo servidor do TanStack Start.

Veja como uma rota de servidor simples se parece:

```ts
// routes/hello.ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/hello")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return new Response("Hello, World!");
      },
    },
  },
});
```

## Rotas de Servidor e Rotas da Aplicação

Como as rotas de servidor podem ser definidas no mesmo diretório que as rotas da aplicação, você pode até usar o mesmo arquivo para ambas!

```tsx
// routes/hello.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/hello")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json();
        return new Response(
          JSON.stringify({ message: `Hello, ${body.name}!` }),
        );
      },
    },
  },
  component: HelloComponent,
});

function HelloComponent() {
  const [reply, setReply] = useState("");

  return (
    <div>
      <button
        onClick={() => {
          fetch("/hello", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: "Tanner" }),
          })
            .then((res) => res.json())
            .then((data) => setReply(data.message));
        }}
      >
        Say Hello
      </button>
    </div>
  );
}
```

## Convenções de Rotas Baseadas em Arquivo

As rotas de servidor no TanStack Start seguem as mesmas convenções de roteamento baseado em arquivos do TanStack Router. Isso significa que cada arquivo no diretório `routes` que possua uma propriedade `server` na chamada `createFileRoute` será tratado como uma rota de API. Aqui estão alguns exemplos:

- `/routes/users.ts` criará uma rota de API em `/users`
- `/routes/users.index.ts` **também** criará uma rota de API em `/users` (mas retornará erro se métodos duplicados forem definidos)
- `/routes/users/$id.ts` criará uma rota de API em `/users/$id`
- `/routes/users/$id/posts.ts` criará uma rota de API em `/users/$id/posts`
- `/routes/users.$id.posts.ts` criará uma rota de API em `/users/$id/posts`
- `/routes/api/file/$.ts` criará uma rota de API em `/api/file/$`
- `/routes/my-script[.]js.ts` criará uma rota de API em `/my-script.js`

## Caminhos de Rota Únicos

Cada rota pode ter apenas um único arquivo de handler associado a ela. Portanto, se você tiver um arquivo chamado `routes/users.ts` que corresponderia ao caminho de requisição `/users`, você não pode ter outros arquivos que também resolvam para a mesma rota. Por exemplo, os seguintes arquivos resolveriam todos para a mesma rota e causariam erro:

- `/routes/users.index.ts`
- `/routes/users.ts`
- `/routes/users/index.ts`

## Correspondência com Escape

Assim como nas rotas normais, as rotas de servidor podem fazer correspondência com caracteres escapados. Por exemplo, um arquivo chamado `routes/users[.]json.ts` criará uma rota de API em `/users.json`.

## Rotas de Layout Sem Caminho e Rotas de Break-out

Devido ao sistema de roteamento unificado, rotas de layout sem caminho e rotas de break-out são suportadas para funcionalidades semelhantes em torno de middleware de rotas de servidor.

- Rotas de layout sem caminho podem ser usadas para adicionar middleware a um grupo de rotas
- Rotas de break-out podem ser usadas para "escapar" do middleware pai

## Diretórios Aninhados vs Nomes de Arquivo

Nos exemplos acima, você pode ter notado que as convenções de nomenclatura de arquivos são flexíveis e permitem misturar diretórios e nomes de arquivo. Isso é intencional e permite que você organize suas rotas de servidor de uma forma que faça sentido para sua aplicação. Você pode ler mais sobre isso no [Guia de Roteamento Baseado em Arquivo do TanStack Router](/router/latest/docs/framework/react/routing/file-based-routing#s-or-s).

## Tratando Requisições de Rotas de Servidor

As requisições de rotas de servidor são tratadas automaticamente pelo Start por padrão ou pelo `createStartHandler` do Start no seu arquivo de entry point personalizado `src/server.ts`.

O handler do Start é responsável por fazer a correspondência de uma requisição recebida com uma rota de servidor e executar o middleware e o handler apropriados.

Se você precisar personalizar o handler do servidor, pode fazer isso criando um handler personalizado e então passando o evento para o handler do Start. Veja [O Entry Point do Servidor](./server-entry-point).

## Definindo uma Rota de Servidor

As rotas de servidor são criadas adicionando uma propriedade `server` à sua chamada `createFileRoute`. A propriedade `server` contém:

- `handlers` - Um objeto mapeando métodos HTTP para funções de handler, ou uma função que recebe `createHandlers` para casos de uso mais avançados
- `middleware` - Array opcional de middleware no nível da rota que se aplica a todos os handlers

```ts
// routes/hello.ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/hello")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return new Response("Hello, World! from " + request.url);
      },
    },
  },
});
```

## Definindo Handlers de Rotas de Servidor

Você pode definir handlers de duas formas:

- **Handlers simples**: Forneça funções de handler diretamente em um objeto de handlers
- **Handlers com middleware**: Use a função `createHandlers` para definir handlers com middleware

### Handlers simples

Para casos de uso simples, você pode fornecer funções de handler diretamente em um objeto de handlers.

```ts
// routes/hello.ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/hello")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return new Response("Hello, World! from " + request.url);
      },
    },
  },
});
```

### Adicionando middleware a handlers específicos

Para casos de uso mais complexos, você pode adicionar middleware a handlers específicos. Isso requer o uso da função `createHandlers`:

```tsx
// routes/hello.ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/hello")({
  server: {
    handlers: ({ createHandlers }) =>
      createHandlers({
        GET: {
          middleware: [loggerMiddleware],
          handler: async ({ request }) => {
            return new Response("Hello, World! from " + request.url);
          },
        },
      }),
  },
});
```

### Adicionando middleware a todos os handlers

Você também pode adicionar middleware que se aplica a todos os handlers de uma rota usando a propriedade `middleware` no nível do server:

```tsx
// routes/hello.ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/hello")({
  server: {
    middleware: [authMiddleware, loggerMiddleware], // Aplica-se a todos os handlers
    handlers: {
      GET: async ({ request }) => {
        return new Response("Hello, World! from " + request.url);
      },
      POST: async ({ request }) => {
        const body = await request.json();
        return new Response(`Hello, ${body.name}!`);
      },
    },
  },
});
```

### Combinando middleware no nível da rota e middleware específico do handler

Você pode combinar ambas as abordagens - o middleware no nível da rota será executado primeiro, seguido pelo middleware específico do handler:

```tsx
// routes/hello.ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/hello")({
  server: {
    middleware: [authMiddleware], // Executa primeiro para todos os handlers
    handlers: ({ createHandlers }) =>
      createHandlers({
        GET: async ({ request }) => {
          return new Response("Hello, World!");
        },
        POST: {
          middleware: [validationMiddleware], // Executa após authMiddleware, apenas para POST
          handler: async ({ request }) => {
            const body = await request.json();
            return new Response(`Hello, ${body.name}!`);
          },
        },
      }),
  },
});
```

## Contexto do Handler

Cada handler de método HTTP recebe um objeto com as seguintes propriedades:

- `request`: O objeto da requisição recebida. Você pode ler mais sobre o objeto `Request` na [documentação da MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Request).
- `params`: Um objeto contendo os parâmetros dinâmicos do caminho da rota. Por exemplo, se o caminho da rota for `/users/$id` e a requisição for feita para `/users/123`, então `params` será `{ id: '123' }`. Abordaremos parâmetros dinâmicos de caminho e parâmetros wildcard mais adiante neste guia.
- `context`: Um objeto contendo o contexto da requisição. Isso é útil para passar dados entre middleware.

Depois de processar a requisição, você pode retornar um objeto `Response` ou `Promise<Response>`, ou até mesmo usar qualquer um dos helpers de `@tanstack/react-start` para manipular a resposta.

## Parâmetros Dinâmicos de Caminho

As rotas de servidor suportam parâmetros dinâmicos de caminho da mesma forma que o TanStack Router. Por exemplo, um arquivo chamado `routes/users/$id.ts` criará uma rota de API em `/users/$id` que aceita um parâmetro dinâmico `id`.

```ts
// routes/users/$id.ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/users/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { id } = params;
        return new Response(`User ID: ${id}`);
      },
    },
  },
});

// Acesse /users/123 para ver a resposta
// User ID: 123
```

Você também pode ter múltiplos parâmetros dinâmicos de caminho em uma única rota. Por exemplo, um arquivo chamado `routes/users/$id/posts/$postId.ts` criará uma rota de API em `/users/$id/posts/$postId` que aceita dois parâmetros dinâmicos.

```ts
// routes/users/$id/posts/$postId.ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/users/$id/posts/$postId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { id, postId } = params;
        return new Response(`User ID: ${id}, Post ID: ${postId}`);
      },
    },
  },
});

// Acesse /users/123/posts/456 para ver a resposta
// User ID: 123, Post ID: 456
```

## Parâmetro Wildcard/Splat

As rotas de servidor também suportam parâmetros wildcard no final do caminho, que são indicados por um `$` seguido de nada. Por exemplo, um arquivo chamado `routes/file/$.ts` criará uma rota de API em `/file/$` que aceita um parâmetro wildcard.

```ts
// routes/file/$.ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/file/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { _splat } = params;
        return new Response(`File: ${_splat}`);
      },
    },
  },
});

// Acesse /file/hello.txt para ver a resposta
// File: hello.txt
```

## Tratando requisições com corpo

Para tratar requisições POST, você pode adicionar um handler `POST` ao objeto da rota. O handler receberá o objeto da requisição como primeiro argumento, e você pode acessar o corpo da requisição usando o método `request.json()`.

```ts
// routes/hello.ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/hello")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json();
        return new Response(`Hello, ${body.name}!`);
      },
    },
  },
});

// Envie uma requisição POST para /hello com um corpo JSON como { "name": "Tanner" }
// Hello, Tanner!
```

Isso também se aplica a outros métodos HTTP como `PUT`, `PATCH` e `DELETE`. Você pode adicionar handlers para esses métodos no objeto da rota e acessar o corpo da requisição usando o método apropriado.

É importante lembrar que o método `request.json()` retorna uma `Promise` que resolve para o corpo JSON parseado da requisição. Você precisa usar `await` no resultado para acessar o corpo.

Este é um padrão comum para tratar requisições POST em rotas de servidor. Você também pode usar outros métodos como `request.text()` ou `request.formData()` para acessar o corpo da requisição.

## Respondendo com JSON

Ao retornar JSON usando um objeto Response, este é um padrão comum:

```ts
// routes/hello.ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/hello")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return new Response(JSON.stringify({ message: "Hello, World!" }), {
          headers: {
            "Content-Type": "application/json",
          },
        });
      },
    },
  },
});

// Acesse /hello para ver a resposta
// {"message":"Hello, World!"}
```

## Usando a função helper `Response.json`

Ou você pode usar a função helper [`Response.json`](https://developer.mozilla.org/en-US/docs/Web/API/Response/json_static) para definir automaticamente o header `Content-Type` como `application/json` e serializar o objeto JSON para você.

```ts
// routes/hello.ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/hello")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return Response.json({ message: "Hello, World!" });
      },
    },
  },
});

// Acesse /hello para ver a resposta
// {"message":"Hello, World!"}
```

## Respondendo com um código de status

Você pode definir o código de status da resposta passando-o como uma propriedade do segundo argumento do construtor `Response`.

```ts
// routes/hello.ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/hello")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const user = await findUser(params.id);
        if (!user) {
          return new Response("User not found", {
            status: 404,
          });
        }
        return Response.json(user);
      },
    },
  },
});
```

Neste exemplo, estamos retornando um código de status `404` se o usuário não for encontrado. Você pode definir qualquer código de status HTTP válido usando este método.

## Definindo headers na resposta

Às vezes você pode precisar definir headers na resposta. Você pode fazer isso passando um objeto como segundo argumento do construtor `Response`.

```ts
// routes/hello.ts
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/hello")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return new Response("Hello, World!", {
          headers: {
            "Content-Type": "text/plain",
          },
        });
      },
    },
  },
});
// Acesse /hello para ver a resposta
// Hello, World!
```
