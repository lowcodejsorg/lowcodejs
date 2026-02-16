# 018 - Componentes Kanban

Documentacao dos componentes do quadro Kanban localizados em `src/components/kanban/`. O sistema Kanban permite visualizar e gerenciar registros de tabela em formato de quadro com colunas arrastáveis e cards interativos.

---

## Visao Geral

| Arquivo | Componente | Descricao |
|---------|-----------|-----------|
| `index.ts` | Re-exportacoes | Barrel file com exports publicos |
| `kanban-column.tsx` | `KanbanColumn` | Coluna arrastável com header editavel |
| `kanban-card.tsx` | `KanbanCard`, `KanbanSortableCard` | Card de registro com titulo, datas, membros, progresso |
| `kanban-unassigned-column.tsx` | `KanbanUnassignedColumn` | Coluna para cards sem lista atribuida |
| `kanban-add-list-dialog.tsx` | `KanbanAddListDialog` | Dialog para criar nova coluna |
| `kanban-create-card-dialog.tsx` | `KanbanCreateCardDialog` | Dialog para criar novo card |
| `kanban-row-dialog.tsx` | `KanbanRowDialog` | Dialog completo de detalhes do card |
| `kanban-row-description.tsx` | `KanbanRowDescriptionSection` | Secao de descricao do card |
| `kanban-row-comments.tsx` | `KanbanRowCommentsSection` | Secao de comentarios |
| `kanban-row-tasks.tsx` | `KanbanRowTasksSection` | Secao de tarefas (checklist) |
| `kanban-row-extra-fields.tsx` | `KanbanRowExtraFieldsSection` | Secao de campos adicionais |
| `kanban-row-quick-actions.tsx` | `KanbanRowQuickActions` | Acoes rapidas (membros, datas) |

---

## Integracao com @dnd-kit

O Kanban utiliza as bibliotecas `@dnd-kit/core` e `@dnd-kit/sortable` para drag-and-drop:

| Biblioteca | Uso |
|-----------|-----|
| `@dnd-kit/core` | `DndContext`, sensores, colisao |
| `@dnd-kit/sortable` | `useSortable` para colunas e cards |
| `@dnd-kit/utilities` | `CSS.Transform.toString` para estilos |

Cada elemento arrastavel possui `data.type` para diferenciar:
- `'column'` - Coluna do kanban
- `'card'` - Card dentro de uma coluna

---

## KanbanColumn

**Arquivo:** `src/components/kanban/kanban-column.tsx`

Coluna do kanban com suporte a drag-and-drop, edicao inline do nome e seletor de cor.

```tsx
interface KanbanColumnProps {
  option: { id: string; label: string; color?: string | null };
  count: number;
  children: React.ReactNode;
  editingColumnId: string | null;
  editingColumnLabel: string;
  editingColumnColor: string | null;
  onEditStart: (option: { id: string; label: string; color?: string | null }) => void;
  onEditChange: (value: string) => void;
  onEditColorChange: (value: string) => void;
  onEditCancel: () => void;
  onEditCommit: (optionId: string, nextLabel: string, nextColor: string | null) => void;
}
```

**Funcionalidades:**

- **Drag handle** - Icone `GripVerticalIcon` com `useSortable` listeners
- **Edicao inline** - Duplo clique no titulo ativa modo de edicao com input de texto + input de cor
- **Color picker** - Input `type="color"` para selecionar a cor da coluna
- **Badge de contagem** - Exibe o numero de cards na coluna
- **Estilo dinamico** - Aplica cor de fundo, header e scrollbar customizados via `columnStyleFromColor`
- **Scroll customizado** - CSS variables `--kanban-scroll-thumb` e `--kanban-scroll-thumb-hover`

```tsx
<KanbanColumn
  option={{ id: 'em-progresso', label: 'Em Progresso', color: '#3b82f6' }}
  count={5}
  editingColumnId={editingId}
  editingColumnLabel={editingLabel}
  editingColumnColor={editingColor}
  onEditStart={handleEditStart}
  onEditChange={handleEditChange}
  onEditColorChange={handleColorChange}
  onEditCancel={handleEditCancel}
  onEditCommit={handleEditCommit}
>
  {/* KanbanSortableCard items */}
</KanbanColumn>
```

**Comportamento de edicao:**
1. Duplo clique no label inicia a edicao
2. Input de texto + color picker sao exibidos
3. `onBlur` do input verifica se houve mudanca real
4. `Enter` salva, `Escape` cancela
5. Se nem label nem cor mudaram, cancela automaticamente

