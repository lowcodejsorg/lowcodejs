---
id: hosting
title: Hospedagem
---

Hospedagem é o processo de fazer o deploy da sua aplicação na internet para que os usuários possam acessá-la. Essa é uma parte essencial de qualquer projeto de desenvolvimento web, garantindo que sua aplicação esteja disponível para o mundo. O TanStack Start é construído sobre o Vite, uma poderosa plataforma de desenvolvimento/build que nos permite tornar possível o deploy da sua aplicação em qualquer provedor de hospedagem.

## O que devo usar?

O TanStack Start é **projetado para funcionar com qualquer provedor de hospedagem**, então se você já tem um provedor de hospedagem em mente, pode fazer o deploy da sua aplicação lá usando as APIs full-stack fornecidas pelo TanStack Start.

No entanto, como a hospedagem é um dos aspectos mais cruciais do desempenho, confiabilidade e escalabilidade da sua aplicação, recomendamos usar um dos nossos **Parceiros Oficiais de Hospedagem**: [Cloudflare](https://www.cloudflare.com?utm_source=tanstack), [Netlify](https://www.netlify.com?utm_source=tanstack) ou [Railway](https://railway.com?utm_source=tanstack).

## Deploy

Depois de escolher um destino de deploy, você pode seguir as orientações abaixo para fazer o deploy da sua aplicação TanStack Start no provedor de hospedagem de sua escolha:

- [`cloudflare-workers`](#cloudflare-workers--official-partner): Deploy no Cloudflare Workers
- [`netlify`](#netlify--official-partner): Deploy no Netlify
- [`railway`](#railway--official-partner): Deploy no Railway
- [`nitro`](#nitro): Deploy usando Nitro
- [`vercel`](#vercel): Deploy no Vercel
- [`node-server`](#nodejs--docker): Deploy em um servidor Node.js
- [`bun`](#bun): Deploy em um servidor Bun
- [`appwrite-sites`](#appwrite-sites): Deploy no Appwrite Sites
- ... e mais em breve!

### Cloudflare Workers ⭐ _Parceiro Oficial_

<a href="https://www.cloudflare.com?utm_source=tanstack" alt="Cloudflare Logo">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/tanstack/tanstack.com/main/src/images/cloudflare-white.svg" width="280">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/tanstack/tanstack.com/main/src/images/cloudflare-black.svg" width="280">
    <img alt="Cloudflare logo" src="https://raw.githubusercontent.com/tanstack/tanstack.com/main/src/images/cloudflare-black.svg" width="280">
  </picture>
</a>

Ao fazer o deploy no Cloudflare Workers, você precisará completar alguns passos extras antes que seus usuários possam começar a usar seu app.

1. Instale `@cloudflare/vite-plugin` e `wrangler`

```bash
pnpm add -D @cloudflare/vite-plugin wrangler
```

2. Adicione o plugin do Cloudflare ao seu arquivo `vite.config.ts`

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart(),
    viteReact(),
  ],
});
```

3. Adicione um arquivo de configuração `wrangler.jsonc`

```json
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "tanstack-start-app",
  "compatibility_date": "2025-09-02",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@tanstack/react-start/server-entry"
}
```

4. Modifique os scripts no seu arquivo `package.json`

```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build && tsc --noEmit",
    // ============ 👇 remova esta linha ============
    "start": "node .output/server/index.mjs",
    // ============ 👇 adicione estas linhas ============
    "preview": "vite preview",
    "deploy": "npm run build && wrangler deploy",
    "cf-typegen": "wrangler types"
  }
}
```

5. Faça login com o Wrangler para autenticar com sua conta Cloudflare.

```bash
npx wrangler login
```

ou se estiver usando pnpm:

```bash
pnpm dlx wrangler login
```

Para verificar o usuário atual, use `wrangler whoami`.

6. Deploy

```bash
pnpm run deploy
```

Faça o deploy da sua aplicação no Cloudflare Workers usando o processo de deploy com um clique, e pronto!

Um exemplo completo do TanStack Start para Cloudflare Workers está disponível [aqui](https://github.com/TanStack/router/tree/main/examples/react/start-basic-cloudflare).

### Netlify ⭐ _Parceiro Oficial_

<a href="https://www.netlify.com?utm_source=tanstack" alt="Netlify Logo">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/tanstack/tanstack.com/main/src/images/netlify-dark.svg" width="280">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/tanstack/tanstack.com/main/src/images/netlify-light.svg" width="280">
    <img alt="Netlify logo" src="https://raw.githubusercontent.com/tanstack/tanstack.com/main/src/images/netlify-light.svg" width="280">
  </picture>
</a>

Instale e adicione o plugin [`@netlify/vite-plugin-tanstack-start`](https://www.npmjs.com/package/@netlify/vite-plugin-tanstack-start), que configura seu build para deploy no Netlify e fornece emulação completa da plataforma de produção do Netlify no desenvolvimento local:

```bash
npm install --save-dev @netlify/vite-plugin-tanstack-start
# ou...
pnpm add --save-dev @netlify/vite-plugin-tanstack-start
# ou yarn, bun, etc.
```

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import netlify from "@netlify/vite-plugin-tanstack-start"; // ← adicione isto
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    tanstackStart(),
    netlify(), // ← adicione isto (em qualquer posição do array)
    viteReact(),
  ],
});
```

Por fim, use o [Netlify CLI](https://developers.netlify.com/cli/) para fazer o deploy do seu app:

```bash
npx netlify deploy
```

Se este for um novo projeto Netlify, você será solicitado a inicializá-lo e as configurações de build serão automaticamente definidas para você.

Para documentação mais detalhada, confira a documentação completa do [TanStack Start no Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/tanstack-start/).

#### Configuração manual

Alternativamente, se você preferir configuração manual, pode adicionar um arquivo `netlify.toml` na raiz do seu projeto:

```toml
[build]
  command = "vite build"
  publish = "dist/client"
[dev]
  command = "vite dev"
  port = 3000
```

Ou você pode definir as configurações acima diretamente [no app do Netlify](https://docs.netlify.com/build/configure-builds/overview/#build-settings).

#### Outros métodos de deploy

O Netlify também suporta outros métodos de deploy, como [deploy contínuo a partir de um repositório git hospedado no GitHub, GitLab ou outros](https://docs.netlify.com/start/quickstarts/deploy-from-repository/), [começar a partir de um template](https://docs.netlify.com/start/quickstarts/deploy-from-template/), [fazer deploy ou importar de uma ferramenta de geração de código com IA](https://docs.netlify.com/start/quickstarts/deploy-from-ai-code-generation-tool/) e [mais](https://docs.netlify.com/deploy/create-deploys/).

### Railway ⭐ _Parceiro Oficial_

<a href="https://railway.com?utm_source=tanstack" alt="Railway Logo">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/tanstack/tanstack.com/main/src/images/railway-dark.svg" width="280">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/tanstack/tanstack.com/main/src/images/railway-light.svg" width="280">
    <img alt="Railway logo" src="https://raw.githubusercontent.com/tanstack/tanstack.com/main/src/images/railway-light.svg" width="280">
  </picture>
</a>

O Railway fornece deploys instantâneos com zero configuração. Siga as instruções de deploy do [`Nitro`](#nitro) e então faça o deploy no Railway:

1. Envie seu código para um repositório no GitHub

2. Conecte seu repositório ao Railway em [railway.com](https://railway.com?utm_source=tanstack)

3. O Railway detectará automaticamente suas configurações de build e fará o deploy da sua aplicação

O Railway fornece automaticamente:

- **Deploys automáticos** a cada push para o seu repositório
- **Bancos de dados integrados** (Postgres, MySQL, Redis, MongoDB)
- **Ambientes de preview** para pull requests
- **HTTPS automático** e domínios personalizados

Para mais detalhes, veja a [documentação do Railway](https://docs.railway.com).

### Nitro

O [Nitro](https://v3.nitro.build/) é uma camada agnóstica que permite fazer o deploy de aplicações TanStack Start em [uma ampla variedade de hospedagens](https://v3.nitro.build/deploy).

**⚠️ O plugin [`nitro/vite`](https://v3.nitro.build/) integra-se nativamente com a API de Ambientes do Vite como a ferramenta de build subjacente para o TanStack Start. Ele ainda está em desenvolvimento ativo e recebe atualizações regulares. Por favor, reporte quaisquer problemas que encontrar com reprodução para que possam ser investigados.**

Instale a versão nightly do nitro especificando o seguinte no seu package.json

```json
"nitro": "npm:nitro-nightly@latest"
```

```tsx
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [tanstackStart(), nitro(), viteReact()],
});
```

### Vercel

Siga as instruções de deploy do [`Nitro`](#nitro).
Faça o deploy da sua aplicação no Vercel usando o processo de deploy com um clique, e pronto!

### Node.js / Docker

Siga as instruções de deploy do [`Nitro`](#nitro). Use o comando `node` para iniciar sua aplicação a partir dos arquivos de saída do build.

Certifique-se de que os scripts npm `build` e `start` estejam presentes no seu arquivo `package.json`:

```json
    "build": "vite build",
    "start": "node .output/server/index.mjs"
```

Então você pode executar o seguinte comando para fazer o build da sua aplicação:

```sh
npm run build
```

Você pode iniciar sua aplicação executando:

```sh
npm run start
```

### Bun

> [!IMPORTANT]
> Atualmente, as orientações de deploy específicas para Bun funcionam apenas com React 19. Se você estiver usando React 18, consulte as orientações de deploy do [Node.js](#nodejs--railway--docker).

Certifique-se de que seus pacotes `react` e `react-dom` estejam na versão 19.0.0 ou superior no seu arquivo `package.json`. Caso contrário, execute o seguinte comando para atualizar os pacotes:

```sh
bun install react@19 react-dom@19
```

Siga as instruções de deploy do [`Nitro`](#nitro).
Dependendo de como você invoca o build, pode ser necessário definir o preset `'bun'` na configuração do Nitro:

```ts
// vite.config.ts
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [tanstackStart(), nitro({ preset: "bun" }), viteReact()],
});
```

#### Servidor de produção com Bun

Alternativamente, você pode usar uma implementação de servidor personalizada que aproveita as APIs nativas do Bun.

Fornecemos uma implementação de referência que demonstra uma abordagem para construir um servidor Bun pronto para produção. Este exemplo usa funções nativas do Bun para desempenho otimizado e inclui recursos como pré-carregamento inteligente de assets e gerenciamento de memória.

**Este é um ponto de partida - sinta-se à vontade para adaptá-lo às suas necessidades ou simplificá-lo para o seu caso de uso.**

**O que este exemplo demonstra:**

- Servir assets estáticos usando o tratamento nativo de arquivos do Bun
- Estratégia de carregamento híbrida (pré-carregar arquivos pequenos, servir arquivos grandes sob demanda)
- Recursos opcionais como suporte a ETag e compressão Gzip
- Headers de cache prontos para produção

**Configuração rápida:**

1. Copie o arquivo [`server.ts`](https://github.com/tanstack/router/blob/main/examples/react/start-bun/server.ts) do repositório de exemplo para a raiz do seu projeto (ou use-o como inspiração para sua própria implementação)

2. Faça o build da sua aplicação:

   ```sh
   bun run build
   ```

3. Inicie o servidor:

   ```sh
   bun run server.ts
   ```

**Configuração (Opcional):**

A implementação do servidor de referência inclui diversas opções de configuração opcionais via variáveis de ambiente. Você pode usá-las como estão, modificá-las ou remover recursos que não precisa:

```sh
# Uso básico - funciona direto
bun run server.ts

# Configurações comuns
PORT=8080 bun run server.ts  # Porta personalizada
ASSET_PRELOAD_VERBOSE_LOGGING=true bun run server.ts  # Ver o que está acontecendo
```

**Variáveis de ambiente disponíveis:**

| Variável                         | Descrição                                              | Padrão                                                                        |
| -------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `PORT`                           | Porta do servidor                                      | `3000`                                                                        |
| `ASSET_PRELOAD_MAX_SIZE`         | Tamanho máximo do arquivo para pré-carregar na memória (bytes) | `5242880` (5MB)                                                               |
| `ASSET_PRELOAD_INCLUDE_PATTERNS` | Padrões glob separados por vírgula para arquivos a incluir | Todos os arquivos                                                             |
| `ASSET_PRELOAD_EXCLUDE_PATTERNS` | Padrões glob separados por vírgula para arquivos a excluir | Nenhum                                                                        |
| `ASSET_PRELOAD_VERBOSE_LOGGING`  | Habilitar logging detalhado                            | `false`                                                                       |
| `ASSET_PRELOAD_ENABLE_ETAG`      | Habilitar geração de ETag                              | `true`                                                                        |
| `ASSET_PRELOAD_ENABLE_GZIP`      | Habilitar compressão Gzip                              | `true`                                                                        |
| `ASSET_PRELOAD_GZIP_MIN_SIZE`    | Tamanho mínimo do arquivo para Gzip (bytes)            | `1024` (1KB)                                                                  |
| `ASSET_PRELOAD_GZIP_MIME_TYPES`  | Tipos MIME elegíveis para Gzip                         | `text/,application/javascript,application/json,application/xml,image/svg+xml` |

<details>
<summary>Exemplos de configuração avançada</summary>

```sh
# Otimizar para uso mínimo de memória
ASSET_PRELOAD_MAX_SIZE=1048576 bun run server.ts

# Pré-carregar apenas assets críticos
ASSET_PRELOAD_INCLUDE_PATTERNS="*.js,*.css" \
ASSET_PRELOAD_EXCLUDE_PATTERNS="*.map,vendor-*" \
bun run server.ts

# Desabilitar recursos opcionais
ASSET_PRELOAD_ENABLE_ETAG=false \
ASSET_PRELOAD_ENABLE_GZIP=false \
bun run server.ts

# Configuração personalizada de Gzip
ASSET_PRELOAD_GZIP_MIN_SIZE=2048 \
ASSET_PRELOAD_GZIP_MIME_TYPES="text/,application/javascript,application/json" \
bun run server.ts
```

</details>

**Exemplo de saída:**

```txt
📦 Loading static assets from ./dist/client...
   Max preload size: 5.00 MB

📁 Preloaded into memory:
   /assets/index-a1b2c3d4.js           45.23 kB │ gzip:  15.83 kB
   /assets/index-e5f6g7h8.css           12.45 kB │ gzip:   4.36 kB

💾 Served on-demand:
   /assets/vendor-i9j0k1l2.js          245.67 kB │ gzip:  86.98 kB

✅ Preloaded 2 files (57.68 KB) into memory
🚀 Server running at http://localhost:3000
```

Para um exemplo completo e funcional, confira o [exemplo TanStack Start + Bun](https://github.com/TanStack/router/tree/main/examples/react/start-bun) neste repositório.

### Appwrite Sites

Ao fazer o deploy no [Appwrite Sites](https://appwrite.io/products/sites), você precisará completar alguns passos:

1. **Crie um app TanStack Start** (ou use um existente)

```bash
npm create @tanstack/start@latest
```

2. **Envie seu projeto para um repositório no GitHub**

Crie um [repositório no GitHub](https://github.com/new) e envie seu código.

3. **Crie um projeto no Appwrite**

Acesse o [Appwrite Cloud](https://cloud.appwrite.io) e cadastre-se se ainda não tiver uma conta, então crie seu primeiro projeto.

4. **Faça o deploy do seu site**

No seu projeto Appwrite, navegue até a página **Sites** na barra lateral. Clique em **Create site**, selecione **Connect a repository**, conecte sua conta GitHub e selecione seu repositório.

1. Selecione a **branch de produção** e o **diretório raiz**
2. Verifique se **TanStack Start** está selecionado como framework
3. Confirme as configurações de build:
   - **Comando de instalação:** `npm install`
   - **Comando de build:** `npm run build`
   - **Diretório de saída:** `./dist` (se você estiver usando Nitro v2 ou v3, deve ser `./.output`)

4. Adicione quaisquer **variáveis de ambiente** necessárias
5. Clique em **Deploy**

Após o deploy bem-sucedido, clique no botão **Visit site** para ver sua aplicação implantada.
