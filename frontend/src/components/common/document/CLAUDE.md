# Document

Componentes para visualizacao de documentos estruturados por categorias
hierarquicas, com sidebar de navegacao, sumario, impressao e exportacao PDF.

## Arquivos

| Arquivo                           | Descricao                                                                                                             |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `index.ts`                        | Barrel de exports do modulo                                                                                           |
| `document-main.tsx`               | Area principal que renderiza lista de rows com headings agrupados por categoria                                       |
| `document-sidebar.tsx`            | Sidebar com arvore de categorias, drag-and-drop (dnd-kit), edicao inline e CRUD de secoes via API                     |
| `document-sidebar-tree.tsx`       | Arvore recursiva sortable com SortableContext, suporte a expand/collapse e edicao inline                              |
| `document-sidebar-add-dialog.tsx` | Dialog para adicionar nova secao (categoria) usando TanStack Form                                                     |
| `document-sidebar-helpers.ts`     | Funcoes utilitarias para arvore: buildParentMap, getAncestors, reorderInTree, insertNodeAt, isDescendant, getDropMode |
| `document-row.tsx`                | Renderiza um registro do documento com heading, blocos de conteudo e campos extras colapsaveis                        |
| `document-heading-row.tsx`        | Componente de heading dinamico (h2-h6) com icone e acoes opcionais                                                    |
| `document-toc.tsx`                | Sumario (table of contents) com links para ancoras, visivel apenas na impressao (print-only)                          |
| `document-pdf.tsx`                | Gera documento PDF com react-pdf (Document/Page/View/Text), inclui TOC e blocos de conteudo                           |
| `document-print-button.tsx`       | Botao de impressao posicionado no canto superior direito                                                              |

## Dependencias principais

- `@dnd-kit/core` e `@dnd-kit/sortable` para drag-and-drop na sidebar
- `@react-pdf/renderer` e `react-pdf-html` para geracao de PDF
- `@tanstack/react-query` para mutations de CRUD de categorias
- `@tanstack/react-router` para navegacao e parametros de rota
- Tipos `CatNode`, `DocBlock`, `IRow`, `IField` de `@/lib/document-helpers` e
  `@/lib/interfaces`

## Padroes importantes

- A sidebar usa `DndContext` com deteccao de `closestCenter` e tres modos de
  drop: `before`, `after`, `nest`
- Edicao inline de labels com double-click e persistencia otimista (reverte em
  caso de erro)
- O campo de categoria deve ser do tipo `E_FIELD_TYPE.CATEGORY` para habilitar
  gerenciamento
- Permissoes verificadas via `useTablePermission` (`UPDATE_FIELD`, `CREATE_ROW`,
  `UPDATE_ROW`)
- Headings agrupados por `leafId` -- mostra heading somente quando muda de
  categoria entre rows consecutivas
- CSS class `no-print` usada para ocultar elementos na impressao; `print-only`
  para elementos exclusivos de impressao
