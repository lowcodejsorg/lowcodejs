# Utilitarios

Documentacao completa das funcoes utilitarias do frontend LowCodeJS, incluindo helpers para tabelas, estilos, documentos, forum e kanban.

**Arquivos-fonte:**
- `src/lib/utils.ts` -- Utilitario de classes CSS
- `src/lib/table.ts` -- Helpers de tabela (filtro, ordenacao, default values, payload)
- `src/lib/table-style.ts` -- Deteccao de templates e estilos permitidos
- `src/lib/layout-pickers.ts` -- Helpers para layout de documento
- `src/lib/document-helpers.ts` -- Helpers para template de documento (identico a forum-helpers)
- `src/lib/forum-helpers.ts` -- Helpers para template de forum
- `src/lib/kanban-helpers.ts` -- Helpers para template kanban
- `src/lib/kanban-types.ts` -- Tipos para kanban

---

## 1. cn() -- Utilitario de Classes CSS

**Arquivo:** `src/lib/utils.ts`

Combina `clsx` com `tailwind-merge` para gerar strings de classe CSS sem conflitos.

```typescript
import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: Array<ClassValue>): string {
  return twMerge(clsx(inputs));
}
```

### Como Funciona

1. `clsx` resolve classes condicionais, arrays e objetos
2. `twMerge` resolve conflitos entre classes Tailwind (ex: `p-2` e `p-4` -> `p-4`)

### Exemplos de Uso

```typescript
import { cn } from '@/lib/utils';

// Classes simples
cn('px-4', 'py-2');
// => 'px-4 py-2'

// Classes condicionais
cn('btn', isActive && 'btn-active', isDisabled && 'opacity-50');
// => 'btn btn-active' (se isActive=true, isDisabled=false)

// Resolve conflitos do Tailwind
cn('p-2 bg-red-500', 'p-4 bg-blue-500');
// => 'p-4 bg-blue-500' (ultimo vence)

// Uso em componentes
<div className={cn('rounded-md border', className)} />
```

---

## 2. Helpers de Header de Tabela

**Arquivo:** `src/lib/table.ts` (funcoes `HeaderFilter` e `HeaderSorter` definidas em outro modulo e reimportadas)

### HeaderFilter

Filtra campos visiveis na listagem que nao estao na lixeira.

```typescript
export function HeaderFilter(field: IField): boolean {
  return field.showInList && !field.trashed;
}
```

### HeaderSorter

Cria uma funcao de comparacao que ordena campos conforme um array de IDs.

```typescript
export function HeaderSorter(order: Array<string>) {
  return function (a: IField, b: IField): number {
    return order.indexOf(a._id) - order.indexOf(b._id);
  };
}
```

### Exemplo de Uso

```typescript
import { HeaderFilter, HeaderSorter } from '@/lib/table';

const visibleFields = table.fields
  .filter(HeaderFilter)
  .sort(HeaderSorter(table.fieldOrderList));
```

---

## 3. Helpers de Tabela (table.ts)

**Arquivo:** `src/lib/table.ts`

Este arquivo contem funcoes para construir valores padrao e payloads para operacoes de criacao e edicao de registros.

### Tipos Auxiliares

```typescript
type FileFieldValue = {
  storages: Array<IStorage>;
  files: Array<File>;
};

type RowFieldValue =
  | string
  | Array<string>
  | FileFieldValue
  | Array<{ value: string; label: string }>;

export type CreateRowDefaultValue = Record<
  string,
  RowFieldValue | Array<Record<string, RowFieldValue>>
>;
```

### getDropdownItem

Busca uma opcao de dropdown pelo ID.

```typescript
export function getDropdownItem(
  items: Array<IDropdown>,
  id: string,
): IDropdown | undefined;
```

### getCategoryItem

Busca recursivamente uma categoria pelo ID na arvore hierarquica.

```typescript
export function getCategoryItem(
  categories: Array<ICategory>,
  id: string,
): ICategory | undefined;
```

### buildCreateRowDefaultValues

Constroi valores padrao para criacao de um novo registro baseado nos campos da tabela.

