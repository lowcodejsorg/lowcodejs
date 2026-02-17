# 017 - Editores

Documentacao dos componentes de edicao do LowCodeJS: o editor de codigo Monaco, o editor de texto rico TipTap, o datepicker e o editor de arvore.

---

## Visao Geral

| Editor | Diretorio | Tecnologia | Uso Principal |
|--------|-----------|------------|---------------|
| Code Editor | `src/components/code-editor/` | Monaco Editor | Hooks JavaScript (onLoad, beforeSave, afterSave) |
| Rich Text Editor | `src/components/common/editor/` | TipTap + reactjs-tiptap-editor | Campos TEXT_LONG com formato RICH_TEXT |
| Datepicker | `src/components/common/datepicker/` | Implementacao custom | Selecao de data/periodo |
| Tree Editor | `src/components/common/-tree-editor/` | React + custom hooks | Edicao de estruturas hierarquicas (categorias) |

---

## Monaco Code Editor

### Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `code-editor.tsx` | Componente principal do editor |
| `use-monaco-types.ts` | Hook para injetar tipos TypeScript no IntelliSense |
| `field-type-mapper.ts` | Mapeamento de tipos de campo para tipos TypeScript |
| `sandbox-types.ts` | Declaracoes de tipos estaticas da API sandbox |
| `tutorial-content.ts` | Conteudo dos tutoriais para cada tipo de hook |
| `code-editor-info-modal.tsx` | Modal de informacoes/tutorial do editor |

---

### CodeEditor (Componente Principal)

**Arquivo:** `src/components/code-editor/code-editor.tsx`

```tsx
interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;        // default: 'Editor JavaScript'
  table?: ITable;        // Tabela para IntelliSense dinamico
  hook?: HookType;       // 'onLoad' | 'beforeSave' | 'afterSave'
  readOnly?: boolean;    // default: false
  height?: string;       // default: '300px'
}
```

**Funcionalidades:**
- Editor Monaco com linguagem `javascript`
- Template IIFE padrao quando o valor esta vazio
- IntelliSense dinamico baseado nos campos da tabela
- Modal de tutorial com documentacao da API
- Opcoes de editor otimizadas (minimap desabilitado, word wrap, auto-close brackets)

```tsx
import { CodeEditor } from '@/components/code-editor/code-editor';

<CodeEditor
  value={hookCode}
  onChange={setHookCode}
  table={currentTable}
  hook="beforeSave"
  height="400px"
/>
```

**Template IIFE padrao:**

```javascript
(async () => {
  // Escreva seu codigo aqui
  // Use await para operacoes assincronas (email.send, email.sendTemplate)
  // Exemplo: field.set('status', 'aprovado');
})();
```

---

### useMonacoTypes (Hook de IntelliSense)

**Arquivo:** `src/components/code-editor/use-monaco-types.ts`

Hook que injeta declaracoes TypeScript no Monaco para fornecer IntelliSense completo.

```tsx
useMonacoTypes(monaco: Monaco | null, table?: ITable): void
```

**O que o hook faz:**

1. **Configura o compilador TypeScript** - ES2020, ESNext modules, com verificacao de tipos habilitada
2. **Injeta tipos estaticos** - API `field`, `context`, `email`, `utils` e builtins do JavaScript
3. **Injeta tipos dinamicos** - Overloads tipados para `field.get()` e `field.set()` baseados nos campos da tabela
4. **Registra completion provider** - Autocompletar slugs dos campos dentro de `field.get('...')` e `field.set('...')`

```tsx
// Exemplo de tipo dinamico gerado para uma tabela com campo "titulo" (TEXT_SHORT):
interface FieldApiDynamic {
  get(slug: 'titulo'): string;
  set(slug: 'titulo', value: string): void;
  getAll(): Record<string, any>;
}
```

**Opcoes do editor (`getMonacoEditorOptions`):**

| Opcao | Valor | Descricao |
|-------|-------|-----------|
| `minimap.enabled` | `false` | Minimap desabilitado |
| `fontSize` | `14` | Tamanho da fonte |
| `wordWrap` | `'on'` | Quebra de linha automatica |
| `tabSize` | `2` | Indentacao com 2 espacos |
| `formatOnPaste` | `true` | Formatar ao colar |
| `autoClosingBrackets` | `'always'` | Fechar colchetes automaticamente |
| `folding` | `true` | Code folding habilitado |
| `suggestOnTriggerCharacters` | `true` | Sugestoes em caracteres trigger |

