---
title: Comparação | TanStack Start vs Next.js vs React Router
toc: false
---

Escolhendo um framework React full-stack? Esta comparação foca nos **recursos de framework full-stack** que distinguem o TanStack Start do Next.js e do React Router (v7 Framework Mode).

> **🚨 IMPORTANTE: Procurando recursos de roteamento?**
>
> O TanStack Start é construído sobre o **TanStack Router**, que oferece capacidades de roteamento type-safe líderes da indústria. Para uma comparação abrangente dos recursos de roteamento (rotas aninhadas, search params, type safety, loaders, etc.), consulte:
>
> ### [📖 Comparação do TanStack Router vs React Router / Next.js →](/router/latest/docs/framework/react/comparison)
>
> Essa comparação cobre todos os recursos de roteamento em detalhes. Esta página foca especificamente nas **capacidades de framework full-stack** como SSR, server functions, middleware, deployment e mais.

Embora nosso objetivo seja fornecer uma comparação precisa e justa, observe que esta tabela pode não capturar todas as nuances ou atualizações recentes de cada framework. Recomendamos revisar a documentação oficial e experimentar cada solução para tomar a decisão mais informada para o seu caso de uso específico.

Se você encontrar discrepâncias ou tiver sugestões de melhoria, não hesite em contribuir através do link "Edit this page on GitHub" no final desta página ou abrir uma issue no [repositório GitHub do TanStack Router](https://github.com/TanStack/router).

Legenda de Recursos/Capacidades:

- ✅ Primeira classe, integrado e pronto para uso sem configuração ou código adicional
- 🟡 Suporte Parcial (avaliado de 1-5 quando indicado)
- 🟠 Suportado via addon/pacote da comunidade
- 🔶 Possível, mas requer código/implementação/casting personalizado
- 🛑 Não suportado oficialmente

|                                                                   | TanStack Start                                   | Next.js [_(Website)_][nextjs]                 | React Router [_(Website)_][react-router]   |
| ----------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------- | ------------------------------------------ |
| Repositório Github / Stars                                        | [![][stars-tanstack-router]][gh-tanstack-router] | [![][stars-nextjs]][gh-nextjs]                | [![][stars-react-router]][gh-react-router] |
| Tamanho do Bundle                                                 | [![][bp-tanstack-router]][bpl-tanstack-router]   | ❓                                            | ❓                                         |
| --                                                                | --                                               | --                                            | --                                         |
| **Recursos de Roteamento** [_(Ver Comparação Completa)_][router-comparison] | ✅ Construído sobre o TanStack Router            | ✅ App Router baseado em arquivos             | ✅ Rotas Aninhadas baseadas em arquivos    |
| --                                                                | --                                               | --                                            | --                                         |
| **Recursos Full-Stack**                                           | --                                               | --                                            | --                                         |
| SSR                                                               | ✅                                               | ✅                                            | ✅                                         |
| Streaming SSR                                                     | ✅                                               | ✅                                            | ✅                                         |
| SSR Seletivo (por rota)                                           | ✅                                               | 🔶                                            | 🔶                                         |
| Modo SPA                                                          | ✅                                               | 🔶 (via "use client")                         | ✅                                         |
| Cache SWR Client-Side Integrado                                   | ✅ (via TanStack Router)                         | 🔶 (apenas cache de fetch)                    | 🛑                                         |
| Integração com Bibliotecas de Busca de Dados                      | ✅ (TanStack Query oficial, Apollo, etc.)        | 🔶 (integração manual)                        | 🔶 (integração manual)                     |
| Pré-renderização Estática (SSG)                                   | ✅                                               | ✅                                            | ✅                                         |
| Regeneração Estática Incremental (ISR)                            | ✅ (via headers Cache-Control)                   | ✅ (Proprietário)                             | ✅ (via headers Cache-Control)             |
| React Server Components                                           | 🛑 (Em desenvolvimento ativo)                    | ✅                                            | 🟡 (Experimental)                          |
| Server Functions                                                  | ✅ (Baseado em RPC)                              | ✅ (Server Actions)                           | ✅ (Actions)                               |
| Middleware Client de Server Function                               | ✅                                               | 🛑                                            | 🛑                                         |
| Middleware Server de Server Function                               | ✅                                               | 🛑                                            | ✅                                         |
| Middleware de Requisição (Todas as Rotas)                          | ✅                                               | ✅                                            | ✅                                         |
| Validação de Input de Server Function                              | ✅                                               | 🔶 (manual)                                   | 🔶 (manual)                                |
| Rotas de API / Rotas de Servidor / Resource Routes                 | ✅                                               | ✅                                            | ✅                                         |
| API `<Form>`                                                      | 🛑                                               | 🟠 (via React 19 useActionState)              | ✅                                         |
| --                                                                | --                                               | --                                            | --                                         |
| **Experiência do Desenvolvedor**                                  | --                                               | --                                            | --                                         |
| Devtools                                                          | ✅                                               | 🛑                                            | 🟠 (terceiros)                             |
| Ferramentas CLI                                                   | ✅                                               | ✅                                            | ✅                                         |
| Velocidade de Inicialização do Dev Server                         | ✅ (Rápido)                                      | 🛑 (Lento)                                    | ✅ (Rápido)                                |
| Velocidade de HMR                                                 | ✅ (Rápido, Vite)                                | 🛑 (Lento, Webpack/Turbopack)                 | ✅ (Rápido, Vite)                          |
| Velocidade de Navegação em Dev                                    | ✅                                               | 🟡                                            | ✅                                         |
| Uso de Recursos em Dev (CPU/RAM)                                  | ✅ (Leve)                                        | 🛑 (Pesado)                                   | ✅ (Leve)                                  |
| Suporte a TypeScript                                              | ✅                                               | ✅                                            | ✅                                         |
| Arquitetura Type-First                                            | ✅                                               | 🛑                                            | 🛑                                         |
| --                                                                | --                                               | --                                            | --                                         |
| **Deployment e Hospedagem**                                       | --                                               | --                                            | --                                         |
| Flexibilidade de Deployment                                       | ✅ (Qualquer host compatível com Vite)           | 🟡 (Otimizado para Vercel, possível em outros)| ✅ (Múltiplos adapters)                    |
| Suporte a Edge Runtime                                            | ✅                                               | ✅                                            | ✅                                         |
| Suporte Serverless                                                | ✅                                               | ✅                                            | ✅                                         |
| Suporte a Node.js                                                 | ✅                                               | ✅                                            | ✅                                         |
| Suporte a Docker                                                  | ✅                                               | ✅                                            | ✅                                         |
| Exportação Estática                                               | ✅                                               | ✅                                            | ✅                                         |
| Suporte Oficial a Cloudflare                                      | ✅                                               | 🟡                                            | ✅                                         |
| Suporte Oficial a Netlify                                         | ✅                                               | 🟡                                            | ✅                                         |
| Suporte Oficial a Vercel                                          | ✅ (via Nitro)                                   | ✅                                            | ✅                                         |

---

> **⚠️ Lembre-se:** Para comparações detalhadas dos **recursos de roteamento** (type safety, search params, loaders, navegação, etc.), veja a [**Comparação do TanStack Router**][router-comparison]. Esta página foca nas capacidades de framework full-stack.

---

## Principais Diferenças Filosóficas

### TanStack Start

**Filosofia**: Máxima liberdade para o desenvolvedor com type safety da melhor categoria.

- **Router-First**: Construído sobre o TanStack Router (veja a [comparação completa de roteamento][router-comparison])
- **Agnóstico de Deployment**: Construído sobre Vite, faça deploy em qualquer lugar sem lock-in de fornecedor
- **Middleware Composável**: O sistema de middleware funciona tanto no nível de requisição QUANTO no nível de server function individual (tanto client quanto server)
- **SSR Seletivo**: Controle granular sobre o comportamento de SSR por rota (SSR completo, apenas dados, ou apenas client)
- **Controle do Desenvolvedor**: Padrões explícitos e composáveis em vez de "mágica" baseada em convenção
- **Type Safety em Primeiro Lugar**: Segurança em tempo de compilação de ponta a ponta para server functions, loaders e roteamento

### Next.js

**Filosofia**: Pronto para produção com defaults otimizados, melhor com Vercel.

- **RSC-First**: Integração profunda com React Server Components como paradigma principal
- **Otimizado para Vercel**: Melhor performance e DX na infraestrutura da Vercel
- **Convenção sobre Configuração**: Estrutura opinativa com convenções de roteamento baseadas no sistema de arquivos
- **Otimizações Automáticas**: Muitas otimizações de performance acontecem automaticamente
- **Grau de Produção**: Testado em batalha em larga escala

### React Router (v7 Framework Mode)

**Filosofia**: Fundamentos web com progressive enhancement.

- **Padrões Web**: Abraça as primitivas da plataforma web (fetch, FormData, Headers)
- **Progressive Enhancement**: Funciona sem JavaScript por padrão
- **Rotas Aninhadas**: Suporte de primeira classe para roteamento aninhado e carregamento de dados
- **Baseado em Actions**: Envios de formulário via actions seguem padrões web
- **Evolução de Framework**: Sucessor do Remix, com arquitetura baseada em Vite

## Quando Escolher Cada Framework

### Escolha o TanStack Start se você:

- Quer a melhor type safety absoluta para roteamento (veja a [Comparação do Router][router-comparison])
- Precisa de flexibilidade de deployment sem lock-in de fornecedor (funciona com qualquer host compatível com Vite)
- Prefere padrões composáveis e explícitos em vez de convenção
- Quer controle granular sobre o comportamento de SSR (SSR seletivo por rota)
- Precisa de middleware composável que funcione tanto no nível de requisição quanto no nível de server function
- Está construindo uma aplicação complexa que se beneficia dos recursos avançados do TanStack Router
- Já usa o TanStack Query ou outras bibliotecas TanStack

### Escolha o Next.js se você:

- Quer usar React Server Components hoje com suporte completo do ecossistema
- Está fazendo deploy na Vercel ou quer uma experiência otimizada para Vercel
- Prefere convenção sobre configuração para um desenvolvimento inicial mais rápido
- Quer otimização automática de imagens e carregamento de fontes

### Escolha o React Router se você:

- Prioriza progressive enhancement
- Quer que sua aplicação funcione sem JavaScript
- Prefere mutações baseadas em actions seguindo convenções web

## Análises Detalhadas dos Recursos

### Cache Client-Side Integrado

O **TanStack Start** inclui um poderoso cache SWR (stale-while-revalidate) integrado através do TanStack Router:

- **Performance pronta para uso** - Dados do loader são automaticamente cacheados e revalidados
- **Controle granular** - Configure `staleTime`, `gcTime` e revalidação por rota
- **Compartilhamento estrutural** - Atualizações eficientes que re-renderizam apenas o que mudou
- **Integrações oficiais** - Suporte pronto para TanStack Query, Apollo e outras bibliotecas de busca de dados
- **Mais performático** - Otimizado para a experiência do usuário com navegação instantânea e atualizações em background

```tsx
export const Route = createFileRoute("/posts/$postId")({
  loader: async ({ params }) => fetchPost(params.postId),
  staleTime: 10_000, // Considerado fresco por 10 segundos
  gcTime: 5 * 60_000, // Mantido em memória por 5 minutos
});
```

Para cenários avançados, o TanStack Start integra-se perfeitamente com o TanStack Query:

```tsx
import { queryOptions } from "@tanstack/react-query";

const postQueryOptions = (postId: string) =>
  queryOptions({
    queryKey: ["post", postId],
    queryFn: () => fetchPost(postId),
  });

export const Route = createFileRoute("/posts/$postId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(postQueryOptions(params.postId)),
});

function Post() {
  const { postId } = Route.useParams();
  const { data } = useQuery(postQueryOptions(postId));
  // Usa automaticamente os dados cacheados do loader
}
```

O **Next.js** tem cache de fetch básico, mas não possui controle granular e requer integração manual com bibliotecas como React Query.

O **React Router** não possui cache client-side integrado - você precisa integrar manualmente uma solução de cache.

### Server Functions vs Server Actions

**Server Functions do TanStack Start**:

```tsx
export const getTodos = createServerFn({ method: "GET" })
  .inputValidator(zodValidator(z.object({ userId: z.string() })))
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    // data e context totalmente tipados
    return db.todos.findMany({ where: { userId: data.userId } });
  });

// Chame de qualquer lugar com type safety completo
const todos = await getTodos({ data: { userId: "123" } });
```

**Server Actions do Next.js**:

```tsx
"use server";
export async function getTodos(userId: string) {
  // Executa no servidor, chamado pelo client
  return db.todos.findMany({ where: { userId } });
}

// Chame a partir de um componente client
const todos = await getTodos("123");
```

Principais diferenças:

- As server functions do Start suportam middleware tanto no client quanto no server
- O Start possui validação de input integrada
- A abordagem do Start é mais explícita sobre a fronteira client/server
- Os Server Actions do Next.js integram-se mais naturalmente com formulários

### Arquitetura de Middleware

O **TanStack Start** possui dois tipos de middleware:

1. **Middleware de Requisição**: Executa para todas as requisições (SSR, rotas de API, server functions)
2. **Middleware de Server Function**: Executa especificamente para server functions, suporta execução tanto no client-side quanto no server-side

Essa composabilidade permite:

```tsx
const authMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    // Executa verificações de autenticação no client
    return next({
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  })
  .server(async ({ next }) => {
    // Valida autenticação no servidor
    return next({ context: { user: await getUser() } });
  });
```

O **Next.js** possui um único arquivo middleware.ts que executa no Edge Runtime para todas as requisições. Ele não pode acessar recursos exclusivos do servidor como bancos de dados e tem limitações em comparação com o runtime Node.js.

### Flexibilidade de Deployment

O **TanStack Start** aproveita o ecossistema do Vite:

- Faça deploy no Cloudflare Workers, Netlify, Vercel, Railway, Fly.io, AWS, etc.
- Use Nitro para suporte universal de deployment
- Sem recursos específicos de fornecedor ou lock-in
- O mesmo código funciona em qualquer lugar

O **Next.js** é otimizado para a Vercel:

- Muitos recursos funcionam melhor ou apenas na Vercel (ISR, Otimização de Imagem, Middleware)
- Self-hosting requer mais configuração
- O deployment em outras plataformas pode ter limitações

## React Server Components (RSC)

**Status Atual**:

- **Next.js**: Suporte completo em produção com ecossistema extenso
- **TanStack Start**: Em desenvolvimento ativo, esperado em breve
- **React Router**: Suporte experimental disponível

RSC ainda está evoluindo, e o TanStack Start está dedicando tempo para garantir a melhor implementação possível, alinhada com sua filosofia de type-safety em primeiro lugar.

## Considerações de Performance

### Performance em Produção

Todos os três frameworks são capazes de alcançar excelente performance em produção e pontuações máximas no Lighthouse. As diferenças se resumem às estratégias de otimização:

- **TanStack Start**: Builds otimizados do Vite, cache SWR reduz a carga do servidor, runtime leve
- **Next.js**: Code splitting automático, otimização de imagens e recursos de performance integrados
- **React Router**: Cache e otimização baseados em padrões web

### Performance em Desenvolvimento

É aqui que os frameworks diferem significativamente:

**TanStack Start e React Router:**

- ⚡ **Inicialização instantânea do dev server** - O Vite inicia em milissegundos
- ⚡ **HMR ultrarrápido** - Mudanças são refletidas instantaneamente sem recarregar a página
- ⚡ **Navegação rápida em dev** - Roteamento em velocidade máxima durante o desenvolvimento
- ⚡ **Uso leve de recursos** - Consumo mínimo de CPU e RAM
- ⚡ **Alta vazão em dev** - Lida com muitas requisições concorrentes de forma eficiente

**Next.js:**

- 🐌 **Inicialização lenta do dev server** - Pode levar muitos segundos para iniciar, especialmente em projetos maiores
- 🐌 **HMR lento** - Hot reloading é visivelmente lento mesmo com Turbopack
- 🐌 **Navegação limitada em dev** - A navegação é artificialmente desacelerada durante o desenvolvimento
- 🐌 **Uso pesado de recursos** - Consumo significativo de CPU e RAM durante o desenvolvimento

**Por Que Isso Importa:**

A performance em desenvolvimento impacta diretamente a produtividade do desenvolvedor. Ciclos de feedback mais rápidos significam:

- Mais iterações por hora
- Melhor estado de fluxo e foco
- Requisitos menores de máquina
- Menos frustração durante o desenvolvimento
- Pipelines de CI/CD mais rápidos para builds de desenvolvimento

Embora a performance de produção do Next.js seja excelente, a experiência de desenvolvimento pode ser notavelmente mais lenta, especialmente em codebases maiores ou máquinas menos potentes.

## Comunidade e Ecossistema

- **Next.js**: Maior comunidade, mais integrações de terceiros, recursos de aprendizado extensos
- **React Router**: Uma das bibliotecas React mais antigas e amplamente usadas, comunidade forte, documentação excelente
- **TanStack Start**: Comunidade em crescimento, parte do ecossistema TanStack, excelente suporte via Discord

## Maturidade

- **Next.js**: Pronto para produção, usado por milhares de empresas, comprovado em escala
- **React Router**: Pronto para produção, alimenta milhões de aplicações, v7 Framework Mode é a evolução do Remix
- **TanStack Start**: Estágio de Release Candidate, feature-complete, estabilizando rapidamente rumo à v1

[bp-tanstack-router]: https://badgen.net/bundlephobia/minzip/@tanstack/react-router
[bpl-tanstack-router]: https://bundlephobia.com/result?p=@tanstack/react-router
[gh-tanstack-router]: https://github.com/tanstack/router
[stars-tanstack-router]: https://img.shields.io/github/stars/tanstack/router?label=%F0%9F%8C%9F
[router-comparison]: /router/latest/docs/framework/react/comparison
[_]: _
[nextjs]: https://nextjs.org/
[gh-nextjs]: https://github.com/vercel/next.js
[stars-nextjs]: https://img.shields.io/github/stars/vercel/next.js?label=%F0%9F%8C%9F
[_]: _
[react-router]: https://reactrouter.com/
[gh-react-router]: https://github.com/remix-run/react-router
[stars-react-router]: https://img.shields.io/github/stars/remix-run/react-router?label=%F0%9F%8C%9F
