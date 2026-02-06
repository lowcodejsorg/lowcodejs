---
id: start-vs-nextjs
title: TanStack Start vs Next.js
---

Escolher entre TanStack Start e Next.js não é apenas uma questão de funcionalidades - é sobre entender para o que cada framework é otimizado e como essas decisões se propagam por toda a sua experiência de desenvolvimento.

Esta página explica as diferenças fundamentais, aborda equívocos comuns e ajuda você a tomar uma decisão informada. Para uma matriz de funcionalidades, veja a [tabela comparativa completa](./comparison). Pronto para migrar? Veja o [guia de migração](./migrate-from-next-js).

**Uma nota sobre benchmarks:** Se alguém citar números de desempenho comparando Start e Next sem metodologia, complexidade da aplicação, detalhes de hospedagem e especificidades de configuração - esses números não significam nada. Comparações devem assumir boas práticas de ambos os lados. Você não pode dar ao Next o benefício de um uso otimizado enquanto assume que os usuários do Start configuram as coisas de forma errada.

## Duas Visões Diferentes de React

Ambos os frameworks querem ajudar você a construir ótimas aplicações React. Mas eles partem de premissas diferentes sobre o que "ótimo" significa.

### Next.js: A Aposta na Plataforma

Next.js é otimizado para **a visão da Vercel sobre a web**: renderização server-first, integração forte com a plataforma e otimizações automáticas que funcionam melhor na infraestrutura deles.

A aposta central: a maior parte do conteúdo web é estático ou quase estático. Server Components devem ser o padrão. Interatividade é a exceção na qual você opta. O framework deve tomar decisões por você, e essas decisões devem ser otimizadas para a infraestrutura deles.

Isso funciona bem se:

- Você está fazendo deploy na Vercel e quer integração forte com a plataforma
- Sua aplicação é rica em conteúdo com ilhas de interatividade
- Você quer que o framework tome decisões arquiteturais por você

### TanStack Start: A Aposta no Desenvolvedor

TanStack Start é otimizado para **controle e correção do desenvolvedor**: type safety em todos os lugares, explícito em vez de implícito, primitivas combináveis e liberdade de deploy.

A aposta central: desenvolvedores conhecem suas aplicações melhor do que os frameworks. Renderização no servidor é uma otimização na qual você opta quando faz sentido. O framework deve fornecer primitivas poderosas e sair do seu caminho.

Isso funciona bem se:

- Você quer que seu alvo de deploy seja uma decisão sua, não do framework
- Sua aplicação é altamente interativa
- Você valoriza type safety e controle explícito
- Você quer entender exatamente o que seu código está fazendo

## A Diferença de Modelo Mental

Esta é a diferença mais importante para se compreender. Todo o resto deriva dela.

### Ambos Fazem SSR - Padrões Diferentes para Interatividade

Vamos ser claros: ambos os frameworks fazem SSR por padrão, e ambos suportam geração estática e React Server Components. A diferença não é de capacidade - é de como você acessa essas capacidades e quanto controle você tem.

**Next.js** usa Server Components por padrão. Todo componente é um Server Component a menos que você adicione `"use client"`. Server Components não podem usar state, effects ou event handlers - então o caminho para a interatividade exige entender os limites implícitos do framework, as camadas de cache e as regras de serialização.

**TanStack Start** usa componentes interativos por padrão (React tradicional). Seus componentes passam por SSR e hydrate, prontos para state e event handlers desde o início. Você opta por Server Components onde eles agregam valor - para conteúdo estático pesado, manter segredos no servidor ou reduzir o tamanho do bundle.

Ambas as abordagens levam ao mesmo destino. A questão é: qual direção parece nadar contra a corrente para _a sua_ aplicação?

Considere:

- Se a maioria dos seus componentes precisa de state, effects ou event handlers, os padrões do Next significam anotações constantes de `"use client"` e pensar sobre limites de serialização
- Se a maior parte do seu conteúdo é estático, o Start permite que você opte explicitamente pela renderização exclusiva no servidor - com controle mais claro sobre cache e hydration
- De qualquer forma, o Start oferece controle mais granular sobre _como_ as coisas são renderizadas, não apenas _onde_

### Implícito vs Explícito

Ambos os frameworks lidam com o fundamental - code splitting, cache, SSR, otimização estática. A diferença é visibilidade e previsibilidade. **Next.js** empilha comportamentos implícitos: cache multi-camada no servidor com um histórico de breaking changes e frustração da comunidade, convenções de busca de dados atreladas à estrutura de arquivos, otimizações que exigem entender os internos do framework para serem sobrescritas.

