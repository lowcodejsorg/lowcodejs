# Roteamento

## Visao Geral

O frontend utiliza **TanStack Router** com file-based routing. As rotas sao geradas automaticamente a partir da estrutura de diretorios em `src/routes/` e compiladas em `src/routeTree.gen.ts`.

---

## src/router.tsx

```typescript
import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import * as TanstackQuery from './integrations/tanstack-query/root-provider';
import { routeTree } from './routeTree.gen';

export const getRouter = () => {
  const rqContext = TanstackQuery.getContext();

  const router = createRouter({
    routeTree,
    context: { ...rqContext },
    defaultPreload: 'intent',
    Wrap: (props: { children: React.ReactNode }) => {
      return (
        <TanstackQuery.Provider {...rqContext}>
          {props.children}
        </TanstackQuery.Provider>
      );
    },
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient: rqContext.queryClient,
  });

  return router;
};
```

### Configuracoes do Router

| Configuracao | Valor | Descricao |
|---|---|---|
| `routeTree` | Auto-gerado | Arvore de rotas do file-system |
| `defaultPreload` | `'intent'` | Pre-carrega rotas ao hover/focus |
| `Wrap` | TanStack Query Provider | Envolve toda a aplicacao |
| SSR Query | Habilitado | Hidratacao de queries no SSR |

---

## src/routes/__root.tsx

A rota raiz define o documento HTML base:

```typescript
export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
    links: [{ rel: 'stylesheet', href: '/src/styles.css' }],
  }),
  component: RootComponent,
});
```

O `RootComponent` renderiza:
- Documento HTML com `<Html lang="pt-br">`
- `<Head>` com meta tags e `<title>LowCodeJS Platform</title>`
- `<Body>` com `<Outlet />` (conteudo da rota) e `<Toaster />` (sonner)

---

## Mapa de Rotas

### Rotas Publicas

| Rota | Arquivo | Descricao |
|---|---|---|
| `/` | `_authentication/_sign-in/index.tsx` | Pagina de login |
| `/sign-up` | `_authentication/sign-up/index.tsx` | Pagina de cadastro |

### Rotas Privadas (/_private)

| Rota | Arquivo | Descricao |
|---|---|---|
| `/dashboard` | `dashboard/index.tsx` | Dashboard com estatisticas |
| `/tables` | `tables/index.tsx` | Listagem de tabelas |
| `/tables/new` | `tables/new/index.tsx` | Escolha: criar ou clonar |
| `/tables/create` | `tables/create/index.tsx` | Criar tabela |
| `/tables/clone` | `tables/clone/index.tsx` | Clonar tabela |
| `/tables/$slug` | `tables/$slug/index.tsx` | Visualizar tabela (7 views) |
| `/tables/$slug/detail` | `tables/$slug/detail/index.tsx` | Configuracao da tabela |
| `/tables/$slug/methods` | `tables/$slug/methods.tsx` | Metodos JS (Monaco) |
| `/tables/$slug/field/management` | `tables/$slug/field/management.tsx` | Gerenciar campos |
| `/tables/$slug/field/create` | `tables/$slug/field/create/index.tsx` | Criar campo |
| `/tables/$slug/field/$fieldId` | `tables/$slug/field/$fieldId/index.tsx` | Editar campo |
| `/tables/$slug/row/create` | `tables/$slug/row/create/index.tsx` | Criar registro |
| `/tables/$slug/row/$rowId` | `tables/$slug/row/$rowId/index.tsx` | Editar registro |
| `/users` | `users/index.tsx` | Listagem de usuarios |
| `/users/create` | `users/create/index.tsx` | Criar usuario |
| `/users/$userId` | `users/$userId/index.tsx` | Editar usuario |
| `/groups` | `groups/index.tsx` | Listagem de grupos |
| `/groups/create` | `groups/create/index.tsx` | Criar grupo |
| `/groups/$groupId` | `groups/$groupId/index.tsx` | Editar grupo |
| `/menus` | `menus/index.tsx` | Listagem de menus |
| `/menus/create` | `menus/create/index.tsx` | Criar menu |
| `/menus/$menuId` | `menus/$menuId/index.tsx` | Editar menu |
| `/pages/$slug` | `pages/$slug.tsx` | Pagina dinamica HTML |
| `/profile` | `profile/index.tsx` | Perfil do usuario |
| `/settings` | `settings/index.tsx` | Configuracoes (MASTER) |
| `/tools` | `tools/index.tsx` | Ferramentas |

---

## Convencoes de Roteamento

| Convencao | Exemplo | Significado |
|---|---|---|
| `_prefixo` | `_private`, `_authentication` | Layout wrapper (nao aparece na URL) |
| `$param` | `$slug`, `$userId` | Parametro dinamico |
| `index.tsx` | `users/index.tsx` | Rota padrao do diretorio |
| `layout.tsx` | `_private/layout.tsx` | Layout compartilhado (routeToken) |

---

## Preload Strategy

O router utiliza `defaultPreload: 'intent'`, o que significa que:
- Ao **hover** sobre um link, a rota e pre-carregada
- Ao **focar** em um link (teclado), a rota e pre-carregada
- Os dados da rota ficam em cache pelo TanStack Query (staleTime: 1h)
