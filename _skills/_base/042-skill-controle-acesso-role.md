# Skill: Controle de Acesso por Role (Frontend)

O controle de acesso no frontend e baseado em roles (papeis) do usuario autenticado. O sistema usa um mapeamento estatico `ROLE_ROUTES` que define quais rotas cada role pode acessar, uma funcao `canAccessRoute()` que verifica permissao com pattern matching para rotas dinamicas, e menus condicionais na sidebar que mostram/ocultam itens baseado na role. O redirect padrao apos login tambem varia por role.

---

## Estrutura do Arquivo

```
frontend/
  src/
    lib/
      menu/
        menu-access-permissions.ts       <-- ROLE_ROUTES, canAccessRoute(), ROLE_DEFAULT_ROUTE
        menu-route.ts                    <-- Types: MenuRoute, MenuItem, MenuGroupItem
        menu.ts                          <-- getStaticMenusByRole(): menus por role
    stores/
      authentication.ts                  <-- useAuthenticationStore: role do usuario
    routes/
      _private/
        layout.tsx                       <-- Guard: redirect se nao autenticado, sidebar por role
    components/
      common/
        sidebar.tsx                      <-- Sidebar com menu filtrado por role
```

---

## Template: Mapeamento de Rotas por Role

```typescript
// lib/menu/menu-access-permissions.ts
import type { LinkProps } from '@tanstack/react-router';

export const ROLE_ROUTES: Record<string, Array<LinkProps['to']>> = {
  MASTER: [
    '/groups',
    '/groups/create',
    '/groups/$groupId',
    '/menus',
    '/menus/create',
    '/menus/$menuId',
    '/pages/$slug',
    '/profile',
    '/settings',
    '/tables',
    '/tables/$slug',
    '/users',
    '/users/create',
    '/users/$userId',
  ],
  ADMINISTRATOR: [
    '/groups',
    '/groups/create',
    '/groups/$groupId',
    '/tables',
    '/tables/$slug',
    '/menus',
    '/menus/create',
    '/menus/$menuId',
    '/pages/$slug',
    '/profile',
    '/users',
    '/users/create',
    '/users/$userId',
  ],
  MANAGER: ['/tables', '/tables/$slug', '/pages/$slug'],
  REGISTERED: ['/tables', '/tables/$slug', '/pages/$slug'],
};

export const ROLE_DEFAULT_ROUTE: Record<string, LinkProps['to']> = {
  MASTER: '/tables',
  ADMINISTRATOR: '/tables',
  MANAGER: '/tables',
  REGISTERED: '/tables',
};
```

## Template: Funcao de Verificacao de Acesso

```typescript
// lib/menu/menu-access-permissions.ts (continuacao)

/**
 * Verifica se uma rota real corresponde a um padrao de rota.
 * Exemplo: matchRoute('/users/123', '/users/$userId') => true
 */
function matchRoute(actualRoute: string, routePattern: string): boolean {
  const actualParts = actualRoute.split('/').filter(Boolean);
  const patternParts = routePattern.split('/').filter(Boolean);

  if (actualParts.length !== patternParts.length) {
    return false;
  }

  return patternParts.every((patternPart, index) => {
    // Se o segmento comeca com $, e um parametro dinamico
    if (patternPart.startsWith('$')) {
      return true;
    }
    // Caso contrario, deve corresponder exatamente
    return patternPart === actualParts[index];
  });
}

export function canAccessRoute(
  role: keyof typeof ROLE_ROUTES,
  route: string,
): boolean {
  const allowedRoutes = ROLE_ROUTES[role];

  return allowedRoutes.some((allowedRoute) => {
    if (!allowedRoute || typeof allowedRoute !== 'string') {
      return false;
    }

    // Rotas com parametros dinamicos usam pattern matching
    if (allowedRoute.includes('$')) {
      return matchRoute(route, allowedRoute);
    }
    // Rotas estaticas usam comparacao direta
    return route === allowedRoute;
  });
}
```

## Template: Menus Estaticos por Role