```typescript
export function buildCreateRowDefaultValues(
  fields: Array<IField>,
): CreateRowDefaultValue;
```

| Tipo de Campo | Valor Padrao |
|---------------|-------------|
| `TEXT_SHORT`, `TEXT_LONG` | `field.defaultValue ?? ''` |
| `DATE` | `''` |
| `DROPDOWN` | `[]` |
| `FILE` | `{ storages: [], files: [] }` |
| `RELATIONSHIP`, `CATEGORY`, `USER` | `[]` |
| `FIELD_GROUP` | `[{}]` |

Campos nativos, `REACTION` e `EVALUATION` sao ignorados.

### buildUpdateRowDefaultValues

Constroi valores padrao a partir de dados existentes de um registro (para edicao).

```typescript
export function buildUpdateRowDefaultValues(
  data: IRow,
  fields: Array<IField>,
): Record<string, UpdateRowDefaultValue>;
```

Logica especifica por tipo:
- `RELATIONSHIP`: converte `IRow[]` em `Array<{ value, label }>`
- `USER`: converte `IUser[]` em `Array<{ value, label }>`
- `FILE`: envolve `IStorage[]` em `{ storages: [...], files: [] }`
- `FIELD_GROUP`: garante que o valor seja um array

### buildRowPayload

Converte os valores do formulario em payload para a API.

```typescript
export function buildRowPayload(
  values: Record<string, FieldValue>,
  fields: Array<IField>,
): Record<string, RowPayload>;
```

### mountRowValue

Monta o valor de um campo individual para envio a API. Respeita as regras de `multiple`.

```typescript
export function mountRowValue(value: FieldValue, field: IField): RowPayload;
```

| Tipo | Single | Multiple |
|------|--------|----------|
| `TEXT_SHORT/LONG` | `string \| null` | N/A |
| `DROPDOWN` | `[opcao]` | `[opcao1, opcao2, ...]` |
| `FILE` | `[storageId]` | `[id1, id2, ...]` |
| `RELATIONSHIP` | `[id]` | `[id1, id2, ...]` |
| `CATEGORY` | `[id]` | `[id1, id2, ...]` |
| `USER` | `[id]` | `[id1, id2, ...]` |
| `FIELD_GROUP` | `[record]` | `[record1, record2, ...]` |
| `REACTION/EVALUATION` | `null` (gerenciado pelo sistema) | N/A |

### buildFieldValidator

Valida se um campo obrigatorio possui valor.

```typescript
export function buildFieldValidator(
  field: IField,
  value: null | undefined | string | { storages: Array<IStorage> },
): { message: string } | undefined;
```

Retorna `undefined` se valido ou `{ message: string }` com mensagem de erro em portugues.

### Exemplo Completo

```typescript
import {
  buildCreateRowDefaultValues,
  buildUpdateRowDefaultValues,
  buildRowPayload,
  buildFieldValidator,
} from '@/lib/table';

// Criacao
const defaults = buildCreateRowDefaultValues(table.fields);
// { titulo: '', descricao: '', arquivos: { storages: [], files: [] }, ... }

// Edicao
const editDefaults = buildUpdateRowDefaultValues(existingRow, table.fields);

// Envio
const payload = buildRowPayload(formValues, table.fields);
await API.post(`/rows/${table.slug}`, payload);

// Validacao
const error = buildFieldValidator(field, '');
if (error) console.log(error.message); // "Titulo e obrigatorio"
```

---

## 4. Funcoes de Estilo de Tabela (table-style.ts)

**Arquivo:** `src/lib/table-style.ts`

Funcoes que determinam se uma tabela atende aos requisitos estruturais para cada estilo visual.

### isForumTemplate

Verifica se a tabela possui a estrutura necessaria para o template de forum.

```typescript
export function isForumTemplate(table?: ITable | null): boolean;
```

**Requisitos:**
- Grupo de campos chamado `mensagens`
- Dentro do grupo: campos `mensagem-id`, `texto`, `autor`, `data`
- Campo `FIELD_GROUP` com slug `mensagens`

### isKanbanTemplate

Verifica se a tabela possui a estrutura necessaria para o template kanban.