---

### field-type-mapper.ts

Mapeamento de `E_FIELD_TYPE` para tipos TypeScript usados no IntelliSense:

| Tipo de Campo | Tipo TypeScript |
|---------------|----------------|
| `TEXT_SHORT` | `string` |
| `TEXT_LONG` | `string` |
| `DROPDOWN` | `string[]` |
| `CATEGORY` | `string[]` |
| `DATE` | `string \| Date` |
| `RELATIONSHIP` | `string` |
| `FILE` | `string` |
| `USER` | `string` |
| `FIELD_GROUP` | `Record<string, any>[]` |
| `REACTION` | `string[]` |
| `EVALUATION` | `number[]` |

**Funcoes exportadas:**

```tsx
// Obter tipo TS de um campo
getFieldTsType(field: IField): string

// Normalizar slug (hifens para underscores)
normalizeSlug(slug: string): string

// Gerar overloads field.get() para todos os campos
generateFieldGetOverloads(fields: Array<IField>, tableSlug: string): string

// Gerar overloads field.set() para todos os campos
generateFieldSetOverloads(fields: Array<IField>, tableSlug: string): string

// Gerar union type de slugs
generateFieldSlugsType(fields: Array<IField>): string

// Gerar todas as declaracoes dinamicas
generateDynamicTypes(fields: Array<IField>, tableSlug: string): string
```

---

### sandbox-types.ts (API Sandbox)

Declaracoes de tipo TypeScript para a API disponivel no sandbox de execucao de hooks:

| API | Metodos | Descricao |
|-----|---------|-----------|
| `field` | `get(slug)`, `set(slug, value)`, `getAll()` | Manipulacao de campos |
| `context` | `action`, `moment`, `userId`, `isNew`, `table` | Contexto de execucao (readonly) |
| `email` | `send(to, subject, body)`, `sendTemplate(to, subject, message, data?)` | Envio de e-mails |
| `utils` | `today()`, `now()`, `formatDate(date, format?)`, `sha256(text)`, `uuid()` | Utilitarios |

---

### tutorial-content.ts

Conteudo de tutorial organizado por tipo de hook:

| Hook | Titulo | Quando executa |
|------|--------|----------------|
| `onLoad` | Carregamento de Formulario | Ao carregar registro para edicao |
| `beforeSave` | Antes de Salvar | Antes de persistir (pode bloquear) |
| `afterSave` | Apos Salvar | Depois de salvar com sucesso |

```tsx
type HookType = 'onLoad' | 'beforeSave' | 'afterSave';

// Obter tutorial por hook
getTutorialContent(hook: HookType): TutorialContent

// Obter documentacao geral da API
getApiDocumentation(): Array<TutorialSection>
```

---

### CodeEditorInfoModal

**Arquivo:** `src/components/code-editor/code-editor-info-modal.tsx`

Modal com 3 abas de documentacao:

| Aba | Conteudo |
|-----|---------|
| **API** | Documentacao das APIs `field`, `context`, `email`, `utils` |
| **Exemplos** | Exemplos especificos do tipo de hook selecionado |
| **Campos** | Lista dos campos da tabela atual com seus slugs e tipos |

---

## TipTap Rich Text Editor

### Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `editor/index.tsx` | Componente principal `EditorExample` |
| `editor/toolbar.tsx` | Barra de ferramentas (default e minimal) |
| `editor/buble.tsx` | Menus bubble contextuais |

---

### EditorExample (Componente Principal)

**Arquivo:** `src/components/common/editor/index.tsx`

```tsx
interface EditorExampleProps {
  value?: string;                          // HTML controlado
  onChange?: (value: string) => void;      // Callback de mudanca
  variant?: 'default' | 'compact';        // Layout
  className?: string;
  toolbarVariant?: 'default' | 'minimal'; // Tipo de toolbar
  showBubble?: boolean;                   // Exibir menus bubble
  autoFocus?: boolean;
  focusKey?: string | number;             // Key para forcar re-focus
}
```

