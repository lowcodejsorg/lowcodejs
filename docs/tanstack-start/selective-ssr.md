---
id: selective-ssr
title: Renderização Seletiva no Servidor (SSR)
---

## O que é SSR Seletivo?

No TanStack Start, as rotas que correspondem à requisição inicial são renderizadas no servidor por padrão. Isso significa que `beforeLoad` e `loader` são executados no servidor, seguidos pela renderização dos componentes da rota. O HTML resultante é enviado ao cliente, que hidrata a marcação em uma aplicação totalmente interativa.

No entanto, existem casos em que você pode querer desabilitar o SSR para certas rotas ou para todas as rotas, como:

- Quando `beforeLoad` ou `loader` requerem APIs exclusivas do navegador (ex.: `localStorage`).
- Quando o componente da rota depende de APIs exclusivas do navegador (ex.: `canvas`).

O recurso de SSR Seletivo do TanStack Start permite que você configure:

- Quais rotas devem executar `beforeLoad` ou `loader` no servidor.
- Quais componentes de rota devem ser renderizados no servidor.

## Como isso se compara ao modo SPA?

O [modo SPA](./spa-mode) do TanStack Start desabilita completamente a execução no servidor de `beforeLoad` e `loader`, assim como a renderização no servidor dos componentes de rota. O SSR Seletivo permite que você configure o tratamento no servidor por rota, de forma estática ou dinâmica.

## Configuração

Você pode controlar como uma rota é tratada durante a requisição inicial do servidor usando a propriedade `ssr`. Se essa propriedade não for definida, o padrão é `true`. Você pode alterar esse padrão usando a opção `defaultSsr` em `createStart`:

```tsx
// src/start.ts
import { createStart } from "@tanstack/react-start";

export const startInstance = createStart(() => ({
  // Desabilita SSR por padrão
  defaultSsr: false,
}));
```

### `ssr: true`

Este é o comportamento padrão, a menos que configurado de outra forma. Na requisição inicial, ele irá:

- Executar `beforeLoad` no servidor e enviar o contexto resultante para o cliente.
- Executar `loader` no servidor e enviar os dados do loader para o cliente.
- Renderizar o componente no servidor e enviar a marcação HTML para o cliente.

```tsx
// src/routes/posts/$postId.tsx
export const Route = createFileRoute("/posts/$postId")({
  ssr: true,
  beforeLoad: () => {
    console.log("Executa no servidor durante a requisição inicial");
    console.log("Executa no cliente nas navegações subsequentes");
  },
  loader: () => {
    console.log("Executa no servidor durante a requisição inicial");
    console.log("Executa no cliente nas navegações subsequentes");
  },
  component: () => <div>Este componente é renderizado no servidor</div>,
});
```

### `ssr: false`

Isso desabilita no lado do servidor:

- A execução de `beforeLoad` e `loader` da rota.
- A renderização do componente da rota.

```tsx
// src/routes/posts/$postId.tsx
export const Route = createFileRoute("/posts/$postId")({
  ssr: false,
  beforeLoad: () => {
    console.log("Executa no cliente durante a hidratação");
  },
  loader: () => {
    console.log("Executa no cliente durante a hidratação");
  },
  component: () => <div>Este componente é renderizado no cliente</div>,
});
```

### `ssr: 'data-only'`

Esta opção híbrida irá:

- Executar `beforeLoad` no servidor e enviar o contexto resultante para o cliente.
- Executar `loader` no servidor e enviar os dados do loader para o cliente.
- Desabilitar a renderização no servidor do componente da rota.

```tsx
// src/routes/posts/$postId.tsx
export const Route = createFileRoute("/posts/$postId")({
  ssr: "data-only",
  beforeLoad: () => {
    console.log("Executa no servidor durante a requisição inicial");
    console.log("Executa no cliente nas navegações subsequentes");
  },
  loader: () => {
    console.log("Executa no servidor durante a requisição inicial");
    console.log("Executa no cliente nas navegações subsequentes");
  },
  component: () => <div>Este componente é renderizado no cliente</div>,
});
```

### Forma Funcional

Para maior flexibilidade, você pode usar a forma funcional da propriedade `ssr` para decidir em tempo de execução se uma rota deve ter SSR:

