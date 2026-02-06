---
id: seo
title: SEO
---

> [!NOTE]
> Quer otimizar para assistentes de IA e LLMs? Veja o [guia de Otimização para LLMs (LLMO)](./llmo).

## O que é SEO, de verdade?

SEO (Search Engine Optimization, ou Otimização para Motores de Busca) é frequentemente mal interpretado como simplesmente "aparecer no Google" ou uma caixinha que uma biblioteca pode magicamente marcar. Na realidade, SEO é uma disciplina ampla focada em entregar conteúdo valioso que as pessoas precisam e torná-lo fácil de encontrar.

**SEO técnico** é um subconjunto do SEO com o qual os desenvolvedores interagem mais diretamente. Ele envolve o uso de ferramentas e APIs que satisfazem os requisitos técnicos de motores de busca, crawlers, ranqueadores e até LLMs. Quando alguém diz que um framework tem "bom suporte a SEO", normalmente quer dizer que ele fornece as ferramentas para tornar esse processo direto.

O TanStack Start oferece capacidades abrangentes de SEO técnico, mas você ainda precisa fazer o trabalho para usá-las de forma eficaz.

## O que o TanStack Start Oferece

O TanStack Start fornece os blocos de construção para SEO técnico:

- **Renderização no Lado do Servidor (SSR)** - Garante que crawlers recebam HTML totalmente renderizado
- **Pré-renderização Estática** - Pré-gera páginas para desempenho e rastreabilidade ideais
- **Gerenciamento do Head do Documento** - Controle total sobre meta tags, títulos e dados estruturados
- **Desempenho** - Tempos de carregamento rápidos por meio de code-splitting, streaming e empacotamento otimizado

## Gerenciamento do Head do Documento

A propriedade `head` nas rotas é sua ferramenta principal para SEO. Ela permite definir títulos de página, meta descriptions, tags Open Graph e mais.

### Meta Tags Básicas

```tsx
// src/routes/index.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My App - Home" },
      {
        name: "description",
        content: "Welcome to My App, a platform for...",
      },
    ],
  }),
  component: HomePage,
});
```

### Meta Tags Dinâmicas

Use dados do loader para gerar meta tags dinâmicas em páginas de conteúdo:

```tsx
// src/routes/posts/$postId.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/posts/$postId")({
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId);
    return { post };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData.post.title },
      { name: "description", content: loaderData.post.excerpt },
    ],
  }),
  component: PostPage,
});
```

### Open Graph e Compartilhamento em Redes Sociais

As tags Open Graph controlam como suas páginas aparecem quando compartilhadas em redes sociais:

```tsx
export const Route = createFileRoute("/posts/$postId")({
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId);
    return { post };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData.post.title },
      { name: "description", content: loaderData.post.excerpt },
      // Open Graph
      { property: "og:title", content: loaderData.post.title },
      { property: "og:description", content: loaderData.post.excerpt },
      { property: "og:image", content: loaderData.post.coverImage },
      { property: "og:type", content: "article" },
      // Twitter Card
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: loaderData.post.title },
      { name: "twitter:description", content: loaderData.post.excerpt },
      { name: "twitter:image", content: loaderData.post.coverImage },
    ],
  }),
  component: PostPage,
});
```

### URLs Canônicas

URLs canônicas ajudam a prevenir problemas de conteúdo duplicado:

```tsx
export const Route = createFileRoute("/posts/$postId")({
  head: ({ params }) => ({
    links: [
      {
        rel: "canonical",
        href: `https://myapp.com/posts/${params.postId}`,
      },
    ],
  }),
  component: PostPage,
});
```

## Dados Estruturados (JSON-LD)

Dados estruturados ajudam os motores de busca a entender seu conteúdo e podem habilitar resultados ricos nas buscas:

```tsx
export const Route = createFileRoute("/posts/$postId")({
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId);
    return { post };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData.post.title }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: loaderData.post.title,
          description: loaderData.post.excerpt,
          image: loaderData.post.coverImage,
          author: {
            "@type": "Person",
            name: loaderData.post.author.name,
          },
          datePublished: loaderData.post.publishedAt,
        }),
      },
    ],
  }),
  component: PostPage,
});
```

## Renderização no Lado do Servidor

O SSR é habilitado por padrão no TanStack Start. Isso garante que os crawlers dos motores de busca recebam conteúdo HTML totalmente renderizado, o que é fundamental para SEO.

```tsx
// SSR é automático - suas páginas são renderizadas no servidor
export const Route = createFileRoute("/about")({
  component: AboutPage,
});
```

Para rotas que não precisam de SSR, você pode desabilitá-lo seletivamente. No entanto, esteja ciente de que isso pode impactar o SEO dessas páginas:

```tsx
// Desabilite o SSR apenas para páginas que não precisam de SEO
export const Route = createFileRoute("/dashboard")({
  ssr: false, // O dashboard não precisa ser indexado
  component: DashboardPage,
});
```

Veja o [guia de SSR Seletivo](./selective-ssr) para mais detalhes.

## Pré-renderização Estática

Para conteúdo que não muda frequentemente, a pré-renderização estática gera HTML em tempo de build para desempenho ideal:

```ts
// vite.config.ts
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  plugins: [
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true,
      },
    }),
  ],
});
```

Páginas pré-renderizadas carregam mais rápido e são facilmente rastreáveis. Veja o [guia de Pré-renderização Estática](./static-prerendering) para opções de configuração.

## Sitemaps

### Geração Integrada de Sitemap

O TanStack Start pode gerar automaticamente um sitemap quando você habilita a pré-renderização com rastreamento de links:

```ts
// vite.config.ts
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  plugins: [
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true, // Descobre todas as páginas com links
      },
      sitemap: {
        enabled: true,
        host: "https://myapp.com",
      },
    }),
  ],
});
```

O sitemap é gerado em tempo de build rastreando todas as páginas descobríveis a partir das suas rotas. Esta é a abordagem recomendada para sites estáticos ou majoritariamente estáticos.

### Sitemap Estático

Para sites simples, você também pode colocar um arquivo estático `sitemap.xml` no seu diretório `public`:

```xml
<!-- public/sitemap.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://myapp.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://myapp.com/about</loc>
    <changefreq>monthly</changefreq>
  </url>