**TanStack Start** é explícito sem ser verboso. Funções de loader, configuração de cache, cadeias de middleware - eles estão visíveis no seu código, não escondidos atrás de convenções. Isso não significa mais código; significa que o código que você escreve mapeia diretamente para o que acontece em runtime.

## Mergulho na Arquitetura

### O Pipeline de Build

**Next.js** usa um sistema de build customizado (historicamente Webpack, agora Turbopack). É fortemente integrado com a arquitetura deles, o que possibilita otimizações mas limita a flexibilidade. O Turbopack melhorou a velocidade de desenvolvimento, mas ainda não se compara ao Vite.

**TanStack Start** é construído sobre o Vite. Isso significa:

- Inicialização mais rápida do servidor de desenvolvimento
- HMR mais rápido
- Acesso a todo o ecossistema de plugins do Vite
- Ferramentas padrão que se transferem para outros projetos

### O Runtime

**Next.js** entrega um runtime substancial para suportar Server Components, cache no servidor, otimizações automáticas e as convenções do App Router. Esse runtime tem um peso real.

**TanStack Start** entrega um runtime mínimo. O router é poderoso mas enxuto. Server functions são wrappers RPC finos. Não há camada mágica do framework entre você e o React.

Tamanho de bundle não é tudo, mas é a base sobre a qual todo o resto é construído. A arquitetura do Start é projetada para minimizar o overhead de runtime - mesmo com suporte a RSC, o runtime permanece enxuto. Muito do peso do bundle do Next é custo arquitetural, não peso de funcionalidades.

### O Sistema de Tipos

**Next.js** tem suporte a TypeScript. **TanStack Start** é construído em torno do TypeScript.

A diferença importa:

- No Next.js, o limite entre client e server cria lacunas de tipagem. Server Actions podem receber dados que não correspondem ao que o TypeScript espera. Você precisa de validação em runtime para estar seguro.
- No Start, server functions têm type safety de ponta a ponta. Validação de input, tipos de retorno, contexto de middleware, parâmetros de rota - tudo verificado em tempo de compilação.

Na era do desenvolvimento assistido por IA, type safety de ponta a ponta deveria ser inegociável. Tipos não são apenas "legais para a DX" - são garantias de correção que previnem erros em produção.

## Roteamento

É aqui que o TanStack mais se destaca. O TanStack Router (que alimenta o Start) é o router mais poderoso e com melhor type safety em qualquer framework.

**Funcionalidades que o Next.js não tem:**

- **Search params com type safety** - Defina, valide e faça parse de search params com inferência de tipos completa. O Next dá `?foo=bar` como strings; o Start fornece objetos validados e tipados
- **Validação e middleware de search params** - Transforme e valide search params no nível da rota
- **Path params com type safety** - Path params são inferidos e validados, não apenas `string | string[]`
- **Contexto de rota com type safety** - Passe contexto tipado através de rotas aninhadas
- **Validação e parsing customizado de path params** - Faça parse de `/users/123` como número, valide se existe
- **Eventos de mount/transição/unmount de rota** - Conecte-se ao ciclo de vida da rota
- **Rotas baseadas em código** - Defina rotas em código quando rotas baseadas em arquivo não se encaixam
- **Devtools integrados** - Inspecione o estado do router, cache e navegações pendentes
- **Restauração de scroll de elementos** - Restaure a posição de scroll para elementos específicos, não apenas a página
- **Bloqueio de navegação** - `useBlocker` para avisos de alterações não salvas

**Type safety que realmente funciona:**

- Caminhos de rota são totalmente tipados - erros de digitação são erros de compilação
- Links validam seus destinos - sem links quebrados em produção
- Loaders conhecem o contexto da rota - sem adivinhar quais dados estão disponíveis
- Search params são tipados de ponta a ponta - da URL ao componente

O Next.js tem roteamento baseado em arquivo que funciona, mas o type safety é superficial (um plugin de IDE para sugestões de links) comparado às garantias em tempo de compilação do TanStack Router.

**Integrações de primeira classe:**

O TanStack Router foi projetado desde o início para isomorfismo e hydration. Isso o torna a base para integrações de primeira classe com o TanStack Query e outras bibliotecas de busca de dados. No Next, você conecta o Query manualmente; no Start, é um padrão suportado com integrações oficiais.

Veja a [comparação completa do router](/router/latest/docs/framework/react/comparison) para a matriz completa de funcionalidades.

## A Questão do Cache

Cache é onde as diferenças filosóficas se tornam mais visíveis.

### Next.js: Implícito e no Servidor

O Next.js faz cache agressivamente por padrão (ou fazia - eles mudaram isso várias vezes). O cache acontece em camadas:

