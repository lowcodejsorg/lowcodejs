# Skill: Layout

O layout e o componente estrutural que envolve um grupo de rotas, fornecendo elementos visuais compartilhados (sidebar, header) e logica comum (autenticacao, menu dinamico). No TanStack Router, layouts sao definidos via `createFileRoute` com um path de prefixo (ex.: `'/_private'`) e renderizam `<Outlet />` para exibir as rotas filhas. O layout privado (`/_private`) encapsula todas as paginas autenticadas com `SidebarProvider`, `Sidebar` condicional por autenticacao, `Header` com search contextual e `Outlet`. O menu da sidebar e carregado dinamicamente com base na role do usuario via hook de query.

---

## Estrutura do Arquivo

```
frontend/
  src/
    routes/
      _private/
        route.tsx                              <-- layout privado (ou layout.tsx)
      _authentication/
        route.tsx                              <-- layout de autenticacao
    components/
      common/
        header.tsx                             <-- componente Header
        sidebar.tsx                            <-- componente Sidebar
      ui/
        sidebar.tsx                            <-- SidebarProvider, SidebarInset (shadcn)
    hooks/
      tanstack-query/
        use-menu-dynamic.ts                    <-- hook de menu por role
    stores/
      authentication.ts                        <-- store Zustand de autenticacao
    lib/
      constant.ts                              <-- E_ROLE e constantes
```

- O layout privado vive em `frontend/src/routes/_private/route.tsx` (ou `layout.tsx`, dependendo da convencao do projeto).
- O layout de autenticacao vive em `frontend/src/routes/_authentication/route.tsx`.
- Componentes compartilhados (Header, Sidebar) vivem em `frontend/src/components/common/`.

---

## Template

```typescript
import { Outlet, createFileRoute } from '@tanstack/react-router';
import React from 'react';
import { Header } from '@/components/common/header';
import { Sidebar } from '@/components/common/sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useMenuDynamic } from '@/hooks/tanstack-query/use-menu-dynamic';
import { E_ROLE } from '@/lib/constant';
import { useAuthenticationStore } from '@/stores/authentication';

export const Route = createFileRoute('/{{_layout_prefix}}')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const authentication = useAuthenticationStore().authenticated;
  const isAuthenticated = Boolean(authentication?.role);
  const { menu } = useMenuDynamic(authentication?.role ?? E_ROLE.ARTISAN);

  const routesWithoutSearchInput: Array<string | RegExp> = [
    // Rotas onde o input de search no header nao deve aparecer
  ];

  return (
    <SidebarProvider>
      {isAuthenticated && <Sidebar menu={menu} />}
      <SidebarInset className="relative flex flex-col h-screen w-screen overflow-hidden flex-1 px-4 sm:px-2">
        <Header routesWithoutSearchInput={routesWithoutSearchInput} />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
```

---

## Exemplo Real

```typescript
import { Outlet, createFileRoute } from '@tanstack/react-router';
import React from 'react';
import { Header } from '@/components/common/header';
import { Sidebar } from '@/components/common/sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useMenuDynamic } from '@/hooks/tanstack-query/use-menu-dynamic';
import { E_ROLE } from '@/lib/constant';
import { useAuthenticationStore } from '@/stores/authentication';

export const Route = createFileRoute('/_private')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const authentication = useAuthenticationStore().authenticated;
  const isAuthenticated = Boolean(authentication?.role);
  const { menu } = useMenuDynamic(authentication?.role ?? E_ROLE.ARTISAN);

  const routesWithoutSearchInput: Array<string | RegExp> = [
    '/',
    '/dashboard',
    /^\/groups\/.+$/,
    '/profile',
    '/settings',
  ];

  return (
    <SidebarProvider>
      {isAuthenticated && <Sidebar menu={menu} />}
      <SidebarInset className="relative flex flex-col h-screen w-screen overflow-hidden flex-1 px-4 sm:px-2">
        <Header routesWithoutSearchInput={routesWithoutSearchInput} />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
```

**Leitura do exemplo:**

1. `createFileRoute('/_private')` registra o layout para todas as rotas sob `/_private/`. O underscore no inicio (`_private`) indica que esse segmento nao aparece na URL -- e um layout route do TanStack Router.
2. `useAuthenticationStore().authenticated` acessa os dados do usuario logado do store Zustand. O `authenticated` pode ser `null` se o usuario nao estiver logado.
3. `isAuthenticated` e derivado de `Boolean(authentication?.role)`. Usado para renderizacao condicional da Sidebar -- se o usuario nao estiver autenticado, a sidebar nao aparece.
4. `useMenuDynamic` recebe a role do usuario (ex.: `'ADMINISTRATOR'`, `'ARTISAN'`) e retorna o `menu` correspondente. O fallback `E_ROLE.ARTISAN` garante que sempre haja um menu, mesmo que a role esteja indefinida.
5. `routesWithoutSearchInput` define as rotas onde o input de search no Header nao deve aparecer. Aceita strings (match exato) e RegExp (match por pattern). O Header usa essa lista para decidir se exibe ou oculta o campo de busca.
6. `SidebarProvider` e o context provider do componente sidebar (shadcn), que gerencia o estado de aberto/fechado da sidebar.
7. `{isAuthenticated && <Sidebar menu={menu} />}` renderiza a sidebar condicionalmente. Isso permite que o layout exista sem sidebar quando necessario.
8. `SidebarInset` e o container principal ao lado da sidebar. As classes CSS garantem que ocupe toda a tela restante com scroll adequado.
9. `<Header routesWithoutSearchInput={routesWithoutSearchInput} />` renderiza o header com logica contextual de search.
10. `<Outlet />` e o ponto de insercao onde as rotas filhas (ex.: `/users`, `/groups/create`) sao renderizadas. Toda rota sob `/_private/` aparece aqui.

