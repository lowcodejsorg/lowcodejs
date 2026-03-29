# Tree Editor

Editor hierarquico de arvore com drag-and-drop, edicao inline, selecao
simples/multipla e busca. Usado para gerenciar categorias e estruturas
hierarquicas.

## Arquivos

| Arquivo                  | Descricao                                                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `index.ts`               | Barrel de exports do modulo                                                                                             |
| `tree-list.tsx`          | Componente TreeList para exibicao/selecao de arvore com checkboxes, expand/collapse e selecao controlada/nao-controlada |
| `tree-node.tsx`          | TreeEditor principal com DndContext, SortableContext, modo drag, toolbar (adicionar/expandir/organizar)                 |
| `tree-node-item.tsx`     | Item de no com drag handle, edicao inline, acoes (editar/adicionar filho/excluir), indicadores visuais de drop          |
| `node.tsx`               | TreeNodeComponent para selecao/navegacao com suporte a creationMode (apenas expand, sem selecao)                        |
| `add-node-form.tsx`      | Formulario para adicionar novo no com label, selectable checkbox e ID gerado                                            |
| `inline-editor-form.tsx` | Formulario inline para edicao rapida de label com Enter/Escape                                                          |
| `tree-editor-header.tsx` | Header com titulo e botao de adicionar no raiz                                                                          |
| `use-tree-editor.tsx`    | Hook principal com CRUD de nos (add, update, remove, reorder) e estado de edicao                                        |
| `use-tree.tsx`           | Hook useTreeSelect para selecao/busca em arvore com flatten, filtro e expand                                            |

## Dependencias principais

- `@dnd-kit/core` e `@dnd-kit/sortable` para drag-and-drop com reordenacao
- Tipo `TreeNode` definido em `tree-list.tsx` (id, label, icon?, children?,
  selectable?, metadata?)

## Padroes importantes

- Tres modos de drop: `before` (acima), `after` (abaixo), `nest` (dentro) --
  detectados por posicao do cursor
- Deteccao de nest: cursor a direita de 55% da largura do alvo
- `useTreeEditor` gerencia estado completo: treeData, selectedNodeId,
  editingNodeId, showAddForm
- `useTreeSelect` gerencia busca com filtro hierarquico (mantem pais de nos
  encontrados)
- TreeList aceita modo controlado (via props selectedIds/expandedIds) ou
  nao-controlado (estado interno)
- `isDescendant` previne drop de no em seus proprios descendentes
- IDs gerados como numeros aleatorios de 6 digitos (generateId)
- creationMode em TreeNodeComponent desabilita selecao, permitindo apenas
  expand/collapse e acoes de CRUD
