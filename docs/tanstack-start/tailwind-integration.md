---
id: tailwind-integration
title: Integração com Tailwind CSS
---

_Quer usar Tailwind CSS no seu projeto TanStack Start?_

Este guia vai te ajudar a usar o Tailwind CSS no seu projeto TanStack Start.

## Tailwind CSS Versão 4 (Mais Recente)

A versão mais recente do Tailwind CSS é a 4. Ela possui algumas mudanças de configuração que diferem significativamente da versão 3. É **mais fácil e recomendado** configurar o Tailwind CSS Versão 4 em um projeto TanStack Start, já que o TanStack Start utiliza o Vite como ferramenta de build.

### Instalar o Tailwind CSS

Instale o Tailwind CSS e seu plugin para Vite.

```shell
npm install tailwindcss @tailwindcss/vite
```

### Configurar o Plugin do Vite

Adicione o plugin `@tailwindcss/vite` à sua configuração do Vite.

```ts
// vite.config.ts
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [tsConfigPaths(), tanstackStart(), viteReact(), tailwindcss()],
});
```

### Importar o Tailwind no seu arquivo CSS

Na versão 4, você precisa criar um arquivo CSS para configurar o Tailwind CSS em vez de um arquivo de configuração. Você pode fazer isso criando um arquivo `src/styles/app.css` ou nomeá-lo como preferir.

```css
/* src/styles/app.css */
@import "tailwindcss" source("../");
```

## Importar o arquivo CSS no seu `__root.tsx`

Importe o arquivo CSS no seu `__root.tsx` com a query `?url` e certifique-se de adicionar a diretiva **triple slash** no topo do arquivo.

```tsx
// src/routes/__root.tsx
/// <reference types="vite/client" />
// outras importações...

import appCss from "../styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      // suas meta tags e configuração do site
    ],
    links: [{ rel: "stylesheet", href: appCss }],
    // outras configurações do head
  }),
  component: RootComponent,
});
```

## Usar o Tailwind CSS em qualquer lugar do seu projeto

Agora você pode usar o Tailwind CSS em qualquer lugar do seu projeto.

```tsx
// src/routes/index.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <div className="bg-red-500 text-white p-4">Hello World</div>;
}
```

Pronto! Agora você pode usar o Tailwind CSS em qualquer lugar do seu projeto.

## Tailwind CSS Versão 3 (Legado)

Se você deseja usar o Tailwind CSS Versão 3, siga os passos abaixo.

### Instalar o Tailwind CSS

Instale o Tailwind CSS e suas dependências.

```shell
npm install -D tailwindcss@3 postcss autoprefixer
```

Em seguida, gere os arquivos de configuração do Tailwind e do PostCSS.

```shell
npx tailwindcss init -p
```

### Configurar os caminhos dos seus templates

Adicione os caminhos para todos os seus arquivos de template no arquivo `tailwind.config.js`.

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### Adicionar as diretivas do Tailwind ao seu arquivo CSS

Adicione as diretivas `@tailwind` para cada uma das camadas do Tailwind no seu arquivo `src/styles/app.css`.

```css
/* src/styles/app.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

> [!NOTE]
> Vá para [Importar o arquivo CSS no seu `__root.tsx`](#importar-o-arquivo-css-no-seu-__roottsx) para ver como importar o arquivo CSS no seu `__root.tsx`.
