# Visualizacoes de Tabela

Este documento detalha os 7 modos de visualizacao de tabela suportados pelo sistema, suas funcionalidades especificas e comparacoes entre eles.

**Diretorio base:** `frontend/src/routes/_private/tables/$slug/`

---

## Visao Geral

O sistema suporta 7 estilos de visualizacao, definidos pelo enum `E_TABLE_STYLE`:

```typescript
export const E_TABLE_STYLE = {
  LIST: 'LIST',
  GALLERY: 'GALLERY',
  DOCUMENT: 'DOCUMENT',
  CARD: 'CARD',
  MOSAIC: 'MOSAIC',
  KANBAN: 'KANBAN',
  FORUM: 'FORUM',
} as const;
```

O componente principal (`tables/$slug/index.tsx`) seleciona a visualizacao com base no `table.data.style`.

---

## Tabela Comparativa

| Caracteristica           | LIST | GALLERY | CARD | MOSAIC | DOCUMENT | KANBAN | FORUM |
|--------------------------|------|---------|------|--------|----------|--------|-------|
| Paginacao                | Sim  | Sim     | Sim  | Sim    | Nao      | Nao    | Nao   |
| Ordenacao por coluna     | Sim  | Nao     | Nao  | Nao    | Nao      | Nao    | Nao   |
| Selecao em massa         | Sim  | Nao     | Nao  | Nao    | Nao      | Nao    | Nao   |
| Drag and drop            | Nao  | Nao     | Nao  | Nao    | Nao      | Sim    | Nao   |
| Thumbnail de imagem      | Nao  | Sim     | Sim  | Sim    | Nao      | Sim    | Nao   |
| Exportacao PDF           | Nao  | Nao     | Nao  | Nao    | Sim      | Nao    | Nao   |
| Sidebar de categorias    | Nao  | Nao     | Nao  | Nao    | Sim      | Nao    | Nao   |
| Canais/Mensagens         | Nao  | Nao     | Nao  | Nao    | Nao      | Nao    | Sim   |
| Colunas gerenciaveis     | Nao  | Nao     | Nao  | Nao    | Nao      | Sim    | Nao   |
| Criacao inline (+Card)   | Nao  | Sim     | Nao  | Nao    | Nao      | Sim    | Nao   |
| perPage fixo em 100      | Nao  | Nao     | Nao  | Nao    | Sim      | Sim    | Sim   |

---

## LIST - Visualizacao de Lista

**Arquivo:** `-table-list-view.tsx`

Visualizacao tabular classica com linhas e colunas. A mais completa em termos de funcionalidades de dados.

### Props

```typescript
interface TableListViewProps {
  data: Array<IRow>;
  headers: Array<IField>;
  order: Array<string>;
}
```

### Filtragem e Ordenacao de Colunas

Os cabecalhos sao filtrados e ordenados por duas funcoes:

```typescript
function HeaderFilter(field: IField): boolean {
  return field.showInList && !field.trashed;
}

function HeaderSorter(order: Array<string>) {
  return function (a: IField, b: IField): number {
    return order.indexOf(a._id) - order.indexOf(b._id);
  };
}
```

### Ordenacao por Coluna

Cada cabecalho possui um dropdown para ordenacao via search params:

```typescript
const orderKey = 'order-'.concat(field.slug);
// Navega com: ?order-nome=asc ou ?order-nome=desc
```

Icones indicam o estado atual: `ArrowUpIcon` (asc), `ArrowDownIcon` (desc) ou `ChevronsLeftRightIcon` (sem ordenacao).

### Selecao com Checkbox

- Checkbox no cabecalho: selecionar/desselecionar todos os registros visiveis
- Checkbox por linha: selecionar/desselecionar registro individual
- Suporta estado "indeterminate" quando apenas alguns estao selecionados

### Navegacao

