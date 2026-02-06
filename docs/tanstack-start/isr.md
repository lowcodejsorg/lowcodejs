---
id: isr
title: Regeneração Estática Incremental (ISR)
---

A Regeneração Estática Incremental (ISR) permite que você sirva conteúdo gerado estaticamente a partir de uma CDN enquanto o regenera periodicamente em segundo plano. Isso oferece os benefícios de performance de sites estáticos com a atualidade do conteúdo dinâmico.

## Como o ISR Funciona no TanStack Start

A abordagem do TanStack Start para ISR é flexível e utiliza headers de cache HTTP padrão que funcionam com qualquer CDN. Diferente de implementações de ISR específicas de frameworks, essa abordagem oferece controle total sobre o comportamento de cache tanto no nível da página quanto no nível dos dados.

O conceito principal é simples:

1. **Pré-renderização Estática**: As páginas são geradas no momento do build
2. **Cache na CDN**: Os headers de cache controlam por quanto tempo as CDNs armazenam o HTML em cache
3. **Revalidação**: Após o cache expirar, a próxima requisição dispara a regeneração
4. **Stale-While-Revalidate**: Serve conteúdo obsoleto enquanto busca dados atualizados em segundo plano

## Estratégias de Cache Header

### Revalidação Baseada em Tempo

O padrão de ISR mais comum utiliza o header `Cache-Control` com as diretivas `max-age` e `s-maxage`:

```tsx
// vite.config.ts
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tanstackStart({
      prerender: {
        routes: ["/blog", "/blog/posts/*"],
        crawlLinks: true,
      },
    }),
  ],
});
```

```tsx
// routes/blog/posts/$postId.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/blog/posts/$postId")({
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId);
    return { post };
  },
  headers: () => ({
    // Cache na CDN por 1 hora, permite conteúdo obsoleto por até 1 dia
    "Cache-Control":
      "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
  }),
});

export default function BlogPost() {
  const { post } = Route.useLoaderData();
  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}
```

### Entendendo as Diretivas do Cache-Control

- **`public`**: A resposta pode ser armazenada em cache por qualquer cache (CDN, navegador, etc.)
- **`max-age=3600`**: O conteúdo é considerado atualizado por 3600 segundos (1 hora)
- **`s-maxage=3600`**: Sobrescreve o max-age para caches compartilhados (CDNs)
- **`stale-while-revalidate=86400`**: Serve conteúdo obsoleto enquanto revalida em segundo plano por até 24 horas
- **`immutable`**: O conteúdo nunca muda (use para assets baseados em hash)

## ISR com Server Functions

Server functions também podem definir headers de cache para endpoints de dados dinâmicos:

```tsx
// routes/api/products/$productId.ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/products/$productId")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const product = await db.products.findById(params.productId);

        return Response.json(
          { product },
          {
            headers: {
              "Cache-Control":
                "public, max-age=300, stale-while-revalidate=600",
              "CDN-Cache-Control": "max-age=3600", // Específico do Cloudflare
            },
          },
        );
      },
    },
  },
});
```

### Usando Middleware para Cache Headers

Para rotas de API, você pode usar middleware para definir headers de cache:

```tsx
// routes/api/products/$productId.ts
import { createFileRoute } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";

const cacheMiddleware = createMiddleware().server(async ({ next }) => {
  const result = await next();

  // Adiciona headers de cache à resposta
  result.response.headers.set(
    "Cache-Control",
    "public, max-age=3600, stale-while-revalidate=86400",
  );

  return result;
});

export const Route = createFileRoute("/api/products/$productId")({
  server: {
    middleware: [cacheMiddleware],
    handlers: {
      GET: async ({ params }) => {
        const product = await db.products.findById(params.productId);
        return Response.json({ product });
      },
    },
  },
});
```

Para rotas de página, é mais simples usar a propriedade `headers` diretamente:

```tsx
// routes/blog/posts/$postId.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/blog/posts/$postId")({
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId);
    return { post };
  },
  headers: () => ({
    "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
  }),
});
```

## Revalidação Sob Demanda

Embora a revalidação baseada em tempo funcione bem para a maioria dos casos, você pode precisar invalidar páginas específicas imediatamente (por exemplo, quando o conteúdo é atualizado):