---

## Regras e Convencoes

1. **`createFileRoute` com path do layout** -- o path deve corresponder ao prefixo do layout (ex.: `'/_private'`). O underscore indica que e um layout route e nao aparece na URL final.

2. **`Outlet` obrigatorio** -- todo layout deve renderizar `<Outlet />` exatamente uma vez. Sem ele, as rotas filhas nao aparecem. O `Outlet` deve estar dentro da arvore de componentes do layout.

3. **Sidebar condicional por autenticacao** -- a Sidebar so e renderizada quando `isAuthenticated` e `true`. Isso permite que o layout suporte cenarios onde a autenticacao ainda esta sendo verificada.

4. **Menu dinamico por role** -- o menu da sidebar e carregado via `useMenuDynamic`, que recebe a role do usuario e retorna os itens de menu autorizados. Nunca hardcode itens de menu no layout.

5. **`SidebarProvider` como wrapper** -- o `SidebarProvider` deve envolver tanto a `Sidebar` quanto o `SidebarInset`. Ele gerencia o estado compartilhado (aberto/fechado) via context.

6. **Header com lista de exclusao de search** -- o `Header` recebe `routesWithoutSearchInput` para saber em quais rotas o input de busca deve ser ocultado. A lista aceita strings e RegExp.

7. **Hooks chamados incondicionalmente** -- `useAuthenticationStore`, `useMenuDynamic` e todos os outros hooks devem ser chamados no topo do componente, sem condicoes. Essa e uma regra fundamental dos hooks do React.

8. **Fallback para role** -- ao chamar `useMenuDynamic`, sempre fornecer um fallback (ex.: `E_ROLE.ARTISAN`) caso `authentication?.role` seja `undefined`. Isso evita erros durante o carregamento inicial.

9. **Classes CSS do layout** -- o `SidebarInset` deve ter `h-screen`, `overflow-hidden` e `flex-1` para ocupar o espaco restante corretamente. O scroll acontece dentro das rotas filhas, nao no layout.

10. **Export como `Route`** -- o layout e exportado como `export const Route` (named export), seguindo a convencao do TanStack Router file-based routing.

11. **Um layout por contexto** -- o projeto possui dois layouts principais: `/_private` (autenticado, com sidebar) e `/_authentication` (nao autenticado, sem sidebar). Novos layouts devem seguir o mesmo pattern.

---

## Checklist

- [ ] O arquivo esta em `routes/_private/route.tsx` (ou `layout.tsx`).
- [ ] `createFileRoute` usa o path do layout (ex.: `'/_private'`).
- [ ] A rota e exportada como `export const Route`.
- [ ] O componente renderiza `<Outlet />` exatamente uma vez.
- [ ] `SidebarProvider` envolve `Sidebar` e `SidebarInset`.
- [ ] `Sidebar` e renderizada condicionalmente com `isAuthenticated`.
- [ ] `useMenuDynamic` recebe a role com fallback `E_ROLE.ARTISAN`.
- [ ] `Header` recebe `routesWithoutSearchInput` com as rotas de exclusao.
- [ ] Todos os hooks sao chamados incondicionalmente no topo do componente.
- [ ] `SidebarInset` tem classes CSS para `h-screen`, `overflow-hidden` e `flex-1`.
- [ ] O componente e declarado como `function RouteComponent(): React.JSX.Element`.

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| Rotas filhas nao aparecem | `<Outlet />` nao renderizado no layout | Adicionar `<Outlet />` dentro do `SidebarInset`, apos o `Header` |
| Sidebar sem itens de menu | `useMenuDynamic` recebendo `undefined` como role | Fornecer fallback: `authentication?.role ?? E_ROLE.ARTISAN` |
| Sidebar aparece para usuario nao autenticado | Renderizacao incondicional da Sidebar | Usar `{isAuthenticated && <Sidebar menu={menu} />}` |
| Erro `React Hook called conditionally` | Hook dentro de `if` ou apos `return` antecipado | Mover todos os hooks para o topo do componente, antes de qualquer condicional |
| Scroll duplo (layout + conteudo) | `SidebarInset` sem `overflow-hidden` | Adicionar `overflow-hidden` ao `SidebarInset` e garantir que o scroll fique na rota filha |
| Search input aparece em rota indesejada | Rota nao adicionada ao `routesWithoutSearchInput` | Adicionar a rota (string ou RegExp) ao array `routesWithoutSearchInput` |
| Estado da sidebar nao compartilhado | `SidebarProvider` nao envolvendo todos os componentes | Garantir que `SidebarProvider` e o wrapper mais externo, envolvendo `Sidebar` e `SidebarInset` |
| Layout nao registrado pelo TanStack Router | Arquivo nomeado incorretamente ou fora da pasta esperada | O arquivo deve ser `route.tsx` (ou `layout.tsx`) dentro da pasta do prefixo (ex.: `routes/_private/route.tsx`) |
| Menu nao atualiza ao trocar de role | `useMenuDynamic` nao reage a mudancas no store | Verificar que `useMenuDynamic` recebe a role diretamente do store (reativo) e nao de uma variavel estale |

---

**Cross-references:** ver [015-skill-rota-privada.md](./015-skill-rota-privada.md), [023-skill-store.md](./023-skill-store.md).
