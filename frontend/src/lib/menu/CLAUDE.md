# Sistema de Menus e Autorizacao de Rotas (RBAC)

Modulo responsavel pela definicao de menus estaticos por role, tipagem de itens
de menu e controle de acesso a rotas baseado em papeis (RBAC).

## Arquivos

| Arquivo                      | Descricao                                                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `menu.ts`                    | `getStaticMenusByRole` retorna menus estaticos (before/after) por role, usando icones Lucide                    |
| `menu-route.ts`              | Tipos TypeScript para estrutura de menus: `MenuItem`, `MenuGroupItem`, `MenuRoute`                              |
| `menu-access-permissions.ts` | Mapa de rotas permitidas por role (`ROLE_ROUTES`), rota padrao (`ROLE_DEFAULT_ROUTE`) e funcao `canAccessRoute` |

## Estrutura de Menus por Role

| Role          | Menus Disponiveis                                                    |
| ------------- | -------------------------------------------------------------------- |
| MASTER        | Tabelas, Configuracoes, Menus, Grupos, Usuarios, Ferramentas, Perfil |
| ADMINISTRATOR | Tabelas, Menus, Usuarios, Perfil                                     |
| MANAGER       | Tabelas, Perfil                                                      |
| REGISTERED    | Tabelas, Perfil                                                      |

Todos os menus sao retornados na propriedade `after`. A propriedade `before`
esta vazia para todos os roles e e reservada para menus dinamicos carregados do
backend.

## Controle de Acesso a Rotas

- `ROLE_ROUTES` mapeia cada role para um array de rotas permitidas (usa tipagem
  `LinkProps['to']` do TanStack Router)
- `ROLE_DEFAULT_ROUTE` define a rota padrao apos login (todas apontam para
  `/tables`)
- `canAccessRoute(role, route)` verifica se um role pode acessar uma rota,
  suportando parametros dinamicos (ex: `/users/$userId` corresponde a
  `/users/123`)
- A funcao `matchRoute` compara segmentos da URL, tratando segmentos com prefixo
  `$` como parametros dinamicos

## Menus Dinamicos

Os menus seguem o padrao `{ before: MenuRoute, after: MenuRoute }`. O array
`before` e reservado para menus dinamicos criados pelo usuario no sistema
(gerenciados via `/menus`). Os menus estaticos ficam em `after`. A composicao
final e `[...before, ...after]`.