**Extensoes carregadas:**

O editor utiliza a biblioteca `reactjs-tiptap-editor` com as seguintes extensoes:

| Extensao | Funcionalidade |
|----------|---------------|
| History | Desfazer/refazer |
| SearchAndReplace | Buscar e substituir |
| Bold, Italic, Strike, TextUnderline | Formatacao basica |
| Heading, FontFamily, FontSize | Tipografia |
| Color, Highlight | Cores de texto e destaque |
| BulletList, OrderedList, TaskList | Listas |
| TextAlign, Indent, LineHeight | Alinhamento e espacamento |
| Link, Image, Video | Midia |
| Blockquote, HorizontalRule | Blocos |
| Table | Tabelas |
| Column, MultipleColumnNode | Colunas |
| Emoji | Emojis |
| Iframe | Conteudo incorporado |
| Attachment | Anexos |
| Mention | Mencoes de usuario |
| SlashCommand | Comandos com "/" |
| Placeholder | Texto placeholder |

**Configuracao:**
- Locale definido como `pt_BR`
- Debounce de 300ms no `onUpdate` para performance
- Suporte a conteudo controlado e nao-controlado
- `focusKey` para forcar atualizacao de conteudo sem perder o foco

```tsx
import { EditorExample } from '@/components/common/editor';

// Uso basico controlado
<EditorExample
  value={htmlContent}
  onChange={setHtmlContent}
/>

// Uso compacto (para forum/composer)
<EditorExample
  value={composerText}
  onChange={onTextChange}
  variant="compact"
  toolbarVariant="minimal"
  showBubble={false}
  autoFocus
/>
```

---

### Toolbar

**Arquivo:** `src/components/common/editor/toolbar.tsx`

Duas variantes de toolbar:

**`default`** - Toolbar completa com todos os controles:
- Historico, busca, limpar formatacao
- Fonte, heading, tamanho
- Negrito, italico, sublinhado, tachado, marcas adicionais
- Emoji, cor, destaque
- Listas, alinhamento, indentacao, altura da linha
- Link, imagem, video
- Citacao, linha horizontal, colunas, tabela
- Iframe, exportar PDF, direcao do texto, anexo

**`minimal`** - Toolbar reduzida para uso em contextos compactos:
- Desfazer/refazer
- Negrito, italico, sublinhado
- Listas (bullets e ordenada)
- Link, emoji

---

### Bubble

**Arquivo:** `src/components/common/editor/buble.tsx`

Menus contextuais (bubble) que aparecem ao selecionar ou interagir com elementos especificos:

| Bubble | Contexto |
|--------|---------|
| `RichTextBubbleColumns` | Colunas |
| `RichTextBubbleIframe` | Iframes |
| `RichTextBubbleKatex` | Formulas matematicas |
| `RichTextBubbleLink` | Links |
| `RichTextBubbleImage` | Imagens |
| `RichTextBubbleVideo` | Videos |
| `RichTextBubbleMermaid` | Diagramas Mermaid |
| `RichTextBubbleTable` | Tabelas |
| `RichTextBubbleText` | Texto selecionado |

---

## Datepicker

### Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `datepicker/index.tsx` | Re-exportacao do componente e tipos |
| `datepicker/datepicker.tsx` | Componente principal com input + popover |
| `datepicker/datepicker-calendar.tsx` | Componente de calendario |
| `datepicker/datepicker-days.tsx` | Grid de dias do mes |
| `datepicker/datepicker-months.tsx` | Seletor de mes |
| `datepicker/datepicker-years.tsx` | Seletor de ano |
| `datepicker/datepicker-utils.ts` | Funcoes de formatacao e parsing |

---

### Datepicker (Componente Principal)

**Arquivo:** `src/components/common/datepicker/datepicker.tsx`

```tsx
export interface DatepickerValue {
  startDate: Date | null;
  endDate: Date | null;
}

export interface DatepickerProps {
  value: DatepickerValue | null;
  onChange: (value: DatepickerValue | null) => void;
  displayFormat?: string;   // default: 'dd/MM/yyyy'
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  minDate?: Date | null;
  maxDate?: Date | null;
  useRange?: boolean;       // true = 2 calendarios, false = 1 (default: true)
  asSingle?: boolean;       // true = data unica, false = periodo (default: false)
  separator?: string;       // separador no input (default: '~')
}
```

