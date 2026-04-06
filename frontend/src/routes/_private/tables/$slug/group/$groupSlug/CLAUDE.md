# tables/$slug/group/$groupSlug — Gerenciamento de Campos de Grupo

Rota para gerenciar os campos dentro de um grupo específico (campo do tipo
`FIELD_GROUP`) de uma tabela dinâmica.

## Rota

`/tables/:slug/group/:groupSlug/field/management`

## Arquivos

| Arquivo                     | Descrição                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------ |
| `field/management.tsx`      | Route config: `pendingComponent` com `FieldManagementSkeleton`, loader carrega `tableDetailOptions`   |
| `field/management.lazy.tsx` | Componente: verifica permissão `UPDATE_FIELD`, localiza o grupo pelo `groupSlug`, renderiza `FieldManagement` |

## Comportamento

- Verifica permissão `UPDATE_FIELD` — exibe `<AccessDenied>` se não autorizado
- Localiza o grupo correto dentro de `table.data.groups` pelo `groupSlug`
- Usa `useGroupFieldManagement` (escopo do grupo específico) em vez de
  `useTableFieldManagement` (escopo da tabela inteira)
- Header dinâmico: "Gerenciar campos — {groupName}"
- Botão de voltar navega para `/tables/:slug` e abre a sidebar de gerenciamento

## Diferença de Scope

| Hook                         | Escopo                                      |
| ---------------------------- | ------------------------------------------- |
| `useTableFieldManagement`    | Todos os campos da tabela                   |
| `useGroupFieldManagement`    | Campos dentro de um FIELD_GROUP específico  |