- Clicar em um cabecalho de campo navega para `/tables/$slug/field/$fieldId` (requer `UPDATE_FIELD`)
- Clicar em uma linha navega para `/tables/$slug/row/$rowId`
- Botao "+" no cabecalho navega para `/tables/$slug/field/create` (requer `CREATE_FIELD`)

### Operacoes em Massa

Barra flutuante na parte inferior com:
- Contagem de selecionados
- "Enviar para lixeira" (via `bulk-trash`) ou "Restaurar" (via `bulk-restore`)
- Dialog de confirmacao antes da acao

---

## GALLERY - Visualizacao em Grid

**Arquivo:** `-table-grid-view.tsx`

Layout em grade de cartoes com thumbnail de imagem.

### Layout Responsivo

```html
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
```

### Estrutura do Cartao

1. **Thumbnail** - Primeira campo do tipo `FILE` encontrado; exibido em area de aspecto 4:3
2. **Conteudo** - Campos restantes em grid de 2 colunas com label e valor
3. **Footer** - Botao "Ver detalhes" que navega para o registro

### Cartao de Criacao

Card com borda tracejada e icone "+Registro" para criacao rapida (requer `CREATE_ROW`):

```typescript
{canCreateRow &&
  (table.data?.fields?.filter((f) => !f.native)?.length ?? 0) > 0 && (
    <Card className="overflow-hidden border-dashed flex items-center justify-center min-h-32">
      <Button variant="ghost" className="flex flex-col gap-2 h-full w-full">
        <PlusIcon className="size-8 text-muted-foreground" />
        <span className="text-muted-foreground">Registro</span>
      </Button>
    </Card>
  )}
```

### Selecao de Thumbnail

O primeiro campo do tipo `FILE` visivel e usado como thumbnail. Os demais campos FILE sao exibidos normalmente no grid.

---

## CARD - Visualizacao em Cartao

**Arquivo:** `-table-card-view.tsx`

Layout horizontal com imagem a esquerda e conteudo a direita. Ideal para dados com titulo, descricao e imagem.

### Estrutura do Cartao

```
+------------------+--------------------------------------------+
|                  | Titulo (primeiro TEXT_SHORT)                |
|   Imagem 200px   | Descricao (primeiro TEXT_LONG)              |
|   aspect 4:3     |                                            |
|                  | Campo Extra 1    | Campo Extra 2            |
|                  | Campo Extra 3    | Campo Extra 4            |
+------------------+--------------------------------------------+
```

### Selecao Automatica de Campos

```typescript
const thumbField = visibleHeaders.find((f) => f.type === 'FILE');
const titleField = visibleHeaders.find((f) => f.type === 'TEXT_SHORT');
const descField = visibleHeaders.find((f) => f.type === 'TEXT_LONG');

const used = new Set(
  [thumbField?._id, titleField?._id, descField?._id].filter(Boolean)
);
const extraFields = visibleHeaders.filter((f) => !used.has(f._id));
```

- **Thumbnail**: Primeiro campo `FILE`
- **Titulo**: Primeiro campo `TEXT_SHORT`
- **Descricao**: Primeiro campo `TEXT_LONG`
- **Campos extras**: Todos os demais, exibidos em grid de 2 colunas

---

## MOSAIC - Visualizacao em Mosaico

**Arquivo:** `-table-mosaic-view.tsx`

Layout estilo Pinterest/Masonry usando CSS columns. Cada cartao ocupa espaco proporcional ao seu conteudo.

### Layout CSS Columns

```html
<div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 p-4">
  {data.map((row) => (
    <div className="break-inside-avoid mb-4">
      <!-- conteudo do cartao -->
    </div>
  ))}
</div>
```

### Colunas Responsivas

| Breakpoint | Colunas |
|------------|---------|
| Default    | 1       |
| `sm`       | 2       |
| `md`       | 3       |
| `lg`       | 4       |

### Estrutura

