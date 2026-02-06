---
id: llmo
title: Otimização para LLMs (LLMO)
---

> [!NOTE]
> Procurando por otimização tradicional para mecanismos de busca? Veja o [guia de SEO](./seo).

## O que é LLMO?

**LLM Optimization (LLMO)**, também conhecida como **AI Optimization (AIO)** ou **Generative Engine Optimization (GEO)**, é a prática de estruturar seu conteúdo e dados para que sistemas de IA — como ChatGPT, Claude, Perplexity e outras ferramentas baseadas em LLMs — possam entender, citar e recomendar seu conteúdo com precisão.

Enquanto o SEO tradicional foca em ranquear nas páginas de resultados dos mecanismos de busca, o LLMO foca em ser representado com precisão nas respostas geradas por IA. À medida que mais usuários obtêm informações por meio de assistentes de IA em vez de buscas tradicionais, isso se torna cada vez mais importante.

## Como o LLMO Difere do SEO

| Aspecto               | SEO                            | LLMO                                   |
| ---------------------- | ------------------------------ | -------------------------------------- |
| **Objetivo**           | Ranquear nos resultados de busca | Ser citado/recomendado por IA          |
| **Público**            | Crawlers de mecanismos de busca | Sistemas de treinamento e recuperação de LLMs |
| **Sinais-chave**       | Links, palavras-chave, velocidade da página | Dados estruturados, clareza, autoridade |
| **Formato do conteúdo**| Otimizado para snippets        | Otimizado para extração e síntese      |

A boa notícia: muitas das melhores práticas de LLMO se sobrepõem ao SEO. Estrutura clara, conteúdo autoritativo e bons metadados ajudam ambos.

## O que o TanStack Start Oferece

Recursos do TanStack Start que suportam LLMO:

- **Renderização no Servidor (SSR)** - Garante que crawlers de IA vejam o conteúdo totalmente renderizado
- **Dados Estruturados** - Suporte a JSON-LD para conteúdo legível por máquina
- **Gerenciamento do Head do Documento** - Meta tags que sistemas de IA podem interpretar
- **Rotas de Servidor** - Crie endpoints legíveis por máquina (APIs, feeds)

## Dados Estruturados para IA

Dados estruturados usando o vocabulário schema.org ajudam sistemas de IA a entender o significado e o contexto do seu conteúdo. Essa é talvez a técnica de LLMO mais importante.

### Schema de Artigo

```tsx
// src/routes/posts/$postId.tsx
import { createFileRoute } from "@tanstack/react-router";

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
            url: loaderData.post.author.url,
          },
          publisher: {
            "@type": "Organization",
            name: "My Company",
            logo: {
              "@type": "ImageObject",
              url: "https://myapp.com/logo.png",
            },
          },
          datePublished: loaderData.post.publishedAt,
          dateModified: loaderData.post.updatedAt,
        }),
      },
    ],
  }),
  component: PostPage,
});
```

### Schema de Produto

Para e-commerce, o schema de produto ajuda assistentes de IA a fornecer informações precisas sobre produtos:

```tsx
export const Route = createFileRoute("/products/$productId")({
  loader: async ({ params }) => {
    const product = await fetchProduct(params.productId);
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData.product.name }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: loaderData.product.name,
          description: loaderData.product.description,
          image: loaderData.product.images,
          brand: {
            "@type": "Brand",
            name: loaderData.product.brand,
          },
          offers: {
            "@type": "Offer",
            price: loaderData.product.price,
            priceCurrency: "USD",
            availability: loaderData.product.inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
          aggregateRating: loaderData.product.rating
            ? {
                "@type": "AggregateRating",
                ratingValue: loaderData.product.rating,
                reviewCount: loaderData.product.reviewCount,
              }
            : undefined,
        }),
      },
    ],
  }),
  component: ProductPage,
});
```

### Schema de Organização e Website

Adicione o schema de organização à sua rota raiz para contexto em todo o site:

```tsx
// src/routes/__root.tsx
export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "My App",
          url: "https://myapp.com",
          publisher: {
            "@type": "Organization",
            name: "My Company",
            url: "https://myapp.com",
            logo: "https://myapp.com/logo.png",
            sameAs: [
              "https://twitter.com/mycompany",
              "https://github.com/mycompany",
            ],
          },
        }),
      },
    ],
  }),
  component: RootComponent,
});
```