**Modos de operacao:**

| `asSingle` | `useRange` | Comportamento |
|------------|-----------|---------------|
| `true` | qualquer | Selecao de data unica |
| `false` | `true` | Selecao de periodo com 2 calendarios lado a lado |
| `false` | `false` | Selecao de periodo com 1 calendario |

**Funcionalidades:**
- Mascara de input automatica (`dd/MM/yyyy` ou `dd/MM/yyyy ~ dd/MM/yyyy`)
- Parsing bidirecional (input -> calendario e calendario -> input)
- Hover preview no modo range (destaque visual do periodo durante selecao)
- Botao de limpar data
- Calendario popup via `Popover`
- Navegacao de mes com setas

```tsx
import { Datepicker } from '@/components/common/datepicker';

// Data unica
<Datepicker
  value={dateValue}
  onChange={setDateValue}
  asSingle={true}
  useRange={false}
/>

// Periodo
<Datepicker
  value={rangeValue}
  onChange={setRangeValue}
  asSingle={false}
  useRange={true}
  placeholder="Selecione o periodo"
/>
```

---

## Tree Editor

### Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `-tree-editor/use-tree-editor.tsx` | Hook principal com logica de CRUD |
| `-tree-editor/use-tree.tsx` | Hook auxiliar para operacoes de arvore |
| `-tree-editor/add-node-form.tsx` | Formulario para adicionar novo no |
| `-tree-editor/node.tsx` | Componente de no individual |
| `-tree-editor/tree-node-item.tsx` | Item renderizavel do no |
| `-tree-editor/inline-editor-form.tsx` | Formulario de edicao inline |
| `-tree-editor/tree-editor-header.tsx` | Cabecalho do editor de arvore |

---

### useTreeEditor (Hook Principal)

**Arquivo:** `src/components/common/-tree-editor/use-tree-editor.tsx`

```tsx
const useTreeEditor = (
  initialData: Array<TreeNode> = [],
  onChange?: (data: Array<TreeNode>) => void,
) => {
  // Retorna:
  return {
    treeData,                // Estado atual da arvore
    selectedNodeId,          // ID do no selecionado
    editingNodeId,           // ID do no em edicao
    showAddForm,             // Exibir formulario de adicao
    addFormType,             // 'root' | 'child'
    setSelectedNodeId,       // Selecionar no
    generateId,              // Gerar ID aleatorio de 6 digitos
    findNodeById,            // Buscar no por ID
    handleAddRootNode,       // Iniciar adicao na raiz
    handleAddChildNode,      // Iniciar adicao como filho do selecionado
    handleSaveNewNode,       // Salvar novo no
    handleCancelAdd,         // Cancelar adicao
    handleEditNode,          // Iniciar edicao de no
    handleSaveEdit,          // Salvar edicao
    handleCancelEdit,        // Cancelar edicao
    handleDeleteNode,        // Excluir no selecionado
    handleReorder,           // Reordenar arvore
  };
};
```

**Operacoes suportadas:**

| Operacao | Metodo | Descricao |
|----------|--------|-----------|
| Adicionar raiz | `handleAddRootNode()` + `handleSaveNewNode(data)` | Adiciona no no nivel raiz |
| Adicionar filho | `handleAddChildNode()` + `handleSaveNewNode(data)` | Adiciona filho do no selecionado |
| Editar | `handleEditNode(id)` + `handleSaveEdit(id, label)` | Edicao inline do label |
| Excluir | `handleDeleteNode()` | Remove no selecionado e seus filhos |
| Reordenar | `handleReorder(updatedData)` | Atualiza a arvore completa |

```tsx
import { useTreeEditor } from '@/components/common/-tree-editor/use-tree-editor';

const editor = useTreeEditor(initialCategories, (updatedData) => {
  // Callback chamado em cada alteracao
  saveCategoriesToAPI(updatedData);
});
```

Cada no possui a seguinte estrutura:

```tsx
interface NodeFormData {
  id: string;
  label: string;
  selectable: boolean;
}
```