Similar ao CARD, com thumbnail (primeiro `FILE`), titulo (primeiro `TEXT_SHORT`), descricao (primeiro `TEXT_LONG`) e campos extras. A diferenca esta no layout em cascata onde cada item pode ter altura diferente.

---

## DOCUMENT - Visualizacao de Documento

**Arquivo:** `-table-document-view.tsx`

Visualizacao especializada para conteudo tipo documento, com navegacao por categorias, tabela de conteudo (ToC) e exportacao para PDF.

### Componentes Principais

1. **Sidebar de categorias** - Arvore hierarquica para navegacao
2. **Tabela de conteudo (ToC)** - Links internos para secoes
3. **Area de conteudo** - Registros organizados por categoria
4. **Exportacao PDF** - Geracao de PDF via `@react-pdf/renderer`

### Sidebar de Categorias

Arvore de navegacao baseada nos campos do tipo `CATEGORY` da tabela. Permite filtrar registros por categoria selecionada.

### Tabela de Conteudo

Gerada automaticamente a partir dos registros e suas categorias, com niveis de heading baseados na profundidade da categoria na arvore.

### Exportacao PDF

Utiliza `@react-pdf/renderer` para gerar documento PDF com os registros da tabela. O PDF mantem a estrutura de categorias e formatacao.

### Comportamento Especial

- Paginacao desabilitada (perPage fixo em 100)
- Ordenacao e filtragem baseadas em categorias

---

## KANBAN - Visualizacao Kanban

**Arquivo:** `-table-kanban-view.tsx`

Quadro Kanban completo com drag-and-drop para gerenciamento visual de registros.

### Dependencias Principais

- `@dnd-kit/core` - DndContext, DragOverlay
- `@dnd-kit/sortable` - SortableContext, useSortable
- `@dnd-kit/utilities` - CSS transform utilities

### Mapeamento de Campos

O Kanban mapeia campos da tabela para funcionalidades especificas do cartao:

| Funcionalidade     | Campo Mapeado                              |
|--------------------|--------------------------------------------|
| Titulo             | `title` (TEXT_SHORT)                       |
| Descricao          | `description` (TEXT_LONG)                  |
| Membros            | `members` (USER)                           |
| Data de inicio     | `startDate` (DATE)                         |
| Data limite        | `dueDate` (DATE)                           |
| Progresso          | `progress` (TEXT_SHORT)                    |
| Lista/Coluna       | `list` (DROPDOWN)                          |
| Anexos             | `attachments` (FILE)                       |
| Tarefas            | `tasks` (FIELD_GROUP)                      |
| Comentarios        | `comments` (TEXT_LONG)                     |

### Gerenciamento de Colunas

- **Adicionar coluna** - Cria nova opcao no campo DROPDOWN do tipo `list`
- **Editar coluna** - Altera label e cor da opcao
- **Reordenar colunas** - Drag-and-drop entre colunas
- **Coluna "Sem lista"** - Registros sem valor no campo `list`

### Criacao de Campos Automatica

O Kanban cria automaticamente o campo "Data de inicio" se nao existir na tabela.

### Drag and Drop

- Arrastar cartoes entre colunas altera o valor do campo `list`
- Arrastar cartoes dentro da coluna altera a ordem (campo `order`)
- Campo `order` e auto-criado se nao existir
- `DragOverlay` exibe preview do cartao sendo arrastado

### Comportamento Especial

- Paginacao desabilitada (perPage fixo em 100)
- Cartao com preview de anexos
- Suporte a upload de arquivos diretamente no cartao

---

## FORUM - Visualizacao de Forum

**Arquivo:** `-table-forum-view.tsx`

Visualizacao tipo forum/chat com canais, mensagens, reacoes e compartilhamento de arquivos.

### Estrutura da Interface

