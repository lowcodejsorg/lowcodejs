# 016 - Componentes Comuns

Documentacao dos componentes compartilhados localizados em `src/components/common/`. Esses componentes formam a base reutilizavel da interface do LowCodeJS, sendo consumidos por diversas paginas e funcionalidades do sistema.

---

## Visao Geral

O diretorio `src/components/common/` contem aproximadamente 53 arquivos organizados nas seguintes categorias:

| Categoria | Quantidade | Descricao |
|-----------|-----------|-----------|
| Layout | 6 | Header, Sidebar, Logo, Profile, LoginButton, InputSearch |
| Dados (Celulas de Tabela) | 11 | Renderizadores de celulas para diferentes tipos de campo |
| Dados (Combobox/Filtro) | 6 | TableCombobox, SheetFilter, Pagination, TableMultiSelect, TableStyleView |
| Formularios | 5 | FieldCombobox, GroupCombobox, MenuCombobox, PermissionMultiSelect, UserMultiSelect |
| Documento | 8 | DocumentMain, DocumentSidebar, DocumentToc, DocumentPdf, DocumentPrintButton, etc. |
| Arquivos | 3 | FileUpload, FileUploadWithStorage, UploadingContext |
| Utilidades | 6 | InputSearch, LoadError, AccessDenied, TrashButton, TreeList, TreeNode |
| Datepicker | 7 | Datepicker completo com calendario, dias, meses, anos, utilitarios |
| Editor | 3 | Editor TipTap (index, toolbar, bubble) |
| Tree Editor | 7 | Editor de arvore com formularios inline |
| TanStack Form | 1+ | Integracao com TanStack Form |

---

## Componentes de Layout

### Header

**Arquivo:** `src/components/common/header.tsx`

O componente `Header` renderiza a barra superior da aplicacao. Ele verifica a autenticacao do usuario e exibe condicionalmente o `SidebarTrigger`, a barra de busca e o perfil/botao de login.

```tsx
interface HeaderProps {
  routesWithoutSearchInput: Array<string | RegExp>;
}
```

**Comportamento:**
- Usa `useAuthenticationStore` para verificar se o usuario esta autenticado
- Recebe uma lista de rotas onde o campo de busca nao deve aparecer (suporta `string` e `RegExp`)
- Se autenticado: exibe `SidebarTrigger` + `InputSearch` + `Profile`
- Se nao autenticado: exibe `InputSearch` + `LoginButton`

```tsx
import { Header } from '@/components/common/header';

<Header routesWithoutSearchInput={['/kanban', /^\/forum/]} />
```

---

### Sidebar

**Arquivo:** `src/components/common/sidebar.tsx`

O componente `Sidebar` renderiza o menu lateral da aplicacao. Utiliza a biblioteca de UI `SidebarMenu` do shadcn/ui e suporta itens com sub-menus colapsaveis, links externos, badges e loading skeleton.

```tsx
interface SidebarProps {
  menu: MenuRoute;
}
```

**Funcionalidades:**
- Menu hierarquico com `Collapsible` para sub-itens
- Suporte a links internos (`Link` do TanStack Router) e externos (`<a>` com `target="_blank"`)
- Destaque visual do item ativo baseado em `location.pathname`
- Exibicao de `Badge` em itens do menu
- Loading skeleton enquanto os dados do menu estao sendo carregados (`isLoading`)
- Botao de logout com `useAuthenticationSignOut` e feedback via `toast`
- Logo dinamica carregada de `useSettingRead().LOGO_LARGE_URL`

```tsx
import { Sidebar } from '@/components/common/sidebar';

<Sidebar menu={menuRoutes} />
```

---

### Logo

**Arquivo:** `src/components/common/logo.tsx`

Componente SVG inline que renderiza o logotipo do LowCodeJS. Aceita todas as props padrao de `SVGProps` e aplica a classe `w-29.5 h-6` por padrao.

---

### Profile

**Arquivo:** `src/components/common/profile.tsx`

Dropdown de perfil do usuario que exibe avatar com iniciais, nome, e-mail, link para `/profile` e botao de logout.

```tsx
// Funcao auxiliar interna para gerar iniciais
const getInitials = (name: string): string => {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
};
```

**Funcionalidades:**
- Avatar com `AvatarFallback` mostrando as iniciais do usuario
- `DropdownMenu` com dados do perfil (`name`, `email`)
- Link para a pagina de perfil (`/profile`)
- Botao de logout com `Spinner` durante o processamento
- Tratamento de erros HTTP 401 e 500

