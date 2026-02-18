# Skill: Rota Publica de Navegacao

A rota publica e o padrao para paginas de browsing acessiveis sem autenticacao. Diferente das rotas privadas (sidebar + header), as rotas publicas usam layout Navbar + Footer. Vivem sob `routes/_public/`, suportam parametros dinamicos via `$paramName`, usam `useInfiniteQuery` ou `useQuery` para dados paginados e layouts baseados em cards. O layout publico e definido em `_public/layout.tsx` e garante Navbar sticky no topo e Footer no final.

---

## Estrutura do Arquivo

```
frontend/
  src/
    routes/
      _public/
        layout.tsx                               <-- layout publico (Navbar + Footer + Outlet)
        index.tsx                                <-- pagina inicial (home)
        [entity]/
          index.tsx                              <-- listagem publica (cards + paginacao)
          $[entityId]/
            index.tsx                            <-- detalhe com parametro dinamico
    components/
      common/
        navbar.tsx                               <-- Navbar com menu horizontal
        footer.tsx                               <-- Footer com tres colunas
```

- Rotas publicas vivem em `routes/_public/[entity]/index.tsx` (listagem) ou `routes/_public/[entity]/$[entityId]/index.tsx` (detalhe).
- O layout pai `/_public/layout.tsx` garante Navbar e Footer em todas as paginas.

---

## Template: Listagem com useInfiniteQuery

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import z from 'zod';

import { API } from '@/lib/api';
import type { I{{Entity}}, Paginated } from '@/lib/entities';

const PER_PAGE = 12;
const BASE_QUERY_KEY = ['/{{entities}}', 'public'];

export const Route = createFileRoute('/_public/{{entities}}/')({
  component: RouteComponent,
  validateSearch: z.object({
    search: z.string().optional(),
    category_id: z.string().optional(),
  }),
});

function RouteComponent(): React.JSX.Element {
  const search = Route.useSearch();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: [...BASE_QUERY_KEY, { ...search }],
      queryFn: async ({ pageParam }): Promise<Paginated<I{{Entity}}>> => {
        const response = await API.get<Paginated<I{{Entity}}>>('/{{entities}}', {
          params: {
            page: pageParam,
            per_page: PER_PAGE,
            ...search,
          },
        });
        return response.data;
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) => {
        if (lastPage.meta.page < lastPage.meta.last_page) {
          return lastPage.meta.page + 1;
        }
        return undefined;
      },
    });

  const items = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <section className="flex flex-col w-full">
      <div className="container mx-auto px-4 py-8">
        {/* Botao voltar */}
        <button onClick={() => router.history.go(-1)}>
          <ArrowLeft /> <span>Voltar</span>
        </button>

        {/* Titulo */}
        <h1>{{Entities}}</h1>

        {/* Grid de cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <{{Entity}}Card key={item._id} item={item} />
          ))}
        </div>

        {/* Botao carregar mais */}
        {hasNextPage && (
          <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage && <Spinner />}
            <span>Carregar mais</span>
          </Button>
        )}
      </div>
    </section>
  );
}
```

## Template: Listagem com useQuery + Paginacao Manual

```typescript
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import z from 'zod';

const PER_PAGE = 5;

export const Route = createFileRoute('/_public/{{entities}}/')({
  component: RouteComponent,
  validateSearch: z.object({
    page: z.number().optional(),
    search: z.string().optional(),
  }),
});

