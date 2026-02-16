# Layout Privado (`/_private`)

Documentacao do layout principal das rotas privadas do LowCodeJS, responsavel por montar a estrutura visual autenticada com sidebar dinamica, header global e controle de acesso.

**Arquivo fonte:** `frontend/src/routes/_private/layout.tsx`

---

## Visao Geral

O layout privado (`/_private`) e o componente raiz para todas as rotas que exigem autenticacao. Ele encapsula:

- **Sidebar** dinamica com menus baseados no papel (role) do usuario
- **Header** global com busca condicional
- **Outlet** do TanStack Router para renderizar as rotas filhas

A rota e registrada usando `createFileRoute('/_private')` do TanStack Router.

---

## Guarda de Autenticacao

O componente verifica se o usuario esta autenticado acessando o store de autenticacao:

```tsx
const authentication = useAuthenticationStore().authenticated;
const isAuthenticated = Boolean(authentication?.role);
```

A sidebar so e renderizada se o usuario estiver autenticado:

```tsx
{isAuthenticated && <Sidebar menu={menu} />}
```

Se `authentication?.role` for `undefined` ou `null`, o `isAuthenticated` sera `false` e a sidebar nao aparece. O redirecionamento para login e tratado em outra camada (provavelmente no `__root.tsx` ou middleware do router).

---

## Construcao Dinamica da Sidebar

A sidebar e construida combinando **menus estaticos** (baseados no role) com **menus dinamicos** (vindos da API).

### Hook `useMenuDynamic`

```tsx
const { menu } = useMenuDynamic(authentication?.role ?? E_ROLE.REGISTERED);
```

O hook `useMenuDynamic` (definido em `src/hooks/tanstack-query/use-menu-dynamic.tsx`) executa as seguintes etapas:

1. **Busca menus dinamicos** da API via `useMenuReadList()`
2. **Constroi arvore hierarquica** com `buildMenuTree()` (mapeia `parent` para montar a hierarquia)
3. **Converte para formato `MenuRoute`** com `convertToMenuRoute()`
4. **Obtem menus estaticos** via `getStaticMenusByRole(role)` que retorna `{ before, after }`
5. **Combina tudo**: `[...staticMenusBefore, ...dynamicMenuRoute, ...staticMenusAfter]`

### Mapeamento de Icones por Tipo de Menu

| Tipo de Menu | Icone           |
|-------------|-----------------|
| `TABLE`     | `TableIcon`     |
| `PAGE`      | `FileTextIcon`  |
| `FORM`      | `PlusCircleIcon`|
| `EXTERNAL`  | `ExternalLinkIcon` |
| Fallback    | `LayoutListIcon`|

---

## Menus Estaticos por Role (`getStaticMenusByRole`)

A funcao `getStaticMenusByRole` (em `src/lib/menu/menu.ts`) retorna menus diferentes com base no papel do usuario:

| Role            | Menus do Sistema                                              | Menus da Conta |
|----------------|---------------------------------------------------------------|----------------|
| `MASTER`       | Tabelas, Configuracoes, Menus, Grupos, Usuarios, Ferramentas | Perfil         |
| `ADMINISTRATOR`| Tabelas, Menus, Usuarios                                     | Perfil         |
| `MANAGER`      | Tabelas                                                       | Perfil         |
| `REGISTERED`   | Tabelas                                                       | Perfil         |

### Exemplo para o role `MASTER`

```tsx
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
          { title: 'Ferramentas', url: '/tools', icon: WrenchIcon },
        ],
      },
      {
        title: 'Conta',
        items: [{ title: 'Perfil', url: '/profile', icon: UserIcon }],
      },
    ],
  };
```

---

## Header Global com Busca Condicional

O `Header` recebe uma lista de rotas onde o campo de busca **nao** deve ser exibido:

```tsx
const routesWithoutSearchInput: Array<string | RegExp> = [
  '/',
  '/dashboard',
  /^\/groups\/.+$/,
  '/groups/create',
  /^\/menus\/.+$/,
  '/menus/create',
  /^\/pages\/.+$/,
  '/profile',
  '/settings',
  /^\/tables\/[^/]+\/field\/.+$/,
  /^\/tables\/[^/]+\/field\/create$/,
  /^\/tables\/[^/]+\/row\/.+$/,
  /^\/tables\/[^/]+\/row\/create$/,
  /^\/tables\/[^/]+\/detail$/,
  /^\/tables\/[^/]+\/methods$/,
  /^\/users\/.+$/,
  '/users/create',
  '/tools',
];
```

### Logica de Ocultacao da Busca

| Rota                          | Busca Visivel? |
|-------------------------------|---------------|
| `/users`                      | Sim           |
| `/users/create`               | Nao           |
| `/users/abc123`               | Nao           |
| `/groups`                     | Sim           |
| `/groups/create`              | Nao           |
| `/tables`                     | Sim           |
| `/tables/xyz/field/create`    | Nao           |
| `/dashboard`                  | Nao           |
| `/profile`                    | Nao           |
| `/settings`                   | Nao           |

As rotas podem ser `string` (comparacao exata) ou `RegExp` (match por padrao), permitindo ocultar a busca em rotas dinamicas como `/users/$userId`.

---

## Estrutura do Layout

O layout utiliza o sistema de `SidebarProvider` com `SidebarInset`:

```tsx
<SidebarProvider>
  {isAuthenticated && <Sidebar menu={menu} />}
  <SidebarInset className="relative flex flex-col h-screen w-screen overflow-hidden flex-1 px-4 sm:px-2">
    <Header routesWithoutSearchInput={routesWithoutSearchInput} />
    <Outlet />
  </SidebarInset>
</SidebarProvider>
```

| Componente       | Responsabilidade                                      |
|-----------------|------------------------------------------------------|
| `SidebarProvider`| Contexto global para estado da sidebar (aberta/fechada) |
| `Sidebar`       | Navegacao lateral com menus estaticos + dinamicos      |
| `SidebarInset`  | Area principal de conteudo (ocupa o espaco restante)   |
| `Header`        | Barra superior com breadcrumbs e busca condicional     |
| `Outlet`        | Renderiza a rota filha ativa                          |

---

## Dependencias Externas

| Dependencia                  | Uso                                    |
|-----------------------------|----------------------------------------|
| `@tanstack/react-router`   | Roteamento (createFileRoute, Outlet)   |
| `useAuthenticationStore`    | Zustand store para dados de autenticacao |
| `useMenuDynamic`            | Hook para combinar menus estaticos e dinamicos |
| `E_ROLE`                    | Enum de roles (MASTER, ADMINISTRATOR, MANAGER, REGISTERED) |
| `SidebarProvider/SidebarInset` | Componentes UI do sistema de sidebar |

---

## Fluxo Resumido

1. O usuario acessa uma rota `/_private/*`
2. O layout verifica `authentication?.role` no store
3. Se autenticado, chama `useMenuDynamic(role)` para obter os menus
4. O hook busca menus dinamicos da API e combina com menus estaticos do role
5. A sidebar e renderizada com os menus combinados
6. O header e renderizado com controle condicional da busca
7. A rota filha e renderizada no `<Outlet />`
