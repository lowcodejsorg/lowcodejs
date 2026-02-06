---
id: rendering-markdown
title: Renderizando Markdown
---

Este guia aborda dois métodos para importar e renderizar conteúdo markdown em sua aplicação TanStack Start:

1. **Markdown estático** com `content-collections` para carregamento em tempo de build (ex.: posts de blog)
2. **Markdown dinâmico** buscado em runtime a partir do GitHub ou qualquer fonte remota

Ambos os métodos compartilham um pipeline de renderização comum usando o ecossistema `unified`.

## Configurando o Processador de Markdown

Ambas as abordagens usam o mesmo pipeline de processamento de markdown para HTML. Primeiro, instale as dependências necessárias:

```bash
npm install unified remark-parse remark-gfm remark-rehype rehype-raw rehype-slug rehype-autolink-headings rehype-stringify shiki html-react-parser gray-matter
```

Crie um utilitário para processar markdown:

```tsx
// src/utils/markdown.ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeStringify from "rehype-stringify";

export type MarkdownHeading = {
  id: string;
  text: string;
  level: number;
};

export type MarkdownResult = {
  markup: string;
  headings: Array<MarkdownHeading>;
};

export async function renderMarkdown(content: string): Promise<MarkdownResult> {
  const headings: Array<MarkdownHeading> = [];

  const result = await unified()
    .use(remarkParse) // Faz o parse do markdown
    .use(remarkGfm) // Suporte a GitHub Flavored Markdown
    .use(remarkRehype, { allowDangerousHtml: true }) // Converte para AST HTML
    .use(rehypeRaw) // Processa HTML bruto no markdown
    .use(rehypeSlug) // Adiciona IDs aos headings
    .use(rehypeAutolinkHeadings, {
      behavior: "wrap",
      properties: { className: ["anchor"] },
    })
    .use(() => (tree) => {
      // Extrai headings para o sumário
      const { visit } = require("unist-util-visit");
      const { toString } = require("hast-util-to-string");

      visit(tree, "element", (node: any) => {
        if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(node.tagName)) {
          headings.push({
            id: node.properties?.id || "",
            text: toString(node),
            level: parseInt(node.tagName.charAt(1), 10),
          });
        }
      });
    })
    .use(rehypeStringify) // Serializa para string HTML
    .process(content);

  return {
    markup: String(result),
    headings,
  };
}
```

## Criando um Componente de Markdown

Crie um componente React que renderiza o HTML processado com tratamento personalizado de elementos:

```tsx
// src/components/Markdown.tsx
import parse, { type HTMLReactParserOptions, Element } from "html-react-parser";
import { renderMarkdown, type MarkdownResult } from "~/utils/markdown";

type MarkdownProps = {
  content: string;
  className?: string;
};

export function Markdown({ content, className }: MarkdownProps) {
  const [result, setResult] = useState<MarkdownResult | null>(null);

  useEffect(() => {
    renderMarkdown(content).then(setResult);
  }, [content]);

  if (!result) {
    return <div className={className}>Loading...</div>;
  }

  const options: HTMLReactParserOptions = {
    replace: (domNode) => {
      if (domNode instanceof Element) {
        // Personaliza a renderização de elementos específicos
        if (domNode.name === "a") {
          // Trata links
          const href = domNode.attribs.href;
          if (href?.startsWith("/")) {
            // Link interno - usa o componente Link do seu roteador
            return (
              <Link to={href}>{domToReact(domNode.children, options)}</Link>
            );
          }
        }

        if (domNode.name === "img") {
          // Adiciona carregamento lazy às imagens
          return (
            <img
              {...domNode.attribs}
              loading="lazy"
              className="rounded-lg shadow-md"
            />
          );
        }
      }
    },
  };

  return <div className={className}>{parse(result.markup, options)}</div>;
}
```

## Método 1: Markdown Estático com content-collections

O pacote `content-collections` é ideal para conteúdo estático como posts de blog que estão incluídos no seu repositório. Ele processa arquivos markdown em tempo de build e fornece acesso type-safe ao conteúdo.

### Instalação

```bash
npm install @content-collections/core @content-collections/vite
```

### Configuração

