# Gerenciamento de Campos do Grupo

Interface para reordenar, ativar/desativar campos dentro de um grupo especifico.

## Rota

| Rota                                              | Descricao                 |
| ------------------------------------------------- | ------------------------- |
| `/tables/:slug/group/:groupSlug/field/management` | Gerenciar campos do grupo |

## Arquivos

| Arquivo               | Tipo       | Descricao                                                              |
| --------------------- | ---------- | ---------------------------------------------------------------------- |
| `management.tsx`      | Loader     | Carrega `tableDetailOptions`                                           |
| `management.lazy.tsx` | Componente | Usa `FieldManagement` compound component com `useGroupFieldManagement` |

## Fluxo

1. Verifica permissao `UPDATE_FIELD`
2. Busca grupo pelo slug nos dados da tabela (`table.data.groups`)
3. Exibe titulo dinamico "Gerenciar campos - {nomeDoGrupo}"
4. Usa `FieldManagement.Root`, `FieldManagement.Header` e `FieldManagement.Tabs`
5. Botao voltar retorna para `/tables/:slug`

## Diferenca do Gerenciamento de Campos da Tabela

- Usa `useGroupFieldManagement(table.data, groupSlug)` em vez de
  `useTableFieldManagement(table.data)`
- Escopo limitado aos campos do grupo especifico
- Mesma interface visual (compound component `FieldManagement`)
