---
id: static-prerendering
title: Pré-renderização Estática
---

Pré-renderização estática é o processo de gerar arquivos HTML estáticos para a sua aplicação. Isso pode ser útil tanto para melhorar o desempenho da sua aplicação, pois permite servir arquivos HTML pré-renderizados aos usuários sem precisar gerá-los dinamicamente, quanto para fazer deploy de sites estáticos em plataformas que não suportam renderização do lado do servidor.

## Pré-renderização

O TanStack Start pode pré-renderizar sua aplicação em arquivos HTML estáticos, que podem então ser servidos aos usuários sem precisar gerá-los dinamicamente. Para pré-renderizar sua aplicação, você pode adicionar a opção `prerender` à configuração do tanstackStart no arquivo `vite.config.ts`:

```ts
// vite.config.ts

import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    tanstackStart({
      prerender: {
        // Habilitar pré-renderização
        enabled: true,

        // Habilite se precisar que as páginas fiquem em `/page/index.html` em vez de `/page.html`
        autoSubfolderIndex: true,

        // Se desabilitado, apenas o caminho raiz ou os caminhos definidos na configuração de pages serão pré-renderizados
        autoStaticPathsDiscovery: true,

        // Quantos jobs de pré-renderização executar simultaneamente
        concurrency: 14,

        // Se deve extrair links do HTML e pré-renderizá-los também
        crawlLinks: true,

        // Função de filtro que recebe o objeto da página e retorna se ela deve ser pré-renderizada
        filter: ({ path }) => !path.startsWith("/do-not-render-me"),

        // Número de tentativas para um job de pré-renderização que falhou
        retryCount: 2,

        // Atraso entre tentativas em milissegundos
        retryDelay: 1000,

        // Número máximo de redirecionamentos a seguir durante a pré-renderização
        maxRedirects: 5,

        // Falhar se ocorrer um erro durante a pré-renderização
        failOnError: true,

        // Callback quando a página é renderizada com sucesso
        onSuccess: ({ page }) => {
          console.log(`Rendered ${page.path}!`);
        },
      },
      // Configuração opcional para páginas específicas
      // Nota: Quando autoStaticPathsDiscovery está habilitado (padrão), as rotas
      // estáticas descobertas serão mescladas com as páginas especificadas abaixo
      pages: [
        {
          path: "/my-page",
          prerender: { enabled: true, outputPath: "/my-page/index.html" },
        },
      ],
    }),
    viteReact(),
  ],
});
```

## Descoberta Automática de Rotas Estáticas

Todos os caminhos estáticos serão automaticamente descobertos e mesclados de forma transparente com a configuração de `pages` especificada.

Rotas são excluídas da descoberta automática nos seguintes casos:

- Rotas com parâmetros de caminho (ex: `/users/$userId`), pois requerem valores específicos de parâmetro
- Rotas de layout (prefixadas com `_`), pois não renderizam páginas independentes
- Rotas sem componentes (ex: rotas de API)

Nota: Rotas dinâmicas ainda podem ser pré-renderizadas se estiverem linkadas a partir de outras páginas quando `crawlLinks` está habilitado.

## Crawling de Links

Quando `crawlLinks` está habilitado (padrão: `true`), o TanStack Start irá extrair links das páginas pré-renderizadas e pré-renderizar essas páginas linkadas também.

Por exemplo, se `/` contém um link para `/posts`, então `/posts` também será automaticamente pré-renderizado.