```typescript
// lib/menu/menu.ts
import type { MenuRoute } from './menu-route';
import { E_ROLE } from '@/lib/constant';

export const getStaticMenusByRole = (
  role: string,
): { before: MenuRoute; after: MenuRoute } => {
  switch (role) {
    case E_ROLE.MASTER:
      return {
        before: [],
        after: [
          {
            title: 'Sistema',
            items: [
              { title: 'Tabelas', url: '/tables', icon: TableIcon },
              { title: 'Configuracoes', url: '/settings', icon: SettingsIcon },
              { title: 'Menus', url: '/menus', icon: MenuIcon },
              { title: 'Grupos', url: '/groups', icon: GroupIcon },
              { title: 'Usuarios', url: '/users', icon: UsersIcon },
            ],
          },
          {
            title: 'Conta',
            items: [{ title: 'Perfil', url: '/profile', icon: UserIcon }],
          },
        ],
      };

    case E_ROLE.ADMINISTRATOR:
      return {
        before: [],
        after: [
          {
            title: 'Sistema',
            items: [
              { title: 'Tabelas', url: '/tables', icon: TableIcon },
              { title: 'Menus', url: '/menus', icon: MenuIcon },
              { title: 'Usuarios', url: '/users', icon: UsersIcon },
            ],
          },
          {
            title: 'Conta',
            items: [{ title: 'Perfil', url: '/profile', icon: UserIcon }],
          },
        ],
      };

    // MANAGER e REGISTERED: acesso reduzido
    default:
      return {
        before: [],
        after: [
          {
            title: 'Sistema',
            items: [{ title: 'Tabelas', url: '/tables', icon: TableIcon }],
          },
          {
            title: 'Conta',
            items: [{ title: 'Perfil', url: '/profile', icon: UserIcon }],
          },
        ],
      };
  }
};
```

## Template: Store de Autenticacao

```typescript
// stores/authentication.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { E_ROLE } from '@/lib/constant';
import type { IUser } from '@/lib/interfaces';

export type Authenticated = Pick<IUser, 'name' | 'email'> & {
  role: keyof typeof E_ROLE;
  sub: string;
};

type AuthenticationStore = {
  authenticated: Authenticated | null;
  isAuthenticated: boolean;
  setAuthenticated: (authenticated: Authenticated | null) => void;
  logout: () => void;
};

export const useAuthenticationStore = create<AuthenticationStore>()(
  persist(
    (set) => ({
      authenticated: null,
      isAuthenticated: false,
      setAuthenticated: (authenticated) =>
        set({ authenticated, isAuthenticated: !!authenticated }),
      logout: () => set({ authenticated: null, isAuthenticated: false }),
    }),
    {
      name: 'authentication-store',
      partialize: (state) => ({
        authenticated: state.authenticated,
        isAuthenticated: state.isAuthenticated,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
```

## Template: Layout Privado com Guard

```typescript
// routes/_private/layout.tsx
import { Outlet, createFileRoute } from '@tanstack/react-router';

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

  const { menu } = useMenuDynamic(authentication?.role ?? E_ROLE.REGISTERED);

  return (
    <SidebarProvider>
      {isAuthenticated && <Sidebar menu={menu} />}
      <SidebarInset>
        <Header />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
```

---

## Exemplo Real

### Verificando acesso antes de navegar

```typescript
import { canAccessRoute, ROLE_DEFAULT_ROUTE } from '@/lib/menu/menu-access-permissions';

// Verificar se o usuario pode acessar a rota
const role = useAuthenticationStore().authenticated?.role;

if (role && !canAccessRoute(role, '/users')) {
  // Redirect para rota padrao da role
  navigate({ to: ROLE_DEFAULT_ROUTE[role] });
}
```

### Sidebar condicional por role

```typescript
// A sidebar recebe o menu ja filtrado por role
const { menu } = useMenuDynamic(authentication?.role ?? E_ROLE.REGISTERED);

// O menu e construido com base na role:
// - MASTER: ve todas as opcoes (Tabelas, Config, Menus, Grupos, Usuarios)
// - ADMINISTRATOR: ve opcoes de gestao (Tabelas, Menus, Usuarios)
// - MANAGER/REGISTERED: ve apenas Tabelas
```

### Pattern matching para rotas dinamicas