```typescript
export function isKanbanTemplate(table?: ITable | null): boolean;
```

**Requisitos:**
- Grupo de campos chamado `tarefas` com campos `titulo`, `realizado`
- Grupo de campos chamado `comentarios`
- Campo `DROPDOWN` com slug `lista`
- Campo `FIELD_GROUP` com slug `tarefas`

### getAllowedTableStyles

Retorna a lista de estilos permitidos para uma tabela com base nos campos existentes.

```typescript
export function getAllowedTableStyles(
  table?: ITable | null,
): Array<ValueOf<typeof E_TABLE_STYLE>>;
```

**Logica de decisao:**

| Estilo | Condicao |
|--------|----------|
| `LIST` | Sempre disponivel |
| `GALLERY` | Sempre disponivel |
| `DOCUMENT` | Requer campo `CATEGORY` + campo `TEXT_LONG` |
| `CARD` | Requer campo `FILE` + `TEXT_LONG` + `TEXT_SHORT` |
| `MOSAIC` | Requer campo `FILE` + `TEXT_LONG` + `TEXT_SHORT` |
| `KANBAN` | `isKanbanTemplate(table)` retorna true |
| `FORUM` | `isForumTemplate(table)` retorna true |

Se a tabela for `null`, retorna apenas `LIST`, `GALLERY` e `DOCUMENT`.

### Exemplo

```typescript
import { getAllowedTableStyles, isKanbanTemplate } from '@/lib/table-style';

const styles = getAllowedTableStyles(table);
// ['LIST', 'GALLERY', 'DOCUMENT', 'CARD']

if (isKanbanTemplate(table)) {
  // Habilitar opcoes do kanban
}
```

---

## 5. Layout Pickers (layout-pickers.ts)

**Arquivo:** `src/lib/layout-pickers.ts`

Helpers para o estilo de visualizacao `DOCUMENT`, que organiza registros em blocos hierarquicos por categorias.

### Tipos

```typescript
export type DocBlock = {
  id: string;
  titleField: IField;
  bodyField?: IField;
};

export type CatNode = {
  id: string;
  label: string;
  children?: Array<CatNode>;
};
```

### Funcoes de Busca

| Funcao | Descricao |
|--------|-----------|
| `headerSorter(order)` | Cria comparador para ordenar campos por array de IDs |
| `firstCategoryField(headers, order)` | Retorna o primeiro campo `CATEGORY` nao-excluido |

### Funcoes de Construcao de Mapas

| Funcao | Entrada | Saida | Descricao |
|--------|---------|-------|-----------|
| `buildDepthMap(nodes)` | `Array<CatNode>` | `Map<string, number>` | Mapeia ID -> profundidade na arvore |
| `buildLabelMap(nodes)` | `Array<CatNode>` | `Map<string, string>` | Mapeia ID -> label |
| `buildCategoryOrderMap(nodes)` | `Array<CatNode>` | `Map<string, number>` | Mapeia ID -> ordem sequencial |
| `buildDescendantsMap(nodes)` | `Array<CatNode>` | `Map<string, Set<string>>` | Mapeia ID -> todos os IDs descendentes |

### buildDocBlocks

Constroi blocos de documento a partir de campos ordenados.

```typescript
export function buildDocBlocks(headersOrdered: Array<IField>): Array<DocBlock>;
```

Identifica o primeiro `TEXT_SHORT` como titulo e o primeiro `TEXT_LONG` como corpo.

### Funcoes de Posicionamento

| Funcao | Descricao |
|--------|-----------|
| `rowMatchesCategory(row, categorySlug, selectedId, descendantsMap)` | Verifica se um registro pertence a uma categoria (incluindo descendentes) |
| `rowIndentPxFromLeaf(row, categorySlug, depthMap)` | Calcula indentacao em pixels (profundidade * 16px) |
| `rowHeadingLevelFromLeaf(row, categorySlug, depthMap)` | Retorna nivel de heading (h2 a h6) baseado na profundidade |
| `rowLeafLabel(row, categorySlug, labelMap)` | Retorna o label da categoria folha do registro |
| `getRowLeafId(row, categorySlug)` | Retorna o ID da categoria mais profunda do registro |