- Memoização de requisições
- Cache de dados
- Cache de rota completa
- Cache do router

Cada camada tem sua própria semântica de invalidação. O sistema foi reescrito várias vezes com críticas da comunidade por ser imprevisível. O Next 15 simplificou os padrões, mas a complexidade fundamental do cache de streams RSC no servidor permanece.

Quando as pessoas falam sobre "cache de componentes", estão se referindo ao cache de streams RSC serializados no servidor. Isso é mais complicado do que a maioria percebe:

- Você está fazendo cache de streams de texto com semânticas complexas de invalidação
- Isso acontece em ambientes estilo lambda com suas próprias restrições
- Invalidação granular requer configuração explícita de tags
- Falhas de cache se propagam pela árvore de componentes de formas nem sempre previsíveis

**Pergunte a qualquer pessoa que afirma que cache de componentes no servidor é especial:** "Como você invalida um stream RSC em cache quando uma dependência de dados muda?" A maioria não consegue responder claramente.

### TanStack Start: RSCs São Apenas Dados

O Start trata a saída de Server Components da mesma forma que qualquer outro dado fluindo pela sua aplicação. Não existe um "cache de componentes" especial com sua própria semântica - payloads RSC são dados, e você faz cache de dados da forma que quiser:

- **TanStack Router** - Cache estilo SWR integrado com `staleTime` e `gcTime`
- **TanStack Query** - Gerenciamento completo de estado assíncrono
- **Cache via CDN** - Headers HTTP padrão de cache na edge
- **Redis, banco de dados, o que quiser** - São apenas dados; use sua infraestrutura existente

```tsx
export const Route = createFileRoute("/posts/$postId")({
  loader: async ({ params }) => fetchPost(params.postId),
  staleTime: 10_000, // Fresco por 10 segundos
  gcTime: 5 * 60_000, // Manter na memória por 5 minutos
});
```

Este é o mesmo padrão SWR que o TanStack Query já testou em batalha em milhões de aplicações. Nenhum modelo mental novo. Nenhuma semântica de cache específica de framework para aprender. Sem perseguir fantasmas.

As camadas de cache são bem compreendidas e se compõem naturalmente:

- Cache SWR no client (integrado ao router)
- Cache via CDN na edge (semânticas HTTP padrão)
- Cache no servidor onde você quiser (explícito, opt-in)

Você já sabe como fazer cache de dados. O Start não te obriga a aprender uma nova forma.

### O Resultado Final sobre RSCs

O Start tem suporte completo a RSC com paridade de funcionalidades em relação ao Next.js. A diferença é modelo mental e carga cognitiva.

No Next, RSCs são o paradigma - você constrói em torno deles, pensa neles constantemente, gerencia seus limites em todos os lugares. No Start, RSCs são apenas mais uma primitiva de dados. Busque-os, faça cache, componha-os - usando padrões que você já conhece do TanStack Query e Router.

Chamamos nossa abordagem de **Composite Components** - componentes React produzidos no servidor que o client pode buscar, fazer cache, fazer streaming e montar. O client controla a composição; o servidor entrega pedaços de UI. Nenhum modelo mental novo. Nenhuma semântica de cache específica de framework. Apenas dados fluindo através de ferramentas que você já entende.