```tsx
// src/routes/docs/$docType/$docId.tsx
export const Route = createFileRoute("/docs/$docType/$docId")({
  validateSearch: z.object({ details: z.boolean().optional() }),
  ssr: ({ params, search }) => {
    if (params.status === "success" && params.value.docType === "sheet") {
      return false;
    }
    if (search.status === "success" && search.value.details) {
      return "data-only";
    }
  },
  beforeLoad: () => {
    console.log("Executa no servidor dependendo do resultado de ssr()");
  },
  loader: () => {
    console.log("Executa no servidor dependendo do resultado de ssr()");
  },
  component: () => <div>Este componente é renderizado no cliente</div>,
});
```

A função `ssr` é executada apenas no servidor durante a requisição inicial e é removida do bundle do cliente.

`search` e `params` são passados após a validação como uma union discriminada:

```tsx
params:
    | { status: 'success'; value: Expand<ResolveAllParamsFromParent<TParentRoute, TParams>> }
    | { status: 'error'; error: unknown }
search:
    | { status: 'success'; value: Expand<ResolveFullSearchSchema<TParentRoute, TSearchValidator>> }
    | { status: 'error'; error: unknown }
```

Se a validação falhar, `status` será `error` e `error` conterá os detalhes da falha. Caso contrário, `status` será `success` e `value` conterá os dados validados.

### Herança

Em tempo de execução, uma rota filha herda a configuração de SSR Seletivo de sua rota pai. No entanto, o valor herdado só pode ser alterado para ser mais restritivo (ou seja, de `true` para `data-only` ou `false`, e de `data-only` para `false`). Por exemplo:

```tsx
root { ssr: undefined }
  posts { ssr: false }
     $postId { ssr: true }
```

- `root` tem o padrão `ssr: true`.
- `posts` define explicitamente `ssr: false`, então nem `beforeLoad` nem `loader` serão executados no servidor, e o componente da rota não será renderizado no servidor.
- `$postId` define `ssr: true`, mas herda `ssr: false` de seu pai. Como o valor herdado só pode ser alterado para ser mais restritivo, `ssr: true` não tem efeito e o `ssr: false` herdado permanecerá.

Outro exemplo:

```tsx
root { ssr: undefined }
  posts { ssr: 'data-only' }
     $postId { ssr: true }
       details { ssr: false }
```

- `root` tem o padrão `ssr: true`.
- `posts` define `ssr: 'data-only'`, então `beforeLoad` e `loader` são executados no servidor, mas o componente da rota não é renderizado no servidor.
- `$postId` define `ssr: true`, mas herda `ssr: 'data-only'` de seu pai.
- `details` define `ssr: false`, então nem `beforeLoad` nem `loader` serão executados no servidor, e o componente da rota não será renderizado no servidor. Aqui o valor herdado é alterado para ser mais restritivo e, portanto, o `ssr: false` sobrescreverá o valor herdado.

## Renderização de Fallback

Para a primeira rota com `ssr: false` ou `ssr: 'data-only'`, o servidor renderizará o `pendingComponent` da rota como fallback. Se `pendingComponent` não estiver configurado, o `defaultPendingComponent` será renderizado. Se nenhum dos dois estiver configurado, nenhum fallback será renderizado.

No cliente durante a hidratação, esse fallback será exibido por pelo menos `minPendingMs` (ou `defaultPendingMinMs` se não configurado), mesmo que a rota não tenha `beforeLoad` ou `loader` definidos.

## Como desabilitar o SSR da rota raiz?

Você pode desabilitar a renderização no servidor do componente da rota raiz, porém o shell `<html>` ainda precisa ser renderizado no servidor. Esse shell é configurado através da propriedade `shellComponent` e recebe uma única propriedade `children`. O `shellComponent` sempre passa por SSR e envolve o `component` raiz, o `errorComponent` raiz ou o componente `notFound` raiz, respectivamente.

Uma configuração mínima de uma rota raiz com SSR desabilitado para o componente da rota é assim:

```tsx
import * as React from "react";

import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";

export const Route = createRootRoute({
  shellComponent: RootShell,
  component: RootComponent,
  errorComponent: () => <div>Erro</div>,
  notFoundComponent: () => <div>Não encontrado</div>,
  ssr: false, // ou `defaultSsr: false` no router
});

function RootShell({ children }: { children: React.ReactNode }) {
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

function RootComponent() {
  return (
    <div>
      <h1>Este componente será renderizado no cliente</h1>
      <Outlet />
    </div>
  );
}
```