### getStr

Utilitario de coercao segura para string.

```typescript
export function getStr(v: unknown): string {
  return typeof v === 'string' ? v : '';
}
```

### Exemplo Completo

```typescript
import {
  firstCategoryField,
  buildDepthMap,
  buildLabelMap,
  buildDocBlocks,
  buildDescendantsMap,
  rowMatchesCategory,
  rowHeadingLevelFromLeaf,
  headerSorter,
} from '@/lib/layout-pickers';

// Encontrar campo de categoria
const catField = firstCategoryField(table.fields, table.fieldOrderList);

// Construir mapas
const depthMap = buildDepthMap(catField.category);
const labelMap = buildLabelMap(catField.category);
const descMap = buildDescendantsMap(catField.category);

// Construir blocos de documento
const orderedFields = table.fields
  .filter(f => !f.trashed)
  .sort(headerSorter(table.fieldOrderList));
const blocks = buildDocBlocks(orderedFields);

// Filtrar registros por categoria selecionada
const filtered = rows.filter(row =>
  rowMatchesCategory(row, catField.slug, selectedCatId, descMap),
);

// Obter nivel de heading para exibicao
const level = rowHeadingLevelFromLeaf(row, catField.slug, depthMap);
// => 2 (h2) para raiz, 3 (h3) para nivel 1, etc.
```

---

## 6. Document Helpers e Forum Helpers

**Arquivos:** `src/lib/document-helpers.ts` e `src/lib/forum-helpers.ts`

Estes dois arquivos possuem conteudo identico. Ambos exportam funcoes de normalizacao e manipulacao de dados para os templates de documento e forum.

### Tipo ReactionEntry

```typescript
export type ReactionEntry = {
  emoji: string;
  users: Array<string>; // IDs dos usuarios que reagiram
};
```

### Funcoes

| Funcao | Assinatura | Descricao |
|--------|-----------|-----------|
| `stripHtml(value)` | `(string) => string` | Remove todas as tags HTML e `&nbsp;`, retorna texto puro |
| `normalizeId(value)` | `(unknown) => string \| null` | Extrai ID de string, objeto `{_id}`, `{id}` ou `{value}` |
| `normalizeIdList(value)` | `(unknown) => Array<string>` | Normaliza array ou valor unico em lista de IDs |
| `normalizeUserList(value)` | `(unknown) => Array<IUser \| string>` | Normaliza lista de usuarios |
| `normalizeStorageList(value)` | `(unknown) => Array<IStorage>` | Filtra e valida items como `IStorage` |
| `parseReactions(value)` | `(unknown) => Array<ReactionEntry>` | Parseia reacoes de array, string JSON ou retorna `[]` |
| `serializeReactions(entries)` | `(Array<ReactionEntry>) => string` | Serializa reacoes para JSON string |
| `normalizeGroupFieldValue(field, value)` | `(IField, unknown) => unknown` | Normaliza valor de subcampo conforme o tipo do campo |

### stripHtml

```typescript
export function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// Exemplo
stripHtml('<p>Ola <strong>mundo</strong></p>');
// => 'Ola mundo'
```

### normalizeId

```typescript
export function normalizeId(value: unknown): string | null;

// Exemplos
normalizeId('abc123');                    // => 'abc123'
normalizeId({ _id: 'abc123' });          // => 'abc123'
normalizeId({ id: 'abc123' });           // => 'abc123'
normalizeId({ value: 'abc123' });        // => 'abc123'
normalizeId(null);                       // => null
```

### normalizeGroupFieldValue

Normaliza o valor de um campo dentro de um grupo, respeitando o tipo e multiplicidade.

```typescript
// Para TEXT_SHORT/TEXT_LONG: retorna string (ou '' se null)
// Para DATE: retorna ISO string ou null
// Para DROPDOWN/CATEGORY: retorna array de strings
// Para USER/FILE/RELATIONSHIP: retorna array de IDs
```

---

## 7. Kanban Helpers (kanban-helpers.ts)

**Arquivo:** `src/lib/kanban-helpers.ts`

Funcoes utilitarias especificas para o template Kanban.

