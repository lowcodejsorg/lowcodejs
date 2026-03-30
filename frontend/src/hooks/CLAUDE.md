# Hooks

Custom React hooks divididos em hooks de dominio (raiz) e hooks de API
(`tanstack-query/`).

## Estrutura

Hooks na raiz encapsulam logica de UI, estado local e composicao de outros
hooks. Hooks em `tanstack-query/` encapsulam chamadas HTTP via TanStack Query.

## Hooks de dominio (raiz)

| Hook                         | Arquivo                            | Descricao                                                                                                                                                                                |
| ---------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useDataTable`               | `use-data-table.ts`                | Configura `useReactTable` com estado persistido (visibilidade, ordem, sizing, selecao). Modo manual para sorting/filtering/pagination.                                                   |
| `usePersistedTableState`     | `use-persisted-table-state.ts`     | Persiste columnVisibility, columnOrder e columnSizing no localStorage com debounce de 300ms. Prefixo `dt:`.                                                                              |
| `useFieldColumns`            | `use-field-columns.tsx`            | Gera `ColumnDef[]` dinamicamente a partir de `IField[]`, mapeando cada `field.type` para o cell component correto via switch.                                                            |
| `useTableFieldManagement`    | `use-table-field-management.ts`    | Acoes de gerenciamento de campos de tabela: toggle visibilidade, alterar largura, reordenar, excluir e editar. Usa `useMutation` com cache manual.                                       |
| `useGroupFieldManagement`    | `use-group-field-management.ts`    | Mesmo que `useTableFieldManagement`, mas para campos dentro de grupos de campos (field groups).                                                                                          |
| `useTablePermission`         | `use-table-permission.ts`          | Verifica permissoes de tabela baseado em papel (MASTER/ADMIN), ownership, visibilidade da tabela e permissoes do grupo do usuario. Exporta tambem `usePermission` para acoes sem tabela. |
| `useTableKeyboardNavigation` | `use-table-keyboard-navigation.ts` | Navegacao por teclado (arrow keys, Enter, Space, Home/End/Escape) em tabelas com role grid.                                                                                              |
| `useChatSocket`              | `use-chat-socket.ts`               | Conexao Socket.IO para chat com IA. Gerencia mensagens, tool activities, status e invalidacao de queries apos tool results que modificam dados.                                          |
| `useChatSidebar`             | `use-chat-sidebar.ts`              | Controle de estado aberto/fechado do sidebar de chat, persistido no localStorage.                                                                                                        |
| `useFilterSidebar`           | `use-filter-sidebar.ts`            | Controle de estado aberto/fechado do sidebar de filtros, persistido no localStorage.                                                                                                     |
| `useToolbarPortal`           | `use-toolbar-portal.ts`            | Referencia de portal para renderizar controles de toolbar (DataTableColumnToggle) no header via createPortal.                                                                            |
| `useDebouncedValue`          | `use-debounced-value.tsx`          | Debounce generico de valor com delay configuravel via `setTimeout`.                                                                                                                      |
| `useIsMobile`                | `use-mobile.ts`                    | Detecta viewport mobile (< 768px) via `matchMedia`.                                                                                                                                      |

## Subdiretorios

| Diretorio         | Descricao                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------- |
| `tanstack-query/` | Hooks de API usando TanStack Query (queries e mutations). Ver `tanstack-query/CLAUDE.md`. |

## Convencoes

- **Nomenclatura**: `use-{dominio}-{acao}.ts` ou `.tsx` quando ha JSX
- **Retorno tipado**: todos os hooks declaram tipo de retorno explicito
  (interface ou inline)
- **Sem ternarios**: preferir if/else ou funcoes separadas para logica
  condicional
- **Composicao**: hooks de dominio compoe hooks menores (ex: `useDataTable` usa
  `usePersistedTableState`)
- **Cache manual**: hooks de field management usam `queryClient.setQueryData`
  para atualizar cache sem refetch
- **Estado local**: hooks de UI usam `useState` + `useMemo`/`useCallback` para
  performance