---

## Componentes de Dados - Celulas de Tabela

Os componentes `TableRow*Cell` seguem um padrao consistente para renderizar valores de celulas em tabelas. Todos recebem as props `row: IRow` e `field: IField`.

### Padrao de Celula (Cell Renderer Pattern)

Cada celula segue a mesma interface basica:

```tsx
interface TableRow[Type]CellProps {
  row: IRow;
  field: IField;
  // props adicionais opcionais
}
```

O valor e acessado via `row[field.slug]` e renderizado conforme o tipo do campo.

---

### Tabela de Tipos de Celula

| Componente | Arquivo | Tipo de Campo | Descricao |
|-----------|---------|---------------|-----------|
| `TableRowTextShortCell` | `table-row-text-short-cell.tsx` | TEXT_SHORT | Texto curto com truncamento via `truncate` |
| `TableRowTextLongCell` | `table-row-text-long-cell.tsx` | TEXT_LONG | Texto longo; suporta `RICH_TEXT` com `dangerouslySetInnerHTML` |
| `TableRowDateCell` | `table-row-date-cell.tsx` | DATE | Formatacao com `date-fns` e locale `ptBR` |
| `TableRowDropdownCell` | `table-row-dropdown-cell.tsx` | DROPDOWN | Badges coloridas via `TableRowBadgeList` |
| `TableRowCategoryCell` | `table-row-category-cell.tsx` | CATEGORY | Badges via `getCategoryItem` |
| `TableRowUserCell` | `table-row-user-cell.tsx` | USER | Nomes de usuarios separados por virgula |
| `TableRowRelationshipCell` | `table-row-relationship-cell.tsx` | RELATIONSHIP | Badges com campo do relacionamento |
| `TableRowFileCell` | `table-row-file-cell.tsx` | FILE | Links para download; preview de imagens em modo galeria |
| `TableRowReactionCell` | `table-row-reaction-cell.tsx` | REACTION | Botoes de like/unlike com contadores |
| `TableRowEvaluationCell` | `table-row-evaluation-cell.tsx` | EVALUATION | Estrelas interativas (1-5) com media |
| `TableRowFieldGroupCell` | `table-row-field-group-cell.tsx` | FIELD_GROUP | Renderiza sub-campos do grupo recursivamente |

---

### Exemplo: TableRowDateCell

```tsx
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function TableRowDateCell({ field, row }: TableRowDateCellProps) {
  const value = row[field.slug];
  const dateFormat = field.format ?? 'dd/MM/yyyy';

  return (
    <p className="text-muted-foreground text-sm">
      {value ? format(value, dateFormat, { locale: ptBR }) : '-'}
    </p>
  );
}
```

---

### Exemplo: TableRowEvaluationCell

Celula interativa com sistema de avaliacao por estrelas:

```tsx
// Funcionalidades:
// - MAX_RATING = 5 estrelas
// - Hover para preview da nota
// - Clique para enviar avaliacao via API: POST /tables/{slug}/rows/{id}/evaluation
// - Exibe media das avaliacoes de todos os usuarios
// - Invalidacao automatica do cache via QueryClient
```

---

### TableRowBadgeList (Componente Auxiliar)

Componente generico para renderizar listas de badges coloridas. Usado internamente por `DropdownCell`, `CategoryCell` e `RelationshipCell`.

```tsx
interface TableRowBadgeListProps<T> {
  values: Array<T>;
  renderLabel: (value: T, index: number) => React.ReactNode;
  getKey?: (value: T, index: number) => string | number;
  getColor?: (value: T, index: number) => string | null | undefined;
}
```

Funcoes auxiliares exportadas:
- `hexToRgb(hex)` - Converte hexadecimal para RGB
- `badgeStyleFromColor(color)` - Gera estilo CSS para badge com cor de fundo translucida

---

## Componentes de Dados - Paginacao e Filtro

### Pagination

**Arquivo:** `src/components/common/pagination.tsx`

Componente de paginacao que sincroniza com os search params da URL via TanStack Router.

```tsx
interface Props {
  meta: Meta; // { page, perPage, lastPage }
}
```