### Constantes

```typescript
export const ORDER_FIELD_SLUG = 'ordem-kanban';
export const ORDER_FIELD_NAME = 'Ordem Kanban';

export const TEMPLATE_FIELD_SLUGS = new Set([
  'titulo', 'descricao', 'membros', 'membros-notificados',
  'data-de-inicio', 'data-de-vencimento', 'porcentagem-concluida',
  'concluido-notificado', 'lista', 'etiquetas', 'tarefas', 'comentarios',
]);
```

### Funcoes de Busca de Campos

| Funcao | Assinatura | Descricao |
|--------|-----------|-----------|
| `getFieldBySlug(fields, slug, type?)` | `=> IField \| undefined` | Busca campo por slug (e opcionalmente tipo), ignorando excluidos |
| `getFirstFieldByType(fields, type)` | `=> IField \| undefined` | Retorna o primeiro campo nao-excluido do tipo especificado |

### Funcoes de Normalizacao

| Funcao | Assinatura | Descricao |
|--------|-----------|-----------|
| `normalizeRowValue(value)` | `(unknown) => Array<string>` | Converte valor para array de strings |
| `normalizeIdList(value)` | `(unknown) => Array<string>` | Extrai IDs de arrays de objetos ou valores |
| `getUserInitials(user)` | `(IUser \| string) => string` | Retorna iniciais (ex: "JD" para "John Doe") |

### Funcoes de Extracao de Dados do Card

| Funcao | Assinatura | Descricao |
|--------|-----------|-----------|
| `getMembersFromRow(row, field?)` | `=> Array<IUser \| string>` | Extrai membros de um registro |
| `getProgressValue(row, field?)` | `=> number \| null` | Extrai progresso (0-100) |
| `getTaskCompletionPercent(tasks)` | `=> number` | Calcula % de tarefas concluidas (campo `realizado` = `'sim'`) |
| `getTitleValue(row, field?)` | `=> string` | Extrai titulo (default: `'Sem titulo'`) |
| `parseOrderValue(value)` | `=> number \| null` | Parseia valor de ordenacao |

### Funcoes de Estilo de Coluna

| Funcao | Assinatura | Descricao |
|--------|-----------|-----------|
| `columnStyleFromColor(color?)` | `=> CSSProperties \| undefined` | Estilo de coluna com background e borda baseados na cor |
| `columnHeaderStyleFromColor(color?)` | `=> CSSProperties \| undefined` | Estilo do header da coluna |

```typescript
// Exemplo de saida
columnStyleFromColor('#3B82F6');
// => {
//   backgroundColor: 'rgba(59, 130, 246, 0.08)',
//   borderColor: 'rgba(59, 130, 246, 0.22)',
// }
```

### buildPayloadFromRow

Converte um registro kanban em payload para a API.

```typescript
export function buildPayloadFromRow(
  row: IRow,
  fields: Array<IField>,
): Record<string, any>;
```

Logica por tipo de campo:
- `DROPDOWN/CATEGORY`: `normalizeRowValue(value)`
- `USER/RELATIONSHIP/FILE`: `normalizeIdList(value)`
- `FIELD_GROUP`: mantem array ou `[]`
- Demais: `value ?? null`

### buildDefaultValuesFromRow

Converte um registro em valores padrao para formularios de edicao.

```typescript
export function buildDefaultValuesFromRow(
  row: IRow,
  fields: Array<IField>,
): Record<string, any>;
```

Conversoes especiais:
- `USER`: converte para `Array<{ value, label }>`
- `DROPDOWN` single: retorna valor unico ao inves de array
- `DATE`: retorna `value ?? ''`

### Exemplo Completo

