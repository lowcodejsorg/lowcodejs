---
id: server-entry-point
title: Ponto de Entrada do Servidor
---

# Ponto de Entrada do Servidor

> [!NOTE]
> O ponto de entrada do servidor é **opcional** por padrão. Se não for fornecido, o TanStack Start irá automaticamente gerenciar o ponto de entrada do servidor para você usando o exemplo abaixo como padrão.

O Ponto de Entrada do Servidor suporta o formato universal de fetch handler, comumente usado pelo [Cloudflare Workers](https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/) e outros runtimes compatíveis com WinterCG.

Para garantir a interoperabilidade, a exportação padrão deve estar em conformidade com a nossa interface `ServerEntry`:

```ts
export default {
  fetch(req: Request, opts?: RequestOptions): Response | Promise<Response> {
    // ...
  },
};
```

O TanStack Start expõe um wrapper para tornar a criação type-safe. Isso é feito no arquivo `src/server.ts`.

```tsx
// src/server.ts
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

export default createServerEntry({
  fetch(request) {
    return handler.fetch(request);
  },
});
```

Seja gerando nossa aplicação estaticamente ou servindo-a dinamicamente, o arquivo `server.ts` é o ponto de entrada para realizar todo o trabalho relacionado a SSR, bem como para lidar com rotas do servidor e requisições de server functions.

## Handlers de Servidor Personalizados

Você pode criar handlers de servidor personalizados para modificar como sua aplicação é renderizada:

```tsx
// src/server.ts
import {
  createStartHandler,
  defaultStreamHandler,
  defineHandlerCallback,
} from "@tanstack/react-start/server";
import { createServerEntry } from "@tanstack/react-start/server-entry";

const customHandler = defineHandlerCallback((ctx) => {
  // adicione lógica personalizada aqui
  return defaultStreamHandler(ctx);
});

const fetch = createStartHandler(customHandler);

export default createServerEntry({
  fetch,
});
```

## Contexto da Requisição

Quando seu servidor precisa passar dados adicionais e tipados para os handlers de requisição (por exemplo, informações de usuário autenticado, uma conexão com banco de dados ou flags por requisição), registre um tipo de contexto de requisição via augmentação de módulo do TypeScript. O contexto registrado é entregue como o segundo argumento para o handler `fetch` do servidor e está disponível em toda a cadeia de middleware do lado do servidor — incluindo middleware global, middleware de requisição/função, rotas do servidor, server functions e o próprio router.

Para adicionar tipos ao seu contexto de requisição, faça a augmentação da interface `Register` do `@tanstack/react-start` com uma propriedade `server.requestContext`. O `context` em runtime que você passa para `handler.fetch` irá então corresponder a esse tipo. Exemplo:

```tsx
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

type MyRequestContext = {
  hello: string;
  foo: number;
};

declare module "@tanstack/react-start" {
  interface Register {
    server: {
      requestContext: MyRequestContext;
    };
  }
}

export default createServerEntry({
  async fetch(request) {
    return handler.fetch(request, { context: { hello: "world", foo: 123 } });
  },
});
```

## Configuração do Servidor

O ponto de entrada do servidor é onde você pode configurar comportamentos específicos do servidor:

- Middleware de requisição/resposta
- Tratamento de erros personalizado
- Lógica de autenticação
- Conexões com banco de dados
- Logging e monitoramento

Essa flexibilidade permite que você personalize como sua aplicação TanStack Start lida com a renderização do lado do servidor, mantendo as convenções do framework.

## Cloudflare Workers

Ao fazer deploy no Cloudflare Workers, você pode estender o `server.ts` para lidar com recursos adicionais do Workers, como filas, eventos agendados e Durable Objects. Para um guia completo, consulte a [documentação do Cloudflare Workers para TanStack Start](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/#custom-entrypoints).