---

## KanbanCard e KanbanSortableCard

**Arquivo:** `src/components/kanban/kanban-card.tsx`

### KanbanCard

Card basico (sem drag-and-drop) que exibe as informacoes resumidas de um registro.

```tsx
interface KanbanCardProps {
  row: IRow;
  fields: FieldMap;
  onClick: () => void;
}
```

**Informacoes exibidas:**

| Dado | Origem | Exibicao |
|------|--------|---------|
| Titulo | `fields.title` | Texto com `line-clamp-2` |
| Data inicio | `fields.startDate` | `TableRowDateCell` |
| Data vencimento | `fields.dueDate` | `TableRowDateCell` |
| Membros | `fields.members` | Avatares empilhados (max 3 + "+N") |
| Progresso | `fields.progress` | Barra de progresso percentual |

```tsx
<KanbanCard
  row={rowData}
  fields={fieldMap}
  onClick={() => openRowDialog(rowData)}
/>
```

### KanbanSortableCard

Wrapper do `KanbanCard` com suporte a drag-and-drop via `useSortable`.

```tsx
interface KanbanSortableCardProps {
  row: IRow;
  fields: FieldMap;
  onClick: () => void;
  columnId: string;     // ID da coluna pai (para dados do dnd-kit)
}
```

O componente aplica `transform` e `transition` do `CSS.Transform` e adiciona `opacity-70` durante o arrasto.

---

## KanbanUnassignedColumn

**Arquivo:** `src/components/kanban/kanban-unassigned-column.tsx`

Coluna especial para registros que nao possuem lista atribuida. Nao possui suporte a drag-and-drop (nao e arrastavel).

```tsx
interface KanbanUnassignedColumnProps {
  rows: Array<IRow>;
  fields: FieldMap;
  onSelectRow: (row: IRow) => void;
}
```

- Retorna `null` se nao houver rows sem lista
- Header com titulo "Sem lista" e badge com contagem
- Renderiza `KanbanCard` simples (sem sortable)

---

## KanbanAddListDialog

**Arquivo:** `src/components/kanban/kanban-add-list-dialog.tsx`

Dialog para criar uma nova coluna (lista) no kanban.

```tsx
interface KanbanAddListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: any;              // TanStack Form instance
  isSubmitting: boolean;
}
```

**Campos do formulario:**

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `label` | `Input` (texto) | Nome da coluna |
| `color` | `input[type=color]` | Cor da coluna |

O formulario utiliza `useStore` do `@tanstack/react-store` para ler valores reativo do `form.store`.

```tsx
<KanbanAddListDialog
  open={isAddListOpen}
  onOpenChange={setIsAddListOpen}
  form={addListForm}
  isSubmitting={addListMutation.isPending}
/>
```

---

## KanbanRowDialog

**Arquivo:** `src/components/kanban/kanban-row-dialog.tsx`

Dialog completo para visualizacao e edicao de um card do kanban. E o componente mais complexo do sistema Kanban.

```tsx
interface KanbanRowDialogProps {
  row: IRow | null;
  onClose: () => void;
  onRowUpdated?: (row: IRow) => void;
  onRowDuplicated?: (row: IRow) => void;
  onRowDeleted?: (rowId: string) => void;
  tableSlug: string;
  table: ITable;
  fields: FieldMap;
}
```

### Layout

O dialog utiliza um grid de 2 colunas:
- **Coluna principal** (esquerda): Titulo, acoes rapidas, descricao, tarefas, anexos, comentarios, campos extras
- **Sidebar** (direita, 280px): Botoes de acao, lista, progresso, criador

### Secoes do Dialog

#### 1. Titulo
- Exibido como botao clicavel que ativa edicao inline
- Usa `extraForm.AppField` para renderizar o editor do campo

#### 2. Quick Actions (KanbanRowQuickActions)
- Edicao rapida de membros, data de inicio e data de vencimento
- Grid de 4 colunas com campos de usuario e data

#### 3. Descricao (KanbanRowDescriptionSection)
- Campo de texto longo/rich text
- Clique para editar com editor inline

#### 4. Tarefas (KanbanRowTasksSection)
- Checklist de tarefas com toggle de status (`sim`/`nao`)
- Adicao, edicao inline e exclusao de tarefas
- Calculo automatico do progresso via `getTaskCompletionPercent`