**Funcionalidades:**
- Seletor de itens por pagina: 10, 20, 30, 40, 50
- Navegacao: primeira, anterior, proxima, ultima pagina
- Sincronizacao bidirecional com `useSearch` e `useNavigate`

---

### SheetFilter

**Arquivo:** `src/components/common/sheet-filter.tsx`

Painel lateral (Sheet) de filtros dinamicos baseados nos campos da tabela.

```tsx
interface SheetFilterProps {
  fields: Array<IField>;
}
```

**Tipos de filtro suportados:**

| Tipo de Campo | Componente de Filtro | Descricao |
|--------------|---------------------|-----------|
| TEXT_SHORT | `FilterTextShort` | Input de texto simples |
| TEXT_LONG | `FilterTextShort` | Input de texto (mesmo componente) |
| DROPDOWN | `FilterDropdown` | Select simples ou multi-select com Combobox |
| DATE | `FilterDate` | Datepicker com selecao de periodo |
| CATEGORY | `FilterCategory` | TreeList com selecao hierarquica |

**Funcionalidades:**
- Badge com contagem de filtros ativos
- Botao "Limpar" para remover todos os filtros
- Sincronizacao com search params da URL
- Botao de remocao individual por filtro (icone X)

---

## Componentes de Formulario

### FieldCombobox

**Arquivo:** `src/components/common/field-combobox.tsx`

Combobox para selecionar campos de uma tabela. Carrega os campos via `useReadTable`.

```tsx
interface FieldComboboxProps {
  value?: string;             // ID do campo selecionado
  onValueChange?: (value: string, slug?: string) => void;
  tableSlug: string;          // Slug da tabela
  placeholder?: string;
  disabled?: boolean;
}
```

---

### TableCombobox

**Arquivo:** `src/components/common/table-combobox.tsx`

Combobox para selecionar tabelas. Carrega via `useTablesReadPaginated`.

```tsx
interface TableComboboxProps {
  value?: string;             // ID da tabela selecionada
  onValueChange?: (value: string, slug?: string) => void;
  excludeSlug?: string;       // Slug para excluir da lista
}
```

---

### GroupCombobox

**Arquivo:** `src/components/common/group-combobox.tsx`

Combobox para selecionar grupos de usuarios. Carrega via `useGroupReadList` e aplica `USER_GROUP_MAPPER` para traduzir os nomes dos grupos.

---

## Componentes de Documento

### DocumentMain

**Arquivo:** `src/components/common/document-main.tsx`

Area principal de visualizacao de documentos. Renderiza uma lista de `DocumentRow` com suporte a indentacao, headings e filtros.

```tsx
interface DocumentMainProps {
  rows: Array<IRow>;
  total: number;
  filterLabel?: string | null;
  blocks: Array<DocBlock>;
  getIndentPx: (row: IRow) => number;
  getLeafLabel: (row: IRow) => string | null;
  getHeadingLevel: (row: IRow) => number;
  categorySlug: string;
}
```

---

### DocumentSidebar

**Arquivo:** `src/components/common/document-sidebar.tsx`

Sidebar de navegacao para documentos com arvore de categorias hierarquica. Suporta drag-and-drop para reordenacao via `@dnd-kit/core`.

**Funcionalidades:**
- Arvore colapsavel de categorias
- Edicao inline de labels
- Adicao de sub-categorias via dialog modal
- Drag-and-drop para reordenacao (modo nest e reorder)
- Integracao com API: `PUT /tables/{slug}/fields/{fieldId}` para persistir alteracoes

---

## Componentes de Arquivo

### FileUpload

**Arquivo:** `src/components/common/file-upload.tsx`

Sistema completo de upload de arquivos baseado em um store reativo com `useSyncExternalStore`. Segue o padrao de composicao do Radix UI.

**Sub-componentes exportados:**

| Componente | Descricao |
|-----------|-----------|
| `FileUpload` (Root) | Container principal com validacao e gerenciamento de estado |
| `FileUploadDropzone` | Area de drag-and-drop |
| `FileUploadTrigger` | Botao para abrir o file picker |
| `FileUploadList` | Lista de arquivos adicionados |
| `FileUploadItem` | Item individual na lista |
| `FileUploadItemPreview` | Preview do arquivo (imagem ou icone) |
| `FileUploadItemMetadata` | Nome e tamanho do arquivo |
| `FileUploadItemProgress` | Barra de progresso (linear, circular ou fill) |
| `FileUploadItemDelete` | Botao de remocao |
| `FileUploadClear` | Botao para limpar todos os arquivos |