</urlset>
```

Essa abordagem funciona bem quando a estrutura do seu site é conhecida e não muda com frequência.

### Sitemap Dinâmico

Para sites com conteúdo dinâmico que não pode ser descoberto em tempo de build, você pode criar um sitemap dinâmico usando uma [rota de servidor](./server-routes). Considere fazer cache disso no seu CDN para melhor desempenho:

```ts
// src/routes/sitemap[.]xml.ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const posts = await fetchAllPosts();

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://myapp.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${posts
    .map(
      (post) => `
  <url>
    <loc>https://myapp.com/posts/${post.id}</loc>
    <lastmod>${post.updatedAt}</lastmod>
    <changefreq>weekly</changefreq>
  </url>`,
    )
    .join("")}
</urlset>`;

        return new Response(sitemap, {
          headers: {
            "Content-Type": "application/xml",
          },
        });
      },
    },
  },
});
```

## robots.txt

### robots.txt Estático

A abordagem mais simples é colocar um arquivo estático `robots.txt` no seu diretório `public`:

```txt
// public/robots.txt
User-agent: *
Allow: /

Sitemap: https://myapp.com/sitemap.xml
```

Esse arquivo será servido automaticamente em `/robots.txt`. Esta é a abordagem mais comum para a maioria dos sites.

### robots.txt Dinâmico

Para cenários mais complexos (por exemplo, regras diferentes por ambiente), você pode criar um arquivo robots.txt usando uma [rota de servidor](./server-routes):

```ts
// src/routes/robots[.]txt.ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const robots = `User-agent: *
Allow: /

Sitemap: https://myapp.com/sitemap.xml`;

        return new Response(robots, {
          headers: {
            "Content-Type": "text/plain",
          },
        });
      },
    },
  },
});
```

## Boas Práticas

### Desempenho Importa

A velocidade da página é um fator de ranqueamento. O TanStack Start ajuda com:

- **Code-splitting automático** - Carrega apenas o JavaScript necessário para cada página
- **Streaming SSR** - Começa a enviar HTML para o navegador imediatamente
- **Preloading** - Pré-carrega rotas antes que os usuários naveguem até elas

### Conteúdo é Rei

SEO técnico é apenas uma peça do quebra-cabeça. Os fatores mais importantes são:

- **Conteúdo de qualidade** - Crie conteúdo que ofereça valor aos usuários
- **Estrutura clara do site** - Organize suas rotas de forma lógica
- **URLs descritivas** - Use segmentos de caminho significativos (`/posts/my-great-article` vs `/posts/123`)
- **Links internos** - Ajude usuários e crawlers a descobrir seu conteúdo

### Teste Sua Implementação

Use essas ferramentas para verificar sua implementação de SEO:

- [Google Search Console](https://search.google.com/search-console) - Monitore a indexação e o desempenho nas buscas
- [Google Rich Results Test](https://search.google.com/test/rich-results) - Valide dados estruturados
- [Open Graph Debugger](https://developers.facebook.com/tools/debug/) - Visualize cards de compartilhamento em redes sociais
- DevTools do navegador - Inspecione o HTML renderizado e as meta tags

### Acompanhe Seus Rankings

Para monitorar seu desempenho de SEO ao longo do tempo, recomendamos o [Nozzle.io](https://nozzle.io?utm_source=tanstack). O Nozzle oferece rastreamento de rankings de nível empresarial que permite monitorar palavras-chave ilimitadas, rastrear recursos da SERP e analisar sua visibilidade em relação aos concorrentes. Diferente dos rastreadores de ranking tradicionais, o Nozzle armazena a SERP inteira para cada consulta, fornecendo dados completos para entender como suas páginas performam nos resultados de busca.
