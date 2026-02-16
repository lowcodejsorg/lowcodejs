# Sistema de Menu

Documentacao do sistema de menus do frontend LowCodeJS, incluindo tipos de rotas, menus estaticos por role, controle de acesso e matching de rotas.

**Arquivos-fonte:**
- `src/lib/menu/menu-route.ts` -- Tipos de rotas do menu
- `src/lib/menu/menu.ts` -- Menus estaticos por role
- `src/lib/menu/menu-access-permissions.ts` -- Controle de acesso a rotas

---

## 1. Tipos de Rota do Menu

**Arquivo:** `src/lib/menu/menu-route.ts`

O sistema de menus utiliza uma hierarquia de tipos para representar itens de navegacao.

### Hierarquia de Tipos

```
MenuRoute (Array<MenuGroupItem>)
  |
  +-- MenuGroupItem
        |-- title: string
        |-- items: Array<MenuItem>
        |-- isLoading?: boolean
              |
              +-- MenuItem = CollapsibleItem | LinkItem
                    |
                    +-- LinkItem (link direto)
                    |     |-- url: LinkProps['to']
                    |
                    +-- CollapsibleItem (submenu expansivel)
                          |-- items: Array<{ url, title, ... }>
                          |-- url?: LinkProps['to']
```

### MenuRouteBaseItem

Interface base com propriedades comuns a todos os itens.

```typescript
export interface MenuRouteBaseItem {
  title: string;              // Texto de exibicao
  badge?: string;             // Badge opcional (ex: contagem)
  icon?: React.ElementType;   // Icone do Lucide React
  type?: string;              // Tipo customizado
}
```

### LinkItem

Item de menu que e um link direto para uma rota.

```typescript
export type LinkItem = MenuRouteBaseItem & {
  url: LinkProps['to'];   // Rota do TanStack Router
  items?: never;          // Nao possui subitens
};
```

### CollapsibleItem

Item de menu expansivel que contem subitens.

```typescript
export type CollapsibleItem = MenuRouteBaseItem & {
  items: Array<MenuRouteBaseItem & { url: LinkProps['to'] }>;
  url?: LinkProps['to'];  // URL opcional (clicavel mesmo sendo expansivel)
};
```

### MenuItem

Uniao discriminada entre `LinkItem` e `CollapsibleItem`.

```typescript
export type MenuItem = CollapsibleItem | LinkItem;
```

### MenuGroupItem

Grupo de itens de menu com titulo e estado de carregamento.

```typescript
export type MenuGroupItem = {
  title: string;             // Titulo do grupo (ex: 'Sistema', 'Conta')
  items: Array<MenuItem>;    // Itens do grupo
  isLoading?: boolean;       // Se o grupo esta carregando dados
};
```

### MenuRoute

O tipo final que representa a estrutura completa do menu.

```typescript
export type MenuRoute = Array<MenuGroupItem>;
```

### Exemplo de Estrutura

```typescript
import type { MenuRoute } from '@/lib/menu/menu-route';
import { TableIcon, UserIcon } from 'lucide-react';

const menu: MenuRoute = [
  {
    title: 'Sistema',
    items: [
      { title: 'Tabelas', url: '/tables', icon: TableIcon },
      {
        title: 'Usuarios',
        icon: UserIcon,
        items: [
          { title: 'Lista', url: '/users' },
          { title: 'Criar', url: '/users/create' },
        ],
      },
    ],
  },
  {
    title: 'Conta',
    items: [
      { title: 'Perfil', url: '/profile', icon: UserIcon },
    ],
  },
];
```

---

## 2. Menus Estaticos por Role

**Arquivo:** `src/lib/menu/menu.ts`

A funcao `getStaticMenusByRole` retorna os menus estaticos conforme a role do usuario logado.

### Assinatura

```typescript
export const getStaticMenusByRole = (
  role: string,
): { before: MenuRoute; after: MenuRoute } => { ... };
```

O retorno possui duas partes:
- **`before`**: Menus exibidos ANTES dos menus dinamicos (sempre `[]`)
- **`after`**: Menus exibidos APOS os menus dinamicos

### Itens por Role

#### MASTER (Super Administrador)

| Grupo | Itens | URLs |
|-------|-------|------|
| Sistema | Tabelas | `/tables` |
| Sistema | Configuracoes | `/settings` |
| Sistema | Menus | `/menus` |
| Sistema | Grupos | `/groups` |
| Sistema | Usuarios | `/users` |
| Sistema | Ferramentas | `/tools` |
| Conta | Perfil | `/profile` |

#### ADMINISTRATOR

| Grupo | Itens | URLs |
|-------|-------|------|
| Sistema | Tabelas | `/tables` |
| Sistema | Menus | `/menus` |
| Sistema | Usuarios | `/users` |
| Conta | Perfil | `/profile` |

#### MANAGER

| Grupo | Itens | URLs |
|-------|-------|------|
| Sistema | Tabelas | `/tables` |
| Conta | Perfil | `/profile` |

#### REGISTERED