```tsx
<FileUpload
  onUpload={async (files, { onProgress, onSuccess, onError }) => {
    // logica de upload
  }}
  accept="image/*,.pdf"
  maxFiles={5}
  maxSize={10 * 1024 * 1024}
>
  <FileUploadDropzone>
    <p>Arraste arquivos aqui</p>
    <FileUploadTrigger>Selecionar arquivos</FileUploadTrigger>
  </FileUploadDropzone>
  <FileUploadList>
    {/* items renderizados automaticamente */}
  </FileUploadList>
</FileUpload>
```

---

### UploadingContext

**Arquivo:** `src/components/common/uploading-context.tsx`

Context provider para rastrear uploads em andamento globalmente.

```tsx
// Provider
<UploadingProvider>
  {children}
</UploadingProvider>

// Hooks de consumo
const ctx = useUploadingContext();   // Contexto completo
const isUploading = useIsUploading(); // Boolean simples

// Registrar/desregistrar uploads
ctx.registerUpload('upload-1');
ctx.unregisterUpload('upload-1');
```

---

## Componentes de Utilidade

### InputSearch

**Arquivo:** `src/components/common/input-search.tsx`

Campo de busca global sincronizado com search params da URL. Suporta busca por Enter e botao de limpar.

---

### LoadError

**Arquivo:** `src/components/common/load-error.tsx`

Componente de estado vazio para erros de carregamento. Exibe icone, mensagem e botao "Tentar novamente".

```tsx
<LoadError
  message="Houve um problema ao carregar dados"
  refetch={() => queryClient.invalidateQueries()}
/>
```

---

### AccessDenied

**Arquivo:** `src/components/common/access-denied.tsx`

Pagina de acesso negado com icone `ShieldXIcon` e botao "Voltar".

---

### TrashButton

**Arquivo:** `src/components/common/trash-button.tsx`

Botao toggle para alternar entre a visualizacao normal e a lixeira. Sincroniza o parametro `trashed` nos search params da URL.

---

### TreeList / TreeNode

**Arquivo:** `src/components/common/-tree-list.tsx`

Componente de lista em arvore reutilizavel com suporte a selecao (single/multi), checkboxes, expansao/colapso e icones customizados.

```tsx
interface TreeNode {
  id: string;
  label: string;
  icon?: React.ReactNode;
  children?: Array<TreeNode>;
  selectable?: boolean;
  metadata?: any;
}

<TreeList
  data={treeData}
  selectedIds={['node-1']}
  onSelectionChange={(ids, nodes) => { /* ... */ }}
  multiSelect={true}
  showCheckboxes={true}
/>
```

---

## Tabela Completa de Componentes