Crie um arquivo `content-collections.ts` na raiz do seu projeto:

```tsx
// content-collections.ts
import { defineCollection, defineConfig } from "@content-collections/core";
import matter from "gray-matter";

function extractFrontMatter(content: string) {
  const { data, content: body, excerpt } = matter(content, { excerpt: true });
  return { data, body, excerpt: excerpt || "" };
}

const posts = defineCollection({
  name: "posts",
  directory: "./src/blog", // Diretório contendo seus arquivos .md
  include: "*.md",
  schema: (z) => ({
    title: z.string(),
    published: z.string().date(),
    description: z.string().optional(),
    authors: z.string().array(),
  }),
  transform: ({ content, ...post }) => {
    const frontMatter = extractFrontMatter(content);

    // Extrai a imagem de cabeçalho (primeira imagem no documento)
    const headerImageMatch = content.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    const headerImage = headerImageMatch ? headerImageMatch[2] : undefined;

    return {
      ...post,
      slug: post._meta.path,
      excerpt: frontMatter.excerpt,
      description: frontMatter.data.description,
      headerImage,
      content: frontMatter.body,
    };
  },
});

export default defineConfig({
  collections: [posts],
});
```

### Integração com Vite

Adicione o plugin do content-collections à sua configuração do Vite:

```tsx
// app.config.ts
import { defineConfig } from "@tanstack/react-start/config";
import contentCollections from "@content-collections/vite";

export default defineConfig({
  vite: {
    plugins: [contentCollections()],
  },
});
```

### Criando Posts de Blog

Crie arquivos markdown no diretório designado:

````markdown
## <!-- src/blog/hello-world.md -->

title: Hello World
published: 2024-01-15
authors:

- Jane Doe
  description: My first blog post

---

![Hero Image](/images/hero.jpg)

Welcome to my blog! This is my first post.

## Getting Started

Here's some content with **bold** and _italic_ text.

```javascript
console.log("Hello, world!");
```
````

### Usando a Coleção

Acesse seus posts através da coleção gerada:

```tsx
// src/routes/blog.index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { allPosts } from "content-collections";

export const Route = createFileRoute("/blog/")({
  component: BlogIndex,
});

function BlogIndex() {
  // Posts ordenados por data de publicação
  const sortedPosts = allPosts.sort(
    (a, b) => new Date(b.published).getTime() - new Date(a.published).getTime(),
  );

  return (
    <div>
      <h1>Blog</h1>
      <ul>
        {sortedPosts.map((post) => (
          <li key={post.slug}>
            <Link to="/blog/$slug" params={{ slug: post.slug }}>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
              <span>{post.published}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Renderizando um Post Individual

```tsx
// src/routes/blog.$slug.tsx
import { createFileRoute, notFound } from "@tanstack/react-router";
import { allPosts } from "content-collections";
import { Markdown } from "~/components/Markdown";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = allPosts.find((p) => p.slug === params.slug);
    if (!post) {
      throw notFound();
    }
    return post;
  },
  component: BlogPost,
});

function BlogPost() {
  const post = Route.useLoaderData();

  return (
    <article>
      <header>
        <h1>{post.title}</h1>
        <p>
          By {post.authors.join(", ")} on {post.published}
        </p>
      </header>
      <Markdown content={post.content} className="prose" />
    </article>
  );
}
```

## Método 2: Markdown Dinâmico de Fontes Remotas

Para conteúdo armazenado externamente (como repositórios do GitHub), você pode buscar e renderizar markdown dinamicamente usando server functions.

### Criando um Utilitário de Busca

```tsx
// src/utils/docs.server.ts
import { createServerFn } from "@tanstack/react-start";
import matter from "gray-matter";

type FetchDocsParams = {
  repo: string; // ex.: 'tanstack/router'
  branch: string; // ex.: 'main'
  filePath: string; // ex.: 'docs/guide/getting-started.md'
};

