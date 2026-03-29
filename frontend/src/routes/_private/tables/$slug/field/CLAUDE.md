# Gerenciamento de Campos

Rotas para criar, editar e gerenciar campos de uma tabela. Suporta campos
normais e campos dentro de grupos.

## Rotas

| Rota                             | Descricao                          |
| -------------------------------- | ---------------------------------- |
| `/tables/:slug/field/management` | Reordenar, ativar/desativar campos |
| `/tables/:slug/field/create`     | Criar novo campo                   |
| `/tables/:slug/field/:fieldId`   | Visualizar/editar campo existente  |

## Arquivos Raiz

| Arquivo               | Tipo       | Descricao                                                                                          |
| --------------------- | ---------- | -------------------------------------------------------------------------------------------------- |
| `management.tsx`      | Loader     | Carrega `tableDetailOptions`                                                                       |
| `management.lazy.tsx` | Componente | Interface de gerenciamento usando `FieldManagement` compound component + `useTableFieldManagement` |

## Subdiretorios

| Diretorio   | Rota                           | Descricao                      |
| ----------- | ------------------------------ | ------------------------------ |
| `create/`   | `/tables/:slug/field/create`   | Formulario de criacao de campo |
| `$fieldId/` | `/tables/:slug/field/:fieldId` | Visualizacao e edicao de campo |

## Contexto de Grupo

- Search param `?group=groupSlug` indica que o campo pertence a um grupo
- Quando em contexto de grupo, tipos FIELD_GROUP, REACTION e EVALUATION sao
  bloqueados
- Usa hooks distintos: `useFieldCreate`/`useGroupFieldCreate`,
  `useFieldRead`/`useGroupFieldUpdate`

## Permissoes

- `CREATE_FIELD` para criacao
- `UPDATE_FIELD` para edicao e gerenciamento