Para o mergulho completo, veja [Composite Components: Server Components with Client-Led Composition](https://tanstack.com/blog/composite-components).

## Server Functions vs Server Actions

Ambos os frameworks permitem chamar código do servidor a partir do client. As abordagens diferem significativamente.

### Next.js Server Actions

```tsx
"use server";

export async function createPost(formData: FormData) {
  const title = formData.get("title");
  // Sem type safety em tempo de compilação nos inputs
  return db.posts.create({ title });
}
```

Server Actions integram com formulários e transitions. São convenientes para casos simples, mas oferecem type safety limitado no limite client/server.

### TanStack Server Functions

```tsx
export const createPost = createServerFn({ method: "POST" })
  .validator(z.object({ title: z.string().min(1) }))
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    // data é tipado e validado
    // context vem do middleware, também tipado
    return db.posts.create({ title: data.title });
  });
```

Server functions oferecem:

- **Validação de input** - Defina schemas, obtenha validação em runtime e tipos em tempo de compilação
- **Middleware** - Combinável, funciona tanto no client quanto no server
- **Inferência de tipos completa** - Do input ao output ao tratamento de erros
- **RPC explícito** - Modelo mental claro do que está acontecendo

**Nota de segurança:** A arquitetura do Start não faz parse de dados Flight no servidor - payloads fluem em uma direção (servidor para client). Avisos recentes de segurança do React sobre vulnerabilidades de serialização RSC não se aplicam ao modelo do Start.

## Onde o Next.js Tem Vantagem

O Next.js existe há mais tempo. Isso não é uma vantagem técnica, mas cria efeitos reais no ecossistema:

**Mais conteúdo** - Mais tutoriais, mais respostas no Stack Overflow, mais posts em blogs, mais repositórios de exemplo. Quando você pesquisa um problema no Google, é mais provável encontrar uma resposta específica para Next.

**Mindshare** - Next é a recomendação padrão em muitos círculos. Isso significa que mais desenvolvedores o usaram, o que significa mais conteúdo, o que reforça o ciclo.

**Integração com a Vercel** - Next.js é feito pela Vercel, então novas funcionalidades da plataforma Vercel frequentemente são lançadas com suporte ao Next.js primeiro. Dito isso, o Start funciona muito bem na Vercel também - você não está abrindo mão de preview deployments ou edge functions ao escolher o Start. Você apenas não está preso à Vercel como única opção de primeira classe.

**Otimização integrada de imagens/fontes** - O Start suporta otimização de imagens via soluções plugáveis (como [Unpic](https://unpic.pics/)), mas não é integrado. Se "integrado" é melhor que "plugável" depende de você querer que o framework faça essa escolha por você.

Nada disso é superioridade técnica - são vantagens de ecossistema e modelo de negócio. Nos méritos técnicos, estamos confiantes na abordagem do Start.

## O Que o Start Faz Melhor

Com suporte a RSC, a questão não é "o que falta ao Start?" - é: **"Por que abrir mão do router, type safety, design de cache e modelo mental mais simples do Start pela API do Next?"**

**Type safety** - De ponta a ponta, não adicionado depois. Isso previne bugs e permite refatorações com confiança.

**Roteamento** - O router mais poderoso e com melhor type safety em qualquer framework. Search params, path params, loaders, middleware - todos totalmente tipados.

**Modelo de cache** - Primitivas SWR explícitas que você já entende se usou o TanStack Query. Sem camadas implícitas para depurar.

**Experiência de desenvolvimento** - A velocidade do Vite é real. Inicialização instantânea, HMR rápido, menor uso de recursos. Isso se acumula ao longo de um dia de trabalho - e ainda mais quando agentes de IA estão iterando no seu código em ciclos rápidos.

**Deploy como funcionalidade** - O Start trata a flexibilidade de deploy como uma funcionalidade de primeira classe. Cloudflare, Netlify, AWS, Fly, Railway, seus próprios servidores - todos são igualmente suportados. Sua aplicação funciona da mesma forma em todos os lugares porque é construída sobre padrões, não otimizações específicas de plataforma. Isso significa que você pode:

- Escolher hospedagem com base em preço, desempenho ou proximidade dos seus usuários
- Trocar de provedor sem reescrever a lógica de deploy
- Executar o mesmo código em desenvolvimento, staging e produção em plataformas diferentes
- Evitar acumular padrões específicos de plataforma que criam atrito depois

**Middleware** - Middleware combinável que funciona tanto no nível de requisição QUANTO no nível de server function, tanto no client quanto no server.

**Depuração** - Execução previsível. Quando algo quebra, você consegue rastrear. Sem camadas de abstração escondendo comportamento.

## Resumo

| Aspecto                | TanStack Start                           | Next.js                                     |
| ---------------------- | ---------------------------------------- | ------------------------------------------- |
| **Filosofia**          | Controle do desenvolvedor, padrões explícitos | Integração com plataforma, convenções    |
| **Componentes**        | Interativos por padrão, opt-in para RSC  | Server Components por padrão                |
| **Type safety**        | De ponta a ponta, tempo de compilação    | Suporte a TypeScript com lacunas nos limites |
| **Server functions**   | Tipadas, validadas, suporte a middleware | Limite sem tipagem, sem middleware          |
| **Cache**              | Primitivas SWR explícitas                | Cache implícito multi-camada                |
| **Ferramenta de build**| Vite                                     | Turbopack/Webpack                           |
| **Deploy**             | Suporte igual em todos os lugares        | Otimizado para Vercel                       |
| **Roteamento**         | Type safety de primeira classe           | Baseado em arquivo, tipos básicos           |
| **RSC**                | Suportado                                | Suportado                                   |
| **Maturidade**         | 2+ anos, próximo do 1.0                  | 8+ anos, APIs historicamente instáveis      |

---

> **Pronto para experimentar o Start?** Veja o [guia de Primeiros Passos](./getting-started) ou [migre do Next.js](./migrate-from-next-js).
