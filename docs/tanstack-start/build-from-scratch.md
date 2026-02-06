---
id: build-from-scratch
title: Construir um Projeto do Zero
---

> [!NOTE]
> Se você optou por iniciar rapidamente com um exemplo ou projeto clonado, pode pular este guia e seguir para o guia de [Roteamento](./guide/routing).

_Então você quer construir um projeto TanStack Start do zero?_

Este guia vai ajudá-lo a construir uma aplicação web **muito** básica com TanStack Start. Juntos, vamos usar o TanStack Start para:

- Servir uma página inicial
- Exibir um contador
- Incrementar o contador no servidor e no cliente

[Veja como ficará o resultado](https://stackblitz.com/github/tanstack/router/tree/main/examples/react/start-counter)

Vamos criar um novo diretório de projeto e inicializá-lo.

```shell
mkdir myApp
cd myApp
npm init -y
```

> [!NOTE]
> Usamos `npm` em todos esses exemplos, mas você pode usar o gerenciador de pacotes de sua preferência.

## Configuração do TypeScript

Recomendamos fortemente o uso de TypeScript com o TanStack Start. Crie um arquivo `tsconfig.json` com pelo menos as seguintes configurações:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "moduleResolution": "Bundler",
    "module": "ESNext",
    "target": "ES2022",
    "skipLibCheck": true,
    "strictNullChecks": true
  }
}
```

> [!NOTE]
> Habilitar `verbatimModuleSyntax` pode fazer com que bundles do servidor vazem para bundles do cliente. É recomendado manter essa opção desabilitada.

## Instalar Dependências

O TanStack Start é alimentado pelo [Vite](https://vite.dev/) e pelo [TanStack Router](https://tanstack.com/router) e os requer como dependências.

Para instalá-los, execute:

```shell
npm i @tanstack/react-start @tanstack/react-router
```

Também precisamos do vite como devDependency:

```shell
npm i -D vite
```

Você também vai precisar do React:

```shell
npm i react react-dom
```

Assim como o plugin do React para o Vite:

```shell
npm i -D @vitejs/plugin-react
```

Alternativamente, você também pode usar `@vitejs/plugin-react-oxc` ou `@vitejs/plugin-react-swc`.

e algum TypeScript:

```shell
npm i -D typescript @types/react @types/react-dom @types/node vite-tsconfig-paths
```

## Atualizar Arquivos de Configuração

Em seguida, vamos atualizar nosso `package.json` para usar a CLI do Vite e definir `"type": "module"`:

```json
{
  // ...
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build"
  }
}
```

Depois, configure o plugin do Vite do TanStack Start no `vite.config.ts`:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tsConfigPaths(),
    tanstackStart(),
    // o plugin do react para o vite deve vir após o plugin do start para o vite
    viteReact(),
  ],
});
```

## Adicionar a Estrutura Básica

Existem 2 arquivos obrigatórios para o uso do TanStack Start:

1. A configuração do router
2. A raiz da sua aplicação

Após a configuração, teremos uma árvore de arquivos parecida com a seguinte:

```
.
├── src/
│   ├── routes/
│   │   └── `__root.tsx`
│   ├── `router.tsx`
│   ├── `routeTree.gen.ts`
├── `vite.config.ts`
├── `package.json`
└── `tsconfig.json`
```

## A Configuração do Router

Este é o arquivo que vai ditar o comportamento do TanStack Router usado dentro do Start. Aqui, você pode configurar tudo, desde a funcionalidade padrão de [preloading](/router/latest/docs/framework/react/guide/preloading) até a [obsolescência do cache](/router/latest/docs/framework/react/guide/data-loading).

> [!NOTE]
> Você ainda não terá um arquivo `routeTree.gen.ts`. Este arquivo será gerado quando você executar o TanStack Start pela primeira vez.

```tsx
// src/router.tsx
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
  });

  return router;
}
```

## A Raiz da Sua Aplicação

Por fim, precisamos criar a raiz da nossa aplicação. Este é o ponto de entrada para todas as outras rotas. O código neste arquivo vai envolver todas as outras rotas da aplicação.

```tsx
// src/routes/__root.tsx
/// <reference types="vite/client" />
import type { ReactNode } from "react";
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
```

## Escrevendo Sua Primeira Rota

Agora que temos a estrutura básica configurada, podemos escrever nossa primeira rota. Isso é feito criando um novo arquivo no diretório `src/routes`.

```tsx
// src/routes/index.tsx
import * as fs from "node:fs";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const filePath = "count.txt";

async function readCount() {
  return parseInt(
    await fs.promises.readFile(filePath, "utf-8").catch(() => "0"),
  );
}

const getCount = createServerFn({
  method: "GET",
}).handler(() => {
  return readCount();
});

const updateCount = createServerFn({ method: "POST" })
  .inputValidator((d: number) => d)
  .handler(async ({ data }) => {
    const count = await readCount();
    await fs.promises.writeFile(filePath, `${count + data}`);
  });

export const Route = createFileRoute("/")({
  component: Home,
  loader: async () => await getCount(),
});

function Home() {
  const router = useRouter();
  const state = Route.useLoaderData();

  return (
    <button
      type="button"
      onClick={() => {
        updateCount({ data: 1 }).then(() => {
          router.invalidate();
        });
      }}
    >
      Add 1 to {state}?
    </button>
  );
}
```

E pronto! Agora você configurou um projeto TanStack Start e escreveu sua primeira rota.

Você pode executar `npm run dev` para iniciar seu servidor e navegar até `http://localhost:3000` para ver sua rota em ação.

Quer fazer o deploy da sua aplicação? Confira o [guia de hospedagem](./guide/hosting.md).