export const fetchDocs = createServerFn({ method: "GET" })
  .inputValidator((params: FetchDocsParams) => params)
  .handler(async ({ data: { repo, branch, filePath } }) => {
    const url = `https://raw.githubusercontent.com/${repo}/${branch}/${filePath}`;

    const response = await fetch(url, {
      headers: {
        // Adicione o token do GitHub para repositórios privados ou limites de taxa maiores
        // Authorization: `token ${process.env.GITHUB_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const rawContent = await response.text();
    const { data: frontmatter, content } = matter(rawContent);

    return {
      frontmatter,
      content,
      filePath,
    };
  });
```

### Adicionando Headers de Cache

Para produção, adicione headers de cache apropriados:

```tsx
export const fetchDocs = createServerFn({ method: "GET" })
  .inputValidator((params: FetchDocsParams) => params)
  .handler(async ({ data: { repo, branch, filePath }, context }) => {
    // Define headers de cache para cache em CDN
    context.response.headers.set(
      "Cache-Control",
      "public, max-age=0, must-revalidate",
    );
    context.response.headers.set(
      "CDN-Cache-Control",
      "max-age=300, stale-while-revalidate=300",
    );

    // ... lógica de busca
  });
```

### Usando Markdown Dinâmico em Rotas

```tsx
// src/routes/docs.$path.tsx
import { createFileRoute } from "@tanstack/react-router";
import { fetchDocs } from "~/utils/docs.server";
import { Markdown } from "~/components/Markdown";

export const Route = createFileRoute("/docs/$path")({
  loader: async ({ params }) => {
    return fetchDocs({
      data: {
        repo: "your-org/your-repo",
        branch: "main",
        filePath: `docs/${params.path}.md`,
      },
    });
  },
  component: DocsPage,
});

function DocsPage() {
  const { frontmatter, content } = Route.useLoaderData();

  return (
    <article>
      <h1>{frontmatter.title}</h1>
      <Markdown content={content} className="prose" />
    </article>
  );
}
```

### Buscando Conteúdo de Diretórios

Para construir a navegação a partir de um diretório do GitHub:

```tsx
// src/utils/docs.server.ts
type GitHubContent = {
  name: string;
  path: string;
  type: "file" | "dir";
};

export const fetchRepoContents = createServerFn({ method: "GET" })
  .inputValidator(
    (params: { repo: string; branch: string; path: string }) => params,
  )
  .handler(async ({ data: { repo, branch, path } }) => {
    const url = `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        // Authorization: `token ${process.env.GITHUB_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch contents: ${response.status}`);
    }

    const contents: Array<GitHubContent> = await response.json();

    return contents
      .filter((item) => item.type === "file" && item.name.endsWith(".md"))
      .map((item) => ({
        name: item.name.replace(".md", ""),
        path: item.path,
      }));
  });
```

## Adicionando Destaque de Sintaxe com Shiki

Para blocos de código com destaque de sintaxe, integre o Shiki ao seu processador de markdown:

```tsx
// src/utils/markdown.ts
import { codeToHtml } from "shiki";

// Processa blocos de código após o parsing
export async function highlightCode(
  code: string,
  language: string,
): Promise<string> {
  return codeToHtml(code, {
    lang: language,
    themes: {
      light: "github-light",
      dark: "tokyo-night",
    },
  });
}
```

Em seguida, trate os blocos de código no seu componente Markdown:

```tsx
// Na função replace do seu componente Markdown
if (domNode.name === "pre") {
  const codeElement = domNode.children.find(
    (child) => child instanceof Element && child.name === "code",
  );
  if (codeElement) {
    const className = codeElement.attribs.class || "";
    const language = className.replace("language-", "") || "text";
    const code = getText(codeElement);

    return <CodeBlock code={code} language={language} />;
  }
}
```

## Resumo

| Abordagem           | Melhor Para                                        | Vantagens                                                   | Desvantagens                                     |
| ------------------- | -------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------ |
| content-collections | Posts de blog, documentação estática junto ao app   | Type-safe, processamento em tempo de build, rápido em runtime | Requer rebuild para atualizar conteúdo           |
| Busca dinâmica      | Documentação externa, conteúdo atualizado com frequência | Sempre atualizado, sem necessidade de rebuild               | Overhead em runtime, requer tratamento de erros  |

Escolha a abordagem que melhor se adequa à frequência de atualização do seu conteúdo e ao seu fluxo de deploy. Para cenários híbridos, você pode usar ambos os métodos na mesma aplicação.
