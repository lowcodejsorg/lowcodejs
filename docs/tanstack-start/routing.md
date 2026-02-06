---
id: routing
title: Roteamento
---

O TanStack Start é construído sobre o TanStack Router, então todos os recursos do TanStack Router estão disponíveis para você.

> [!NOTE]
> Recomendamos fortemente a leitura da [documentação do TanStack Router](/router/latest/docs/framework/react/overview) para aprender mais sobre os recursos e capacidades do TanStack Router. O que você aprenderá aqui é mais uma visão geral de alto nível do TanStack Router e de como ele funciona no Start.

## O Router

O arquivo `router.tsx` é o arquivo que ditará o comportamento do TanStack Router utilizado dentro do Start. Ele está localizado no diretório `src` do seu projeto.

```
src/
├── router.tsx
```

Aqui, você pode configurar tudo, desde a funcionalidade padrão de [preloading](/router/latest/docs/framework/react/guide/preloading) até a [obsolescência do cache](/router/latest/docs/framework/react/guide/data-loading).

```tsx
// src/router.tsx
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// Você deve exportar uma função getRouter que
// retorna uma nova instância do router a cada chamada
export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
  });

  return router;
}
```

## Roteamento Baseado em Arquivos

O Start usa a abordagem de roteamento baseado em arquivos do TanStack Router para garantir code-splitting adequado e segurança de tipos avançada.

Você pode encontrar suas rotas no diretório `src/routes`.

```
src/
├── routes <-- É aqui que você coloca suas rotas
│   ├── __root.tsx
│   ├── index.tsx
│   ├── about.tsx
│   ├── posts.tsx
│   ├── posts/$postId.tsx
```

## A Rota Raiz

A rota raiz é a rota mais alta em toda a árvore e encapsula todas as outras rotas como filhas. Ela é encontrada no arquivo `src/routes/__root.tsx` e deve ser nomeada como `__root.tsx`.

```
src/
├── routes
│   ├── __root.tsx <-- A rota raiz
```

- Ela não possui caminho e é **sempre** correspondida
- Seu `component` é **sempre** renderizado
- É aqui que você renderiza a estrutura do seu documento, por exemplo, `<html>`, `<body>`, etc.
- Como ela é **sempre renderizada**, é o lugar perfeito para construir a estrutura da sua aplicação e cuidar de qualquer lógica global

```tsx
// src/routes/__root.tsx
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

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

Observe o componente `Scripts` na parte inferior da tag `<body>`. Ele é usado para carregar todo o JavaScript do lado do cliente da aplicação e deve sempre ser incluído para o funcionamento adequado.

## O Componente HeadContent

O componente `HeadContent` é usado para renderizar as tags head, title, meta, link e tags de script relacionadas ao head do documento.

Ele deve ser **renderizado dentro da tag `<head>` do layout da sua rota raiz.**

## O Componente Outlet

O componente `Outlet` é usado para renderizar a próxima rota filha potencialmente correspondente. O `<Outlet />` não recebe nenhuma prop e pode ser renderizado em qualquer lugar dentro da árvore de componentes de uma rota. Se não houver uma rota filha correspondente, o `<Outlet />` renderizará `null`.

## O Componente Scripts

O componente `Scripts` é usado para renderizar os scripts do body do documento.

Ele deve ser **renderizado dentro da tag `<body>` do layout da sua rota raiz.**

## Geração da Árvore de Rotas

Você pode notar um arquivo `routeTree.gen.ts` no seu projeto.

```
src/
├── routeTree.gen.ts <-- O arquivo de árvore de rotas gerado
```

Este arquivo é gerado automaticamente quando você executa o TanStack Start (via `npm run dev` ou `npm run start`). Este arquivo contém a árvore de rotas gerada e algumas utilidades TypeScript que tornam a segurança de tipos do TanStack Start extremamente rápida e totalmente inferida.

## Roteamento Aninhado

O TanStack Router usa roteamento aninhado para corresponder a URL com a árvore de componentes correta a ser renderizada.

Por exemplo, dadas as seguintes rotas:

```
routes/
├── __root.tsx <-- Renderiza o componente <Root>
├── posts.tsx <-- Renderiza o componente <Posts>
├── posts.$postId.tsx <-- Renderiza o componente <Post>
```

E a URL: `/posts/123`

A árvore de componentes ficaria assim:

```
<Root>
  <Posts>
    <Post />
  </Posts>
</Root>
```

## Tipos de Rotas

Existem alguns tipos diferentes de rotas que você pode criar no seu projeto.

- Rotas de Índice - Correspondidas quando a URL é exatamente igual ao caminho da rota
- Rotas Dinâmicas/Wildcard/Splat - Capturam dinamicamente parte ou toda a URL em uma variável para uso na sua aplicação

Existem também alguns tipos de rotas utilitárias que você pode usar para agrupar e organizar suas rotas

- Rotas de Layout sem Caminho (Aplicam layout ou lógica a um grupo de rotas sem aninhá-las em um caminho)
- Rotas Não Aninhadas (Desaninham uma rota de seus pais e renderizam sua própria árvore de componentes)
- Rotas Agrupadas (Agrupam rotas em um diretório simplesmente para organização, sem afetar a hierarquia de caminhos)

## Configuração da Árvore de Rotas

A árvore de rotas é configurada no diretório `src/routes`.

## Criando Rotas de Arquivo

Para criar uma rota, crie um novo arquivo que corresponda ao caminho da rota que você deseja criar. Por exemplo:

| Caminho          | Nome do Arquivo     | Tipo              |
| ---------------- | ------------------- | ----------------- |
| `/`              | `index.tsx`         | Rota de Índice    |
| `/about`         | `about.tsx`         | Rota Estática     |
|                  | `posts.tsx`         | Rota de "Layout"  |
| `/posts/`        | `posts/index.tsx`   | Rota de Índice    |
| `/posts/:postId` | `posts/$postId.tsx` | Rota Dinâmica     |
| `/rest/*`        | `rest/$.tsx`        | Rota Wildcard     |

## Definindo Rotas

Para definir uma rota, use a função `createFileRoute` para exportar a rota como a variável `Route`.

Por exemplo, para lidar com a rota `/posts/:postId`, você criaria um arquivo chamado `posts/$postId.tsx` aqui:

```
src/
├── routes
│   ├── posts/$postId.tsx
```

Em seguida, defina a rota assim:

```tsx
// src/routes/posts/$postId.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/posts/$postId")({
  component: PostComponent,
});
```

> [!NOTE]
> A string de caminho passada para `createFileRoute` é **automaticamente escrita e gerenciada pelo router para você através do TanStack Router Bundler Plugin ou Router CLI.** Então, conforme você cria novas rotas, move rotas ou renomeia rotas, o caminho será atualizado automaticamente para você.

## Isso é apenas o "start"

Esta foi apenas uma visão geral de alto nível sobre como configurar rotas usando o TanStack Router. Para informações mais detalhadas, consulte a [documentação do TanStack Router](/router/latest/docs/framework/react/routing/file-based-routing).