| # | Arquivo | Componente Exportado | Categoria |
|---|---------|---------------------|-----------|
| 1 | `access-denied.tsx` | `AccessDenied` | Utilidade |
| 2 | `datepicker/index.tsx` | `Datepicker` | Datepicker |
| 3 | `datepicker/datepicker.tsx` | `Datepicker` (impl) | Datepicker |
| 4 | `datepicker/datepicker-calendar.tsx` | `DatepickerCalendar` | Datepicker |
| 5 | `datepicker/datepicker-days.tsx` | `DatepickerDays` | Datepicker |
| 6 | `datepicker/datepicker-months.tsx` | `DatepickerMonths` | Datepicker |
| 7 | `datepicker/datepicker-years.tsx` | `DatepickerYears` | Datepicker |
| 8 | `datepicker/datepicker-utils.ts` | Utilitarios | Datepicker |
| 9 | `document-heading-row.tsx` | `DocumentHeadingRow` | Documento |
| 10 | `document-main.tsx` | `DocumentMain` | Documento |
| 11 | `document-pdf.tsx` | `DocumentPdf` | Documento |
| 12 | `document-print-button.tsx` | `DocumentPrintButton` | Documento |
| 13 | `document-row.tsx` | `DocumentRow` | Documento |
| 14 | `document-sidebar-add-dialog.tsx` | `DocumentSidebarAddDialog` | Documento |
| 15 | `document-sidebar-helpers.ts` | Funcoes auxiliares DnD | Documento |
| 16 | `document-sidebar-tree.tsx` | `DocumentSidebarTree` | Documento |
| 17 | `document-sidebar.tsx` | `DocumentSidebar` | Documento |
| 18 | `document-toc.tsx` | `DocumentToc` | Documento |
| 19 | `editor/index.tsx` | `EditorExample` | Editor |
| 20 | `editor/toolbar.tsx` | `Toolbar` | Editor |
| 21 | `editor/buble.tsx` | `Bubble` | Editor |
| 22 | `field-combobox.tsx` | `FieldCombobox` | Formulario |
| 23 | `file-upload.tsx` | `FileUpload` + sub-componentes | Arquivo |
| 24 | `file-upload-with-storage.tsx` | `FileUploadWithStorage` | Arquivo |
| 25 | `group-combobox.tsx` | `GroupCombobox` | Formulario |
| 26 | `header.tsx` | `Header` | Layout |
| 27 | `input-search.tsx` | `InputSearch` | Utilidade |
| 28 | `load-error.tsx` | `LoadError` | Utilidade |
| 29 | `login-button.tsx` | `LoginButton` | Layout |
| 30 | `logo.tsx` | `Logo` | Layout |
| 31 | `menu-combobox.tsx` | `MenuCombobox` | Formulario |
| 32 | `pagination.tsx` | `Pagination` | Dados |
| 33 | `permission-multi-select.tsx` | `PermissionMultiSelect` | Formulario |
| 34 | `profile.tsx` | `Profile` | Layout |
| 35 | `sheet-filter.tsx` | `SheetFilter` | Dados |
| 36 | `sidebar.tsx` | `Sidebar` | Layout |
| 37 | `table-combobox.tsx` | `TableCombobox` | Dados |
| 38 | `table-combobox-filtered.tsx` | `TableComboboxFiltered` | Dados |
| 39 | `table-combobox-paginated.tsx` | `TableComboboxPaginated` | Dados |
| 40 | `table-multi-select.tsx` | `TableMultiSelect` | Dados |
| 41 | `table-row-badge-list.tsx` | `TableRowBadgeList` | Dados |
| 42 | `table-row-category-cell.tsx` | `TableRowCategoryCell` | Dados |
| 43 | `table-row-date-cell.tsx` | `TableRowDateCell` | Dados |
| 44 | `table-row-dropdown-cell.tsx` | `TableRowDropdownCell` | Dados |
| 45 | `table-row-evaluation-cell.tsx` | `TableRowEvaluationCell` | Dados |
| 46 | `table-row-field-group-cell.tsx` | `TableRowFieldGroupCell` | Dados |
| 47 | `table-row-file-cell.tsx` | `TableRowFileCell` | Dados |
| 48 | `table-row-reaction-cell.tsx` | `TableRowReactionCell` | Dados |
| 49 | `table-row-relationship-cell.tsx` | `TableRowRelationshipCell` | Dados |
| 50 | `table-row-text-long-cell.tsx` | `TableRowTextLongCell` | Dados |
| 51 | `table-row-text-short-cell.tsx` | `TableRowTextShortCell` | Dados |
| 52 | `table-row-user-cell.tsx` | `TableRowUserCell` | Dados |
| 53 | `table-style-view.tsx` | `TableStyleView` | Dados |
| 54 | `trash-button.tsx` | `TrashButton` | Utilidade |
| 55 | `-tree-editor/add-node-form.tsx` | `AddNodeForm` | Tree Editor |
| 56 | `-tree-editor/node.tsx` | `Node` | Tree Editor |
| 57 | `-tree-editor/use-tree.tsx` | `useTree` | Tree Editor |
| 58 | `-tree-editor/tree-node-item.tsx` | `TreeNodeItem` | Tree Editor |
| 59 | `-tree-editor/inline-editor-form.tsx` | `InlineEditorForm` | Tree Editor |
| 60 | `-tree-editor/use-tree-editor.tsx` | `useTreeEditor` | Tree Editor |
| 61 | `-tree-editor/tree-editor-header.tsx` | `TreeEditorHeader` | Tree Editor |
| 62 | `-tree-list.tsx` | `TreeList` | Utilidade |
| 63 | `-tree-node.tsx` | `TreeNode` | Utilidade |
| 64 | `uploading-context.tsx` | `UploadingProvider` | Arquivo |
| 65 | `user-multi-select.tsx` | `UserMultiSelect` | Formulario |
| 66 | `tanstack-form/` | Integracao TanStack Form | Formulario |
