# Gerenciamento de Usuarios

Modulo CRUD de usuarios com listagem paginada, filtros e ordenacao por colunas.

## Rota

- Path: `/users`
- Acesso restrito: roles `MASTER` e `ADMINISTRATOR` (redirecionamento para
  `/tables` caso contrario)
- Titulo SEO: "Usuarios"

## Arquivos

| Arquivo                     | Descricao                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `index.tsx`                 | Definicao da rota: beforeLoad (guard de role), validateSearch (paginacao + ordenacao), loader via `userListOptions` |
| `index.lazy.tsx`            | Componente principal: tabela de usuarios, filtros laterais, paginacao, botao "Novo Usuario"                         |
| `-table-users.tsx`          | Tabela DataTable com colunas: Nome, E-mail, Grupo, Status, Acoes. Click na linha navega para `/users/$userId`       |
| `-table-users-skeleton.tsx` | Skeleton de carregamento da tabela (pendingComponent)                                                               |

## Subdiretorios

| Diretorio  | Descricao                               |
| ---------- | --------------------------------------- |
| `create/`  | Formulario de criacao de usuario        |
| `$userId/` | Visualizacao e edicao de usuario por ID |

## Hooks e dependencias principais

| Hook/Funcao                       | Origem                                  |
| --------------------------------- | --------------------------------------- |
| `userListOptions`                 | `@/hooks/tanstack-query/_query-options` |
| `useSuspenseQuery`                | `@tanstack/react-query`                 |
| `useDataTable`                    | `@/hooks/use-data-table`                |
| `useSidebar`                      | `@/components/ui/sidebar`               |
| `useAuthStore`                    | `@/stores/authentication`               |
| `FilterSidebar` / `FilterTrigger` | `@/components/common/filters`           |
| `Pagination`                      | `@/components/common/pagination`        |

## Search params (validacao Zod)

| Param                                                                          | Tipo                       |
| ------------------------------------------------------------------------------ | -------------------------- |
| `search`                                                                       | string (opcional)          |
| `page`                                                                         | number (default 1)         |
| `perPage`                                                                      | number (default 50)        |
| `order-name`, `order-email`, `order-group`, `order-status`, `order-created-at` | "asc" ou "desc" (opcional) |