```tsx
// routes/api/revalidate.ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/revalidate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { path, secret } = await request.json();

        // Verifica o token secreto
        if (secret !== process.env.REVALIDATE_SECRET) {
          return Response.json({ error: "Invalid token" }, { status: 401 });
        }

        // Dispara a purga do cache via API da sua CDN
        await fetch(
          `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${CF_API_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              files: [`https://yoursite.com${path}`],
            }),
          },
        );

        return Response.json({ revalidated: true });
      },
    },
  },
});
```

## Configuração Específica por CDN

### Cloudflare Workers

O Cloudflare respeita os headers `Cache-Control` padrão e oferece controle adicional:

```tsx
export const Route = createFileRoute("/products/$id")({
  headers: () => ({
    "Cache-Control": "public, max-age=3600",
    // Header específico do Cloudflare para controle mais refinado
    "CDN-Cache-Control": "max-age=7200",
  }),
});
```

### Netlify

O Netlify utiliza headers `Cache-Control` e também suporta arquivos `_headers`:

```plaintext
# public/_headers
/blog/*
  Cache-Control: public, max-age=3600, stale-while-revalidate=86400

/api/*
  Cache-Control: public, max-age=300
```

### Vercel

Ao fazer deploy na Vercel, use os headers de cache da Edge Network:

```tsx
export const Route = createFileRoute("/posts/$id")({
  headers: () => ({
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
  }),
});
```

## Combinando ISR com Cache no Lado do Cliente

O controle de cache integrado do TanStack Router funciona em conjunto com o cache da CDN:

```tsx
export const Route = createFileRoute("/posts/$postId")({
  loader: async ({ params }) => {
    return fetchPost(params.postId);
  },
  // Cache na CDN (via headers)
  headers: () => ({
    "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
  }),
  // Cache no lado do cliente (via TanStack Router)
  staleTime: 60_000, // Considera os dados atualizados por 60 segundos no cliente
  gcTime: 5 * 60_000, // Mantém na memória por 5 minutos
});
```

Isso cria uma estratégia de cache em múltiplas camadas:

1. **CDN Edge**: 1 hora de cache, stale-while-revalidate por 24 horas
2. **Cliente**: 60 segundos de dados atualizados, 5 minutos na memória

## Padrões Comuns de ISR

### Posts de Blog

```tsx
export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => fetchPost(params.slug),
  headers: () => ({
    // Cache por 1 hora, permite conteúdo obsoleto por 7 dias
    "Cache-Control": "public, max-age=3600, stale-while-revalidate=604800",
  }),
  staleTime: 5 * 60_000, // 5 minutos no lado do cliente
});
```

### Páginas de Produtos de E-commerce

```tsx
export const Route = createFileRoute("/products/$id")({
  loader: async ({ params }) => fetchProduct(params.id),
  headers: () => ({
    // Cache mais curto devido a mudanças de estoque
    "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
  }),
  staleTime: 30_000, // 30 segundos no lado do cliente
});
```

### Páginas de Marketing (Landing Pages)

```tsx
export const Route = createFileRoute("/landing/$campaign")({
  loader: async ({ params }) => fetchCampaign(params.campaign),
  headers: () => ({
    // Cache longo para conteúdo estável
    "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
  }),
  staleTime: 60 * 60_000, // 1 hora no lado do cliente
});
```

### Páginas Específicas do Usuário

```tsx
export const Route = createFileRoute("/dashboard")({
  loader: async () => fetchUserData(),
  headers: () => ({
    // Cache privado, sem cache na CDN
    "Cache-Control": "private, max-age=60",
  }),
  staleTime: 30_000,
});
```

## Boas Práticas

### 1. Comece de Forma Conservadora

Comece com tempos de cache mais curtos e aumente conforme você entende os padrões de atualização do seu conteúdo:

```tsx
// Comece aqui
'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'

// Depois avance para
'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
```

### 2. Use ETags para Validação

ETags ajudam as CDNs a revalidar conteúdo de forma eficiente:

```tsx
import { createMiddleware } from "@tanstack/react-start";
import crypto from "crypto";

const etagMiddleware = createMiddleware().server(async ({ next }) => {
  const result = await next();

  // Gera ETag a partir do conteúdo da resposta
  const etag = crypto
    .createHash("md5")
    .update(JSON.stringify(result.data))
    .digest("hex");

  result.response.headers.set("ETag", `"${etag}"`);

  return result;
});
```

### 3. Varie o Cache por Parâmetros de Query

Quando o conteúdo varia por parâmetros de query, inclua-os nas chaves de cache:

```tsx
export const Route = createFileRoute("/search")({
  headers: () => ({
    "Cache-Control": "public, max-age=300",
    Vary: "Accept, Accept-Encoding",
  }),
});
```

### 4. Monitore as Taxas de Cache Hit

Acompanhe a performance da CDN para otimizar os tempos de cache:

```tsx
const cacheMonitoringMiddleware = createMiddleware().server(
  async ({ next }) => {
    const result = await next();

    // Registra o status do cache (dos headers da CDN)
    console.log(
      "Cache Status:",
      result.response.headers.get("cf-cache-status"),
    );

    return result;
  },
);
```

### 5. Combine com Pré-renderização Estática

Pré-renderize no momento do build para carregamento instantâneo na primeira visita e depois use ISR para atualizações:

```tsx
// vite.config.ts
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tanstackStart({
      prerender: {
        routes: ["/blog", "/blog/posts/*"],
        crawlLinks: true,
      },
    }),
  ],
});
```

## Depurando ISR

### Verifique os Cache Headers

Use o DevTools do navegador ou curl para inspecionar os headers de cache:

```bash
curl -I https://yoursite.com/blog/my-post

# Procure por:
# Cache-Control: public, max-age=3600, stale-while-revalidate=86400
# Age: 1234 (tempo no cache)
# X-Cache: HIT (da CDN)
```

### Teste a Revalidação

Force cache misses para testar a regeneração:

```bash
# Cloudflare: Ignorar cache
curl -H "Cache-Control: no-cache" https://yoursite.com/page

# Ou use as APIs de purga de cache específicas da CDN
```

### Monitore a Performance

Acompanhe as métricas principais:

- **Taxa de Cache Hit**: Percentual de requisições servidas pelo cache
- **Tempo de Revalidação**: Tempo para regenerar conteúdo obsoleto
- **Time to First Byte (TTFB)**: Deve ser baixo para conteúdo em cache

## Recursos Relacionados

- [Pré-renderização Estática](./static-prerendering.md) - Geração de páginas no momento do build
- [Hospedagem](./hosting.md) - Configurações de deploy em CDN
- [Server Functions](./server-functions.md) - Criação de endpoints de dados dinâmicos
- [Carregamento de Dados](../../../../router/framework/react/guide/data-loading.md) - Controle de cache no lado do cliente
- [Middleware](./middleware.md) - Personalização de requisição/resposta