```
+------------------+------------------------------------------+
|                  |  #canal-1  | Mensagens | Documentos       |
|  Canais          |------------------------------------------+
|                  |  Mensagem 1 (autor, data, conteudo)       |
|  #geral          |  Mensagem 2 (com reacoes)                 |
|  #privado        |  Mensagem 3 (com arquivo anexo)           |
|  + Criar canal   |                                           |
|                  |------------------------------------------+
|                  |  [Compositor de mensagem]                 |
+------------------+------------------------------------------+
```

### Sidebar de Canais

- Lista de canais publicos e privados
- Canais privados com controle de acesso (membro ou criador)
- Botao de criacao de novo canal
- Indicador de canal ativo

### Area de Mensagens

- Lista de mensagens com scroll automatico
- Autor, data e conteudo de cada mensagem
- Suporte a reacoes com emoji
- Visualizacao de arquivos anexados
- Mentions de usuarios

### Abas

| Aba            | Descricao                           |
|----------------|--------------------------------------|
| **Mensagens**  | Lista de mensagens do canal          |
| **Documentos** | Arquivos compartilhados no canal     |

### Compositor de Mensagens

Editor rico para composicao de mensagens com:
- Formatacao de texto
- Anexo de arquivos
- Mencoes de usuarios (@usuario)

### Sincronizacao em Tempo Real

Utiliza estrategia de polling com intervalo de 5 segundos:

- Polling de canais (lista completa)
- Polling de mensagens do canal ativo

### Canais Privados

Canais privados possuem controle de acesso baseado em:
- Criador do canal
- Membros adicionados ao canal

### CRUD de Canais e Mensagens

- **Canal**: Criar, editar, deletar via endpoints dedicados
- **Mensagem**: Criar, editar, deletar via endpoints dedicados

### Comportamento Especial

- Paginacao desabilitada (perPage fixo em 100)
- Scroll automatico para ultima mensagem
- Indicador de novas mensagens

---

## Utilitarios Compartilhados

### HeaderFilter e HeaderSorter

Funcoes reutilizadas por GALLERY, CARD e MOSAIC (importadas de `@/lib/layout-pickers`):

```typescript
// layout-pickers.ts
export function HeaderFilter(field: IField): boolean {
  return field.showInList && !field.trashed;
}

export function HeaderSorter(order: Array<string>) {
  return function (a: IField, b: IField): number {
    return order.indexOf(a._id) - order.indexOf(b._id);
  };
}
```

A visualizacao LIST define suas proprias versoes locais destas funcoes.

### RenderCell / RenderGridCell / RenderCardCell

Cada visualizacao possui seu proprio componente de renderizacao de celula, que mapeia o tipo do campo para o componente de exibicao correto. Todos utilizam os mesmos cell renderers base:

- `TableRowTextShortCell`
- `TableRowTextLongCell`
- `TableRowDateCell`
- `TableRowDropdownCell`
- `TableRowFileCell` (com props `isGallery` e `isCardOrMosaic`)
- `TableRowRelationshipCell`
- `TableRowCategoryCell`
- `TableRowEvaluationCell`
- `TableRowReactionCell`
- `TableRowFieldGroupCell`
- `TableRowUserCell`

---

## Skeletons de Carregamento

Cada visualizacao possui seu proprio componente skeleton para exibir durante o carregamento:

| Visualizacao | Skeleton                      |
|-------------|-------------------------------|
| LIST        | `TableListViewSkeleton`       |
| GALLERY     | `TableGridViewSkeleton`       |
| CARD        | `TableCardViewSkeleton`       |
| MOSAIC      | `TableMosaicViewSkeleton`     |
| DOCUMENT    | `TableDocumentViewSkeleton`   |
| KANBAN      | `TableKanbanViewSkeleton`     |
| FORUM       | `TableForumViewSkeleton`      |

O skeleton e exibido quando `table.status === 'success'` e `rows.status === 'pending'`, ou seja, quando a tabela ja foi carregada mas os registros ainda estao sendo buscados.