```typescript
import {
  getFieldBySlug,
  getTitleValue,
  getMembersFromRow,
  getProgressValue,
  getTaskCompletionPercent,
  getUserInitials,
  columnStyleFromColor,
  buildPayloadFromRow,
  TEMPLATE_FIELD_SLUGS,
} from '@/lib/kanban-helpers';

// Encontrar campos do kanban
const titleField = getFieldBySlug(fields, 'titulo');
const membersField = getFieldBySlug(fields, 'membros');
const progressField = getFieldBySlug(fields, 'porcentagem-concluida');

// Extrair dados de um card
const title = getTitleValue(row, titleField);
const members = getMembersFromRow(row, membersField);
const progress = getProgressValue(row, progressField);

// Iniciais dos membros
members.forEach(member => {
  console.log(getUserInitials(member)); // 'JD', 'MA', etc.
});

// Tarefas
const tasks = row['tarefas'] || [];
const completionPercent = getTaskCompletionPercent(tasks);
// => 75 (se 3 de 4 tarefas com realizado='sim')

// Estilo de coluna por cor do dropdown
const style = columnStyleFromColor('#EF4444');

// Construir payload para salvar
const payload = buildPayloadFromRow(row, fields);
await API.put(`/rows/${tableSlug}/${row._id}`, payload);

// Verificar se campo e do template kanban
const isTemplateField = TEMPLATE_FIELD_SLUGS.has('titulo'); // true
```

---

## 8. Kanban Types (kanban-types.ts)

**Arquivo:** `src/lib/kanban-types.ts`

Define o tipo `FieldMap` que mapeia campos semanticos do kanban para campos reais da tabela.

```typescript
export type FieldMap = {
  title?: IField;        // Campo de titulo (TEXT_SHORT, slug 'titulo')
  description?: IField;  // Campo de descricao (TEXT_LONG, slug 'descricao')
  members?: IField;      // Campo de membros (USER, slug 'membros')
  startDate?: IField;    // Data de inicio (DATE, slug 'data-de-inicio')
  dueDate?: IField;      // Data de vencimento (DATE, slug 'data-de-vencimento')
  progress?: IField;     // Progresso (TEXT_SHORT, slug 'porcentagem-concluida')
  list?: IField;         // Lista/coluna (DROPDOWN, slug 'lista')
  labels?: IField;       // Etiquetas (DROPDOWN, slug 'etiquetas')
  attachments?: IField;  // Anexos (FILE)
  tasks?: IField;        // Tarefas (FIELD_GROUP, slug 'tarefas')
  comments?: IField;     // Comentarios (FIELD_GROUP, slug 'comentarios')
};
```

### Exemplo de Uso

```typescript
import type { FieldMap } from '@/lib/kanban-types';
import { getFieldBySlug } from '@/lib/kanban-helpers';
import { E_FIELD_TYPE } from '@/lib/constant';

function buildFieldMap(fields: Array<IField>): FieldMap {
  return {
    title: getFieldBySlug(fields, 'titulo', E_FIELD_TYPE.TEXT_SHORT),
    description: getFieldBySlug(fields, 'descricao', E_FIELD_TYPE.TEXT_LONG),
    members: getFieldBySlug(fields, 'membros', E_FIELD_TYPE.USER),
    list: getFieldBySlug(fields, 'lista', E_FIELD_TYPE.DROPDOWN),
    tasks: getFieldBySlug(fields, 'tarefas', E_FIELD_TYPE.FIELD_GROUP),
    comments: getFieldBySlug(fields, 'comentarios', E_FIELD_TYPE.FIELD_GROUP),
    startDate: getFieldBySlug(fields, 'data-de-inicio', E_FIELD_TYPE.DATE),
    dueDate: getFieldBySlug(fields, 'data-de-vencimento', E_FIELD_TYPE.DATE),
    progress: getFieldBySlug(fields, 'porcentagem-concluida'),
    labels: getFieldBySlug(fields, 'etiquetas', E_FIELD_TYPE.DROPDOWN),
  };
}
```

---

## 9. Tabela Resumo de Todas as Funcoes

