# Gestao de Menus

Modulo CRUD de menus do sistema com listagem paginada, filtros, ordenacao por
colunas e acoes de lixeira (soft delete, restaurar, excluir permanente).
Restrito a roles MASTER e ADMINISTRATOR.

## Rota

`/menus` -- lista paginada com toggle de lixeira, busca por nome e ordenacao por
colunas (nome, slug, tipo, criado por, criado em).

## Arquivos

| Arquivo                     | Descricao                                                                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.tsx`                 | Route config: validacao de search params (page, perPage, search, trashed, order-\*), beforeLoad com guard de role, loader com `menuListOptions` |
| `index.lazy.tsx`            | Componente principal: header com TrashButton/FilterTrigger/botao criar, FilterSidebar, TableMenus e Pagination                                  |
| `-table-menus.tsx`          | Tabela DataTable com colunas (nome, slug, tipo, criado por, criado em, acoes), dropdown de acoes por linha                                      |
| `-table-menus-skeleton.tsx` | Skeleton de carregamento da tabela                                                                                                              |
| `-delete-dialog.tsx`        | Dialog de exclusao permanente -- `DELETE /menu/:id/permanent`, invalida `queryKeys.menus.all`                                                   |
| `-restore-dialog.tsx`       | Dialog de restauracao da lixeira -- `PATCH /menu/:id/restore`                                                                                   |
| `-send-to-trash-dialog.tsx` | Dialog de envio para lixeira -- `DELETE /menu/:id` (soft delete)                                                                                |
| `-separator-info.tsx`       | Banner informativo exibido quando o tipo do menu e SEPARATOR                                                                                    |

## Subdiretorios

| Diretorio  | Descricao                               |
| ---------- | --------------------------------------- |
| `create/`  | Formulario de criacao de novo menu      |
| `$menuId/` | Visualizacao e edicao de menu existente |

## Hooks e dependencias principais

- `menuListOptions` -- query options para listagem (de
  `@/hooks/tanstack-query/_query-options`)
- `useSuspenseQuery` -- carregamento de dados com Suspense
- `useDataTable` -- hook customizado para DataTable com persistencia de colunas
  (`persistKey: 'admin:menus'`)
- `useSidebar` -- controle do sidebar ao navegar
- `useMutation` -- usado nos dialogs de delete/restore/trash
- `queryKeys.menus.all` -- chave invalidada apos mutacoes

## Controle de acesso

O `beforeLoad` verifica o slug do grupo do usuario via `useAuthStore`. Se nao
for MASTER ou ADMINISTRATOR, redireciona para `/tables`.

## Tipos de menu

Mapeados em `E_MENU_ITEM_TYPE`: PAGE, TABLE, FORM, EXTERNAL, SEPARATOR.
