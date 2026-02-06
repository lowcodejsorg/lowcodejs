---
id: path-aliases
title: Aliases de Caminho
---

Aliases de caminho são um recurso útil do TypeScript que permite definir um atalho para um caminho que pode estar distante na estrutura de diretórios do seu projeto. Isso pode ajudar a evitar importações relativas longas no seu código e facilitar a refatoração da estrutura do projeto. Isso é especialmente útil para evitar importações relativas longas no seu código.

Por padrão, o TanStack Start não inclui aliases de caminho. No entanto, você pode adicioná-los facilmente ao seu projeto atualizando o arquivo `tsconfig.json` na raiz do projeto e incluindo a seguinte configuração:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "~/*": ["./src/*"]
    }
  }
}
```

Neste exemplo, definimos o alias de caminho `~/*` que mapeia para o diretório `./src/*`. Isso significa que agora você pode importar arquivos do diretório `src` usando o prefixo `~`.

Após atualizar o arquivo `tsconfig.json`, você precisará instalar o plugin `vite-tsconfig-paths` para habilitar os aliases de caminho no seu projeto TanStack Start. Você pode fazer isso executando o seguinte comando:

```sh
npm install -D vite-tsconfig-paths
```

Agora, você precisará atualizar o arquivo `vite.config.ts` para incluir o seguinte:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  vite: {
    plugins: [
      // este é o plugin que habilita os aliases de caminho
      viteTsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
    ],
  },
});
```

Após concluir essa configuração, você poderá importar arquivos usando o alias de caminho da seguinte forma:

```ts
// app/routes/posts/$postId/edit.tsx
import { Input } from "~/components/ui/input";

// ao invés de

import { Input } from "../../../components/ui/input";
```