| Grupo | Itens | URLs |
|-------|-------|------|
| Sistema | Tabelas | `/tables` |
| Conta | Perfil | `/profile` |

### Comparativo de Acesso aos Menus

| Item de Menu | MASTER | ADMINISTRATOR | MANAGER | REGISTERED |
|-------------|--------|---------------|---------|------------|
| Tabelas | Sim | Sim | Sim | Sim |
| Configuracoes | Sim | -- | -- | -- |
| Menus | Sim | Sim | -- | -- |
| Grupos | Sim | -- | -- | -- |
| Usuarios | Sim | Sim | -- | -- |
| Ferramentas | Sim | -- | -- | -- |
| Perfil | Sim | Sim | Sim | Sim |

### Icones Utilizados

| Item | Icone (Lucide) |
|------|---------------|
| Tabelas | `TableIcon` |
| Configuracoes | `SettingsIcon` |
| Menus | `MenuIcon` |
| Grupos | `GroupIcon` |
| Usuarios | `UsersIcon` |
| Ferramentas | `WrenchIcon` |
| Perfil | `UserIcon` |

### Exemplo de Uso

```typescript
import { getStaticMenusByRole } from '@/lib/menu/menu';

const role = 'ADMINISTRATOR';
const { before, after } = getStaticMenusByRole(role);

// before: [] (sempre vazio)
// after: [
//   {
//     title: 'Sistema',
//     items: [
//       { title: 'Tabelas', url: '/tables', icon: TableIcon },
//       { title: 'Menus', url: '/menus', icon: MenuIcon },
//       { title: 'Usuarios', url: '/users', icon: UsersIcon },
//     ],
//   },
//   {
//     title: 'Conta',
//     items: [
//       { title: 'Perfil', url: '/profile', icon: UserIcon },
//     ],
//   },
// ]
```

---

## 3. Controle de Acesso a Rotas

**Arquivo:** `src/lib/menu/menu-access-permissions.ts`

Este modulo define quais rotas cada role pode acessar e fornece funcoes para verificar permissoes.

### ROLE_ROUTES

Mapeamento de role para as rotas permitidas. Utiliza a sintaxe de rotas do TanStack Router com parametros dinamicos (`$param`).

```typescript
export const ROLE_ROUTES: Record<string, Array<LinkProps['to']>> = {
  MASTER: [
    '/groups', '/groups/create', '/groups/$groupId',
    '/menus', '/menus/create', '/menus/$menuId',
    '/pages/$slug',
    '/profile',
    '/settings',
    '/tables', '/tables/$slug',
    '/users', '/users/create', '/users/$userId',
  ],
  ADMINISTRATOR: [
    '/groups', '/groups/create', '/groups/$groupId',
    '/tables', '/tables/$slug',
    '/menus', '/menus/create', '/menus/$menuId',
    '/pages/$slug',
    '/profile',
    '/users', '/users/create', '/users/$userId',
  ],
  MANAGER: [
    '/tables', '/tables/$slug',
    '/pages/$slug',
  ],
  REGISTERED: [
    '/tables', '/tables/$slug',
    '/pages/$slug',
  ],
};
```

### Comparativo Completo de Rotas

| Rota | MASTER | ADMINISTRATOR | MANAGER | REGISTERED |
|------|--------|---------------|---------|------------|
| `/tables` | Sim | Sim | Sim | Sim |
| `/tables/$slug` | Sim | Sim | Sim | Sim |
| `/pages/$slug` | Sim | Sim | Sim | Sim |
| `/profile` | Sim | Sim | -- | -- |
| `/settings` | Sim | -- | -- | -- |
| `/menus` | Sim | Sim | -- | -- |
| `/menus/create` | Sim | Sim | -- | -- |
| `/menus/$menuId` | Sim | Sim | -- | -- |
| `/groups` | Sim | Sim | -- | -- |
| `/groups/create` | Sim | Sim | -- | -- |
| `/groups/$groupId` | Sim | Sim | -- | -- |
| `/users` | Sim | Sim | -- | -- |
| `/users/create` | Sim | Sim | -- | -- |
| `/users/$userId` | Sim | Sim | -- | -- |

### ROLE_DEFAULT_ROUTE

Rota padrao (redirect) para cada role apos o login.

```typescript
export const ROLE_DEFAULT_ROUTE: Record<string, LinkProps['to']> = {
  ADMINISTRATOR: '/tables',
  MANAGER: '/tables',
  REGISTERED: '/tables',
  MASTER: '/tables',
};
```

Todas as roles redirecionam para `/tables` como pagina inicial.

### matchRoute

Funcao interna que verifica se uma rota real corresponde a um padrao de rota com parametros dinamicos.

```typescript
function matchRoute(actualRoute: string, routePattern: string): boolean;
```

**Logica:**
1. Divide ambas as rotas em segmentos por `/`
2. Se o numero de segmentos for diferente, retorna `false`
3. Compara segmento a segmento:
   - Se o segmento do padrao comeca com `$`, aceita qualquer valor (parametro dinamico)
   - Caso contrario, exige correspondencia exata

