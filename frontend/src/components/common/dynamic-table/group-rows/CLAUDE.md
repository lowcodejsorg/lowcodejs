# Group Rows

Gerenciamento de itens dentro de grupos de campos aninhados (field groups).
Fornece CRUD completo com data table, formulario em Sheet e dialog de exclusao.

## Arquivos

| Arquivo                       | Componente             | Descricao                                                                                                                                                                                                                                                                                                               |
| ----------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group-rows-data-table.tsx`   | `GroupRowsDataTable`   | Tabela HTML com listagem de itens do grupo. Busca dados via `groupRowListOptions` (useQuery). Renderiza celulas com `RenderGroupCell` por tipo de campo. Botoes de editar/excluir por linha. Controla abertura de `GroupRowFormDialog` e `GroupRowDeleteDialog`.                                                        |
| `group-row-form-dialog.tsx`   | `GroupRowFormDialog`   | Sheet lateral (right) para criar/editar item de grupo. Usa `useAppForm` com `defaultValues` derivados de `transformFieldValueForEdit`. Persiste via `useCreateGroupRow` / `useUpdateGroupRow`. Renderiza campos dinamicamente com `renderGroupFormField` por tipo. Integra `UploadingProvider` para controle de upload. |
| `group-row-delete-dialog.tsx` | `GroupRowDeleteDialog` | Dialog de confirmacao de exclusao. Usa `useDeleteGroupRow`.                                                                                                                                                                                                                                                             |
| `index.ts`                    | -                      | Barrel export                                                                                                                                                                                                                                                                                                           |

## Fluxo de dados

1. `GroupRowsDataTable` busca itens do grupo via API
2. Click em "Adicionar" ou em uma linha abre `GroupRowFormDialog`
3. Formulario renderiza campos baseado em `group.fields` (filtra trashed e
   native)
4. Submit converte valores para payload via `buildGroupRowPayload`
5. Exclusao abre `GroupRowDeleteDialog` com confirmacao

## Tipos de campo suportados no formulario

TEXT_SHORT, TEXT_LONG (plain e RICH_TEXT), DROPDOWN, DATE, FILE, RELATIONSHIP,
CATEGORY, USER

## Dependencias internas

- `../table-cells/` - componentes de celula para renderizacao na tabela
- `@/hooks/tanstack-query/use-group-row-*` - hooks de CRUD
- `@/integrations/tanstack-form/form-hook` - `useAppForm`
- `@/lib/table` - `buildFieldValidator`