#### 5. Anexos
- Suporte a campos `FILE` e `FIELD_GROUP` com sub-campo FILE
- Preview de imagens (thumbnail), icone para PDFs
- Upload inline via `FileUploadWithStorage`
- Adicao e exclusao individual de anexos

#### 6. Comentarios (KanbanRowCommentsSection)
- Lista de comentarios com autor, data, texto
- Adicao, edicao inline e exclusao
- Normalizacao de payload do autor

#### 7. Campos Extras (KanbanRowExtraFieldsSection)
- Renderiza todos os campos da tabela que nao sao template do Kanban
- Cada campo pode ser editado inline (clique -> editor -> salvar)
- Suporta todos os tipos de campo: TEXT_SHORT, TEXT_LONG, DATE, DROPDOWN, FILE, RELATIONSHIP, CATEGORY, EVALUATION, REACTION, FIELD_GROUP, USER

### Sidebar de Acoes

| Botao | Descricao |
|-------|-----------|
| Membros | Abre edicao de membros |
| Data de inicio | Abre edicao de data |
| Data do vencimento | Abre edicao de data |
| Cancelar inscricao | Remove usuario atual dos membros (visivel se for membro) |
| Duplicar | Cria copia do card via `useCreateTableRow` |
| Excluir | Envia para lixeira via `useRowUpdateTrash` (visivel se for criador) |

### Hooks utilizados

| Hook | Uso |
|------|-----|
| `useUpdateTableRow` | Atualizar campos do card |
| `useCreateTableRow` | Duplicar card |
| `useRowUpdateTrash` | Excluir card (mover para lixeira) |
| `useProfileRead` | Obter dados do usuario atual |
| `useAppForm` | Formularios para quick actions e campos extras |

```tsx
<KanbanRowDialog
  row={selectedRow}
  onClose={() => setSelectedRow(null)}
  onRowUpdated={handleRowUpdated}
  onRowDuplicated={handleRowDuplicated}
  onRowDeleted={handleRowDeleted}
  tableSlug="projetos"
  table={tableData}
  fields={fieldMap}
/>
```

---

## FieldMap (Tipos)

O tipo `FieldMap` define o mapeamento de campos especiais do Kanban:

```tsx
// Definido em src/lib/kanban-types.ts
interface FieldMap {
  title?: IField;
  description?: IField;
  list?: IField;
  startDate?: IField;
  dueDate?: IField;
  members?: IField;
  progress?: IField;
  tasks?: IField;
  comments?: IField;
  attachments?: IField;
}
```

---

## Helpers do Kanban

Funcoes utilitarias em `src/lib/kanban-helpers.ts`:

| Funcao | Descricao |
|--------|-----------|
| `getTitleValue(row, field)` | Extrai o titulo do card |
| `getProgressValue(row, field)` | Extrai o valor de progresso |
| `getMembersFromRow(row, field)` | Extrai a lista de membros |
| `getUserInitials(member)` | Gera iniciais do nome do usuario |
| `getTaskCompletionPercent(tasks)` | Calcula porcentagem de tarefas concluidas |
| `buildDefaultValuesFromRow(row, fields)` | Constroi valores padrao para formularios |
| `buildPayloadFromRow(row, fields)` | Constroi payload para duplicacao |
| `normalizeRowValue(value)` | Normaliza valores para array |
| `normalizeIdList(value)` | Normaliza listas de IDs |
| `columnStyleFromColor(color)` | Gera estilo CSS para coluna colorida |
| `columnHeaderStyleFromColor(color)` | Gera estilo CSS para header de coluna |

---

## Fluxo de Drag-and-Drop

```
1. Usuario arrasta coluna/card (GripVerticalIcon ou card inteiro)
2. @dnd-kit detecta via PointerSensor
3. useSortable fornece transform/transition
4. CSS.Transform.toString aplica estilos visuais
5. onDragEnd identifica tipo ('column' ou 'card') via data
6. Se coluna: reordena colunas no dropdown do campo
7. Se card: move card entre colunas ou reordena dentro da mesma
8. API e chamada para persistir a mudanca
```

---

## Exports Publicos (index.ts)

```tsx
export { KanbanAddListDialog } from './kanban-add-list-dialog';
export { KanbanCard, KanbanSortableCard } from './kanban-card';
export { KanbanColumn } from './kanban-column';
export { KanbanCreateCardDialog } from './kanban-create-card-dialog';
export { KanbanRowDialog } from './kanban-row-dialog';
export { KanbanUnassignedColumn } from './kanban-unassigned-column';
```