```typescript
// Exemplos
matchRoute('/users/123', '/users/$userId');     // true
matchRoute('/tables/minha-tabela', '/tables/$slug'); // true
matchRoute('/users', '/users/$userId');         // false (tamanhos diferentes)
matchRoute('/settings', '/tables');             // false (nao corresponde)
```

### canAccessRoute

Funcao publica que verifica se uma role tem permissao para acessar uma rota.

```typescript
export function canAccessRoute(
  role: keyof typeof ROLE_ROUTES,
  route: string,
): boolean;
```

**Logica:**
1. Obtem a lista de rotas permitidas para a role
2. Para cada rota permitida:
   - Se contem `$` (parametro dinamico): usa `matchRoute` para comparacao
   - Caso contrario: compara diretamente

### Exemplos de Uso

```typescript
import {
  canAccessRoute,
  ROLE_ROUTES,
  ROLE_DEFAULT_ROUTE,
} from '@/lib/menu/menu-access-permissions';

// Verificar acesso
canAccessRoute('MASTER', '/settings');         // true
canAccessRoute('ADMINISTRATOR', '/settings');  // false
canAccessRoute('REGISTERED', '/tables');       // true
canAccessRoute('MANAGER', '/users');           // false

// Rotas com parametros dinamicos
canAccessRoute('MASTER', '/users/abc123');     // true (match /users/$userId)
canAccessRoute('REGISTERED', '/tables/proj');  // true (match /tables/$slug)
canAccessRoute('MANAGER', '/groups/abc123');   // false

// Rota padrao
const defaultRoute = ROLE_DEFAULT_ROUTE['ADMINISTRATOR'];
// => '/tables'
```

---

## 4. Fluxo de Navegacao

O fluxo completo de montagem do menu e controle de acesso:

```
1. Usuario faz login
   |
2. Backend retorna role no JWT
   |
3. Frontend chama getStaticMenusByRole(role)
   |-- Retorna { before: [], after: [...] }
   |
4. Frontend busca menus dinamicos da API (/menus)
   |
5. Monta menu final: [...before, ...dinamicos, ...after]
   |
6. Ao navegar, canAccessRoute(role, rota) verifica permissao
   |
7. Se nao tem acesso: redirect para ROLE_DEFAULT_ROUTE[role]
```

### Exemplo de Protecao de Rota

```typescript
import { canAccessRoute, ROLE_DEFAULT_ROUTE } from '@/lib/menu/menu-access-permissions';
import { redirect } from '@tanstack/react-router';

// Em um loader de rota protegida
export async function beforeLoad({ context, location }) {
  const role = context.user?.role;

  if (!role) {
    throw redirect({ to: '/' }); // Nao autenticado
  }

  if (!canAccessRoute(role, location.pathname)) {
    throw redirect({ to: ROLE_DEFAULT_ROUTE[role] });
  }
}
```

### Exemplo de Renderizacao Condicional de Menu

```typescript
import { getStaticMenusByRole } from '@/lib/menu/menu';
import type { MenuRoute } from '@/lib/menu/menu-route';

function Sidebar({ role, dynamicMenus }: { role: string; dynamicMenus: MenuRoute }) {
  const { before, after } = getStaticMenusByRole(role);

  const fullMenu: MenuRoute = [...before, ...dynamicMenus, ...after];

  return (
    <nav>
      {fullMenu.map((group) => (
        <div key={group.title}>
          <h3>{group.title}</h3>
          <ul>
            {group.items.map((item) => (
              <li key={item.title}>
                {item.icon && <item.icon />}
                {'url' in item && item.url ? (
                  <Link to={item.url}>{item.title}</Link>
                ) : (
                  <span>{item.title}</span>
                )}
                {'items' in item && item.items && (
                  <ul>
                    {item.items.map((sub) => (
                      <li key={sub.title}>
                        <Link to={sub.url}>{sub.title}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
```

---

## 5. Tabela Resumo

| Exportacao | Arquivo | Tipo | Descricao |
|-----------|---------|------|-----------|
| `MenuRouteBaseItem` | `menu-route.ts` | interface | Props base de item de menu |
| `LinkItem` | `menu-route.ts` | type | Item com link direto |
| `CollapsibleItem` | `menu-route.ts` | type | Item expansivel com subitens |
| `MenuItem` | `menu-route.ts` | type | Uniao `LinkItem \| CollapsibleItem` |
| `MenuGroupItem` | `menu-route.ts` | type | Grupo de itens com titulo |
| `MenuRoute` | `menu-route.ts` | type | `Array<MenuGroupItem>` |
| `getStaticMenusByRole` | `menu.ts` | function | Menus estaticos por role |
| `ROLE_ROUTES` | `menu-access-permissions.ts` | const | Rotas permitidas por role |
| `ROLE_DEFAULT_ROUTE` | `menu-access-permissions.ts` | const | Rota padrao por role |
| `canAccessRoute` | `menu-access-permissions.ts` | function | Verifica acesso a rota |