### Schema de FAQ

O schema de FAQ é particularmente eficaz para LLMO — sistemas de IA frequentemente extraem pares de perguntas e respostas:

```tsx
export const Route = createFileRoute("/faq")({
  loader: async () => {
    const faqs = await fetchFAQs();
    return { faqs };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: "Frequently Asked Questions" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: loaderData.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }),
      },
    ],
  }),
  component: FAQPage,
});
```

## Endpoints Legíveis por Máquina

Crie endpoints de API que sistemas de IA e desenvolvedores possam consumir diretamente:

```ts
// src/routes/api/products.ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/products")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const category = url.searchParams.get("category");

        const products = await fetchProducts({ category });

        return Response.json({
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: products.map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Product",
              name: product.name,
              description: product.description,
              url: `https://myapp.com/products/${product.id}`,
            },
          })),
        });
      },
    },
  },
});
```

## Melhores Práticas de Conteúdo

Além da implementação técnica, a estrutura do conteúdo é importante para LLMO:

### Declarações Claras e Factuais

Sistemas de IA extraem afirmações factuais. Torne suas informações-chave explícitas:

```tsx
// Bom: Fatos claros e extraíveis
function ProductDetails({ product }) {
  return (
    <article>
      <h1>{product.name}</h1>
      <p>
        {product.name} is a {product.category} made by {product.brand}. It costs
        ${product.price} and is available in {product.colors.join(", ")}.
      </p>
    </article>
  );
}
```

### Estrutura Hierárquica

Use hierarquia adequada de headings — sistemas de IA usam isso para entender a organização do conteúdo:

```tsx
function DocumentationPage() {
  return (
    <article>
      <h1>Getting Started with TanStack Start</h1>

      <section>
        <h2>Installation</h2>
        <p>Install TanStack Start using npm...</p>

        <h3>Prerequisites</h3>
        <p>You'll need Node.js 18 or later...</p>
      </section>

      <section>
        <h2>Configuration</h2>
        <p>Configure your app in vite.config.ts...</p>
      </section>
    </article>
  );
}
```

### Atribuição Autoritativa

Inclua informações de autoria e fontes — sistemas de IA consideram sinais de autoridade:

```tsx
export const Route = createFileRoute("/posts/$postId")({
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData.post.title },
      { name: "author", content: loaderData.post.author.name },
      {
        property: "article:author",
        content: loaderData.post.author.profileUrl,
      },
      {
        property: "article:published_time",
        content: loaderData.post.publishedAt,
      },
    ],
  }),
  component: PostPage,
});
```

## llms.txt

Alguns sites estão adotando um arquivo `llms.txt` (semelhante ao `robots.txt`) para fornecer orientações a sistemas de IA:

```ts
// src/routes/llms[.]txt.ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async () => {
        const content = `# My App

> My App is a platform for building modern web applications.

## Documentation
- Getting Started: https://myapp.com/docs/getting-started
- API Reference: https://myapp.com/docs/api

## Key Facts
- Built with TanStack Start
- Supports React and Solid
- Full TypeScript support

## Contact
- Website: https://myapp.com
- GitHub: https://github.com/mycompany/myapp
`;

        return new Response(content, {
          headers: {
            "Content-Type": "text/plain",
          },
        });
      },
    },
  },
});
```

## Monitorando Citações de IA

Diferente do SEO tradicional com analytics estabelecidos, o monitoramento de LLMO ainda está evoluindo. Considere:

- **Teste com assistentes de IA** - Pergunte ao ChatGPT, Claude e Perplexity sobre seu produto/conteúdo
- **Monitore menções à marca** - Acompanhe como sistemas de IA descrevem suas ofertas
- **Valide dados estruturados** - Use o [Teste de Resultados Ricos do Google](https://search.google.com/test/rich-results) e o [Validador do Schema.org](https://validator.schema.org/)
- **Verifique mecanismos de busca com IA** - Monitore a presença no Perplexity, Bing Chat e Google AI Overviews