| Arquivo | Funcao | Descricao |
|---------|--------|-----------|
| `utils.ts` | `cn(...inputs)` | Merge de classes CSS |
| `table.ts` | `getDropdownItem(items, id)` | Busca opcao de dropdown |
| `table.ts` | `getCategoryItem(categories, id)` | Busca categoria recursivamente |
| `table.ts` | `buildCreateRowDefaultValues(fields)` | Valores padrao para criacao |
| `table.ts` | `buildUpdateRowDefaultValues(data, fields)` | Valores padrao para edicao |
| `table.ts` | `buildRowPayload(values, fields)` | Payload de envio |
| `table.ts` | `mountRowValue(value, field)` | Valor individual para payload |
| `table.ts` | `buildFieldValidator(field, value)` | Validacao de campo obrigatorio |
| `table-style.ts` | `isForumTemplate(table)` | Verifica estrutura de forum |
| `table-style.ts` | `isKanbanTemplate(table)` | Verifica estrutura de kanban |
| `table-style.ts` | `getAllowedTableStyles(table)` | Lista estilos permitidos |
| `layout-pickers.ts` | `headerSorter(order)` | Comparador de ordenacao |
| `layout-pickers.ts` | `firstCategoryField(headers, order)` | Primeiro campo categoria |
| `layout-pickers.ts` | `buildDepthMap(nodes)` | Mapa ID -> profundidade |
| `layout-pickers.ts` | `buildLabelMap(nodes)` | Mapa ID -> label |
| `layout-pickers.ts` | `buildDocBlocks(headersOrdered)` | Blocos de documento |
| `layout-pickers.ts` | `buildCategoryOrderMap(nodes)` | Mapa ID -> ordem |
| `layout-pickers.ts` | `buildDescendantsMap(nodes)` | Mapa ID -> descendentes |
| `layout-pickers.ts` | `rowMatchesCategory(row, slug, id, descMap)` | Filtra por categoria |
| `layout-pickers.ts` | `rowIndentPxFromLeaf(row, slug, depthMap)` | Indentacao em pixels |
| `layout-pickers.ts` | `rowHeadingLevelFromLeaf(row, slug, depthMap)` | Nivel de heading |
| `layout-pickers.ts` | `rowLeafLabel(row, slug, labelMap)` | Label da folha |
| `layout-pickers.ts` | `getRowLeafId(row, slug)` | ID da folha |
| `layout-pickers.ts` | `getStr(v)` | Coercao segura para string |
| `document-helpers.ts` | `stripHtml(value)` | Remove tags HTML |
| `document-helpers.ts` | `normalizeId(value)` | Extrai ID |
| `document-helpers.ts` | `normalizeIdList(value)` | Lista de IDs |
| `document-helpers.ts` | `normalizeUserList(value)` | Lista de usuarios |
| `document-helpers.ts` | `normalizeStorageList(value)` | Lista de storages |
| `document-helpers.ts` | `parseReactions(value)` | Parseia reacoes |
| `document-helpers.ts` | `serializeReactions(entries)` | Serializa reacoes |
| `document-helpers.ts` | `normalizeGroupFieldValue(field, value)` | Normaliza valor de grupo |
| `kanban-helpers.ts` | `getFieldBySlug(fields, slug, type?)` | Busca campo por slug |
| `kanban-helpers.ts` | `getFirstFieldByType(fields, type)` | Primeiro campo do tipo |
| `kanban-helpers.ts` | `normalizeRowValue(value)` | Normaliza para array |
| `kanban-helpers.ts` | `normalizeIdList(value)` | Extrai IDs |
| `kanban-helpers.ts` | `getUserInitials(user)` | Iniciais do usuario |
| `kanban-helpers.ts` | `getMembersFromRow(row, field?)` | Membros do registro |
| `kanban-helpers.ts` | `getProgressValue(row, field?)` | Progresso (0-100) |
| `kanban-helpers.ts` | `getTaskCompletionPercent(tasks)` | % de tarefas concluidas |
| `kanban-helpers.ts` | `getTitleValue(row, field?)` | Titulo do card |
| `kanban-helpers.ts` | `parseOrderValue(value)` | Ordem do card |
| `kanban-helpers.ts` | `columnStyleFromColor(color?)` | Estilo CSS de coluna |
| `kanban-helpers.ts` | `columnHeaderStyleFromColor(color?)` | Estilo CSS do header |
| `kanban-helpers.ts` | `buildPayloadFromRow(row, fields)` | Payload para API |
| `kanban-helpers.ts` | `buildDefaultValuesFromRow(row, fields)` | Defaults para form |