function RouteComponent(): React.JSX.Element {
  const searchParams = Route.useSearch();
  const navigate = useNavigate();
  const page = searchParams.page ?? 1;

  const { data, isLoading } = useQuery({
    queryKey: ['/{{entities}}', page, searchParams],
    queryFn: async () => {
      const response = await API.get<Paginated<I{{Entity}}>>('/{{entities}}', {
        params: { page, per_page: PER_PAGE, ...searchParams },
      });
      return response.data;
    },
  });

  const handlePageChange = (newPage: number) => {
    navigate({
      to: '.',
      search: { ...searchParams, page: newPage },
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section>
      {/* Cards + Paginacao inline (prev/next buttons) */}
    </section>
  );
}
```

## Template: Detalhe com $paramName

```typescript
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useParams } from '@tanstack/react-router';

import { API } from '@/lib/api';
import type { I{{Entity}} } from '@/lib/entities';

export const Route = createFileRoute('/_public/{{entities}}/${{entity}}Id/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { {{entity}}Id } = useParams({ from: '/_public/{{entities}}/${{entity}}Id/' });

  const { data, status } = useQuery({
    queryKey: ['/public/{{entities}}/', {{entity}}Id],
    queryFn: async () => {
      const response = await API.get<I{{Entity}}>(`/public/{{entities}}/${{{entity}}Id}`);
      return response.data;
    },
    enabled: Boolean({{entity}}Id),
  });

  return (
    <section className="flex flex-col w-full bg-white">
      {/* Botao voltar + Conteudo do detalhe */}
    </section>
  );
}
```

---

## Exemplo Real

```typescript
// routes/_public/pieces/index.tsx (trecho)
export const Route = createFileRoute('/_public/pieces/')({
  component: RouteComponent,
  validateSearch: z.object({
    search: z.string().optional(),
    category_id: z.string().optional(),
  }),
});

function RouteComponent(): React.JSX.Element {
  const search = Route.useSearch();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ['/pieces', 'public', { ...search }],
      queryFn: async ({ pageParam }): Promise<Paginated<IPiece>> => {
        const response = await API.get<Paginated<IPiece>>('/pieces', {
          params: { page: pageParam, per_page: 12, ...search },
        });
        return response.data;
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) => {
        if (lastPage.meta.page < lastPage.meta.last_page) {
          return lastPage.meta.page + 1;
        }
        return undefined;
      },
    });

  const pieces = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <section className="flex flex-col h-full w-full">
      <div className="container mx-auto px-4 py-8">
        <button onClick={() => router.history.go(-1)} className="group inline-flex items-center gap-2">
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span>Voltar</span>
        </button>

        <h1>Pecas</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pieces.map((piece) => (
            <PieceCard key={piece._id} piece={piece} />
          ))}
        </div>

        {hasNextPage && (
          <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage && <Spinner />}
            <span>Carregar mais</span>
          </Button>
        )}
      </div>
    </section>
  );
}
```

**Leitura do exemplo:**

1. `Route.useSearch()` retorna os parametros de URL validados pelo Zod. Para rotas publicas, usa-se `Route.useSearch()` (diferente do `useSearch({ from })` das rotas privadas).
2. `useInfiniteQuery` gerencia paginacao incremental. `pageParam` comeca em 1 e incrementa automaticamente via `getNextPageParam`.
3. `data?.pages.flatMap((page) => page.data)` achata todas as paginas carregadas em um unico array para renderizacao.
4. O botao "carregar mais" usa `fetchNextPage()` e mostra `Spinner` durante carregamento.
5. Strings de interface sao escritas diretamente em portugues (sem sistema de i18n).
6. O botao de voltar usa `router.history.go(-1)` com animacao hover no icone.

---

## Layout Publico vs Privado

| Aspecto | Publico (`_public/`) | Privado (`_private/`) |
|---------|---------------------|----------------------|
| Layout | Navbar + Footer | Sidebar + Header |
| Navegacao | Menu horizontal | Menu vertical sidebar |
| Autenticacao | Nao requerida | Obrigatoria |
| Cor principal | `bg-[var(--color-primary)]` (Navbar) | Tema admin |
| Largura | Full width (`container`) | Sidebar inset |
| Paginacao | Inline ou infinite scroll | Componente `Pagination` |

---

## Padroes de Card

### Card Vertical (Pecas)

```typescript
<Card className="group overflow-hidden border-none p-0 gap-0 shadow-sm rounded-none bg-background-card cursor-pointer">
  <div className="aspect-4/5 w-full overflow-hidden">
    <img src={imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
  </div>
  <div className="h-1 w-full bg-[var(--color-primary)]" />
  <CardContent className="flex flex-col items-center py-6 px-3 text-center">
    <h3 className="text-lg font-bold line-clamp-2">{title}</h3>
  </CardContent>
</Card>
```

### Card com Overlay (Categorias)

```typescript
<Link to="/categories/$categoryId" params={{ categoryId }}>
  <div className="relative group overflow-hidden aspect-square">
    <img src={imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-90" />
    <div className="absolute bottom-6 left-0 w-full text-center">
      <h3 className="text-white text-2xl font-bold drop-shadow-md">{name}</h3>
    </div>
  </div>
</Link>
```

---

## Regras e Convencoes

1. **Sempre sob `/_public/`** -- rotas de navegacao publica vivem em `routes/_public/`. O layout garante Navbar + Footer automaticamente.

2. **Strings em portugues direto** -- textos de interface em rotas publicas sao escritos diretamente em portugues. Nao usar sistema de i18n.

3. **`useInfiniteQuery` para listas longas** -- prefira `useInfiniteQuery` com botao "carregar mais" para listas longas.

4. **`useQuery` para listas curtas** -- use `useQuery` com paginacao manual (prev/next) para listagens menores.

5. **`$paramName` para rotas dinamicas** -- parametros de URL usam prefixo `$` (ex.: `$entityId`). Extraia via `useParams({ from: '/_public/...' })`.

6. **`Route.useSearch()` para search params** -- em rotas publicas, use `Route.useSearch()` (metodo do Route) em vez de `useSearch({ from })`.

7. **Botao de voltar** -- toda pagina de detalhe e listagem (exceto home) deve ter um botao de voltar: `router.history.go(-1)` com `ArrowLeft` e texto "Voltar".

8. **Grid responsivo** -- use grid system com breakpoints: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`. Home pode usar ate 5 colunas.

9. **Scroll to top ao paginar** -- ao mudar de pagina com paginacao manual, incluir `window.scrollTo({ top: 0, behavior: 'smooth' })`.

10. **Cards com hover animation** -- todos os cards de imagem devem ter `transition-transform group-hover:scale-105` na imagem para feedback visual.

---

## Checklist

- [ ] O arquivo esta em `routes/_public/[entity]/index.tsx` ou `routes/_public/[entity]/$[entityId]/index.tsx`.
- [ ] `createFileRoute` usa o path com `/_public/` e barra final.
- [ ] `validateSearch` define filtros com Zod (se aplicavel).
- [ ] A query usa `useInfiniteQuery` (lista longa) ou `useQuery` (lista curta).
- [ ] `getNextPageParam` verifica `meta.page < meta.last_page`.
- [ ] O layout usa `container mx-auto px-4` para responsividade.
- [ ] Cards possuem hover animation na imagem.
- [ ] Pagina de detalhe usa `$paramName` e `useParams`.
- [ ] Pagina de detalhe tem botao de voltar com texto "Voltar".
- [ ] Pagina de listagem tem titulo em portugues.
- [ ] Loading states usam Skeleton inline ou Spinner.

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| Navbar e Footer ausentes | Arquivo fora de `routes/_public/` | Mover para dentro de `routes/_public/` |
| Infinite scroll nao para | `getNextPageParam` retorna sempre um numero | Retornar `undefined` quando `meta.page >= meta.last_page` |
| `useParams` retorna undefined | `from` do `useParams` nao coincide com o path | Verificar que o `from` inclui o `$paramName` no path |
| Cards sem hover effect | Faltou `group` no container e `group-hover` na imagem | Adicionar `group` no card wrapper e `group-hover:scale-105` na img |
| Pagina nao scrolla para o topo | Faltou `scrollTo` ao mudar pagina | Adicionar `window.scrollTo({ top: 0, behavior: 'smooth' })` |
| Dados acumulam entre filtros | `queryKey` nao inclui search params | Incluir search params na queryKey: `['/entity', 'public', { ...search }]` |

---

**Cross-references:** ver [016-skill-rota-publica.md](./016-skill-rota-publica.md), [027-skill-layout.md](./027-skill-layout.md), [032-skill-combobox.md](./032-skill-combobox.md).
