# Gerenciamento de Grupos de Usuarios

CRUD de grupos de usuarios com listagem paginada, filtros e navegacao para
criacao/edicao.

## Rota

`/groups` -- lista paginada de grupos com filtro por nome e ordenacao por nome,
descricao e data de criacao.

## Controle de Acesso

Apenas usuarios com role **MASTER** ou **ADMINISTRATOR** podem acessar. O
`beforeLoad` verifica o slug do grupo no `useAuthStore` e redireciona para
`/tables` caso nao autorizado.

## Arquivos

| Arquivo                      | Descricao                                                                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `index.tsx`                  | Route config: validacao de search params (page, perPage, search, order-\*), beforeLoad com guard de role, loader com `groupListOptions` |
| `index.lazy.tsx`             | Componente principal: tabela de grupos, filtro lateral (FilterSidebar), paginacao, botao "Novo Grupo"                                   |
| `-table-groups.tsx`          | Componente de tabela usando DataTable com colunas nome e descricao, click na row navega para `$groupId`                                 |
| `-table-groups-skeleton.tsx` | Skeleton de loading para a tabela, usado como `pendingComponent`                                                                        |

## Subdiretorios

| Diretorio   | Descricao                                |
| ----------- | ---------------------------------------- |
| `create/`   | Formulario de criacao de novo grupo      |
| `$groupId/` | Visualizacao e edicao de grupo existente |

## Hooks Utilizados

| Hook                        | Origem                    | Uso                                                         |
| --------------------------- | ------------------------- | ----------------------------------------------------------- |
| `useSuspenseQuery`          | @tanstack/react-query     | Busca lista de grupos via `groupListOptions`                |
| `useDataTable`              | `@/hooks/use-data-table`  | Gerencia estado da tabela com persistencia (`admin:groups`) |
| `useSidebar`                | `@/components/ui/sidebar` | Controla abertura/fechamento do sidebar na navegacao        |
| `useNavigate` / `useRouter` | @tanstack/react-router    | Navegacao entre rotas                                       |

## Search Params

| Param               | Tipo     | Default |
| ------------------- | -------- | ------- |
| `page`              | number   | 1       |
| `perPage`           | number   | 50      |
| `search`            | string   | -       |
| `order-name`        | asc/desc | -       |
| `order-description` | asc/desc | -       |
| `order-created-at`  | asc/desc | -       |