```typescript
// canAccessRoute com rota dinamica:
canAccessRoute('ADMINISTRATOR', '/users/507f1f77bcf86cd799439011');
// → true, pois '/users/$userId' esta em ROLE_ROUTES.ADMINISTRATOR

canAccessRoute('REGISTERED', '/users/507f1f77bcf86cd799439011');
// → false, pois '/users/$userId' NAO esta em ROLE_ROUTES.REGISTERED

canAccessRoute('MANAGER', '/tables/my-table-slug');
// → true, pois '/tables/$slug' esta em ROLE_ROUTES.MANAGER
```

---

## Regras e Convencoes

1. **`ROLE_ROUTES` centralizado** -- todas as permissoes de acesso por role sao definidas em `menu-access-permissions.ts`. Nunca espalhadas em componentes.

2. **Pattern matching com `$`** -- rotas dinamicas usam prefixo `$` no pattern (ex.: `/users/$userId`). A funcao `matchRoute()` trata esses segmentos como wildcards.

3. **`canAccessRoute(role, route)`** -- funcao unica para verificar se uma role pode acessar uma rota. Funciona tanto para rotas estaticas quanto dinamicas.

4. **`ROLE_DEFAULT_ROUTE` por role** -- apos login, o redirect padrao e definido por role. Todas as roles redirecionam para `/tables` por padrao.

5. **Menus por role via `getStaticMenusByRole()`** -- o menu da sidebar e construido dinamicamente baseado na role. Roles com menos permissoes veem menos itens.

6. **`useAuthenticationStore().authenticated.role`** -- a role do usuario logado vem da store Zustand, que persiste no localStorage.

7. **Guard no layout** -- o layout `_private/layout.tsx` verifica se o usuario esta autenticado antes de renderizar a sidebar. Se nao autenticado, a sidebar nao aparece.

8. **Hook `useMenuDynamic(role)`** -- combina menus estaticos (por role) com menus dinamicos (do backend) para construir o menu final da sidebar.

9. **Sem `useTranslation()`** -- rotas privadas usam texto em portugues direto, sem sistema de i18n.

10. **Types tipados** -- `ROLE_ROUTES` usa `LinkProps['to']` para garantir que rotas referenciadas existem no router.

---

## Checklist

- [ ] `ROLE_ROUTES` definido em `lib/menu/menu-access-permissions.ts`.
- [ ] Cada role tem suas rotas permitidas listadas (inclusive dinamicas com `$`).
- [ ] `canAccessRoute()` exportada e funciona com pattern matching.
- [ ] `ROLE_DEFAULT_ROUTE` define redirect padrao por role.
- [ ] `getStaticMenusByRole()` retorna menus filtrados por role.
- [ ] Store `useAuthenticationStore` armazena `authenticated.role`.
- [ ] Layout `_private/layout.tsx` verifica autenticacao antes de renderizar.
- [ ] `useMenuDynamic(role)` combina menus estaticos e dinamicos.
- [ ] Novas rotas adicionadas ao `ROLE_ROUTES` para cada role que deve ter acesso.

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| Rota acessivel sem permissao | Rota nao verificada contra `ROLE_ROUTES` | Adicionar verificacao com `canAccessRoute()` |
| Rota dinamica nao reconhecida | Pattern sem `$` no `ROLE_ROUTES` | Usar pattern com `$`: `/users/$userId` |
| Menu mostrando item sem permissao | `getStaticMenusByRole()` nao filtrado | Verificar que a role retorna apenas itens permitidos |
| Redirect apos login vai para rota errada | `ROLE_DEFAULT_ROUTE` nao definido para a role | Adicionar entrada no `ROLE_DEFAULT_ROUTE` |
| Role `undefined` no store | Store nao atualizado apos login | Chamar `setAuthenticated()` com dados do JWT apos sign-in |
| Sidebar vazia | `useMenuDynamic` recebendo role errada | Verificar `authentication?.role ?? E_ROLE.REGISTERED` como fallback |
| Nova role sem acesso | Role nao adicionada ao `ROLE_ROUTES` | Adicionar nova entrada no `ROLE_ROUTES` com as rotas permitidas |

---

**Cross-references:** ver [041-skill-endpoint-autenticacao.md](./041-skill-endpoint-autenticacao.md) para os endpoints de autenticacao no backend, [027-skill-layout.md](./027-skill-layout.md) para a estrutura do layout privado, [023-skill-store.md](./023-skill-store.md) para o padrao Zustand da store de autenticacao.
