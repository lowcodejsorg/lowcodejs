# Tipos e Constantes

Referencia completa dos tipos TypeScript, enums e constantes utilizados no frontend do LowCodeJS.

**Arquivos-fonte:**
- `src/lib/interfaces.ts` -- Interfaces e tipos utilitarios
- `src/lib/constant.ts` -- Enums e arrays de opcoes para selects
- `src/lib/payloads.ts` -- Tipos de payload para requisicoes HTTP

---

## 1. Tipos Utilitarios

O arquivo `interfaces.ts` exporta tres tipos utilitarios genericos reutilizados em toda a aplicacao.

| Tipo | Descricao | Exemplo |
|------|-----------|---------|
| `Optional<T, K>` | Torna as propriedades `K` opcionais em `T` | `Optional<IUser, 'password'>` |
| `Merge<T, U>` | Combina dois tipos em um unico tipo | `Merge<Base, { name: string }>` |
| `ValueOf<T>` | Extrai o tipo dos valores de um objeto | `ValueOf<typeof E_ROLE>` |

```typescript
// Optional: torna propriedades especificas opcionais
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

// Merge: combina dois tipos
export type Merge<T, U> = {
  [K in keyof (T & U)]: (T & U)[K];
};

// ValueOf: extrai tipos dos valores
export type ValueOf<T> = T[keyof T];
```

### Exemplo de uso

```typescript
import type { Optional, Merge, ValueOf } from '@/lib/interfaces';
import { E_ROLE } from '@/lib/constant';

// Criar um usuario sem precisar informar password
type UserWithoutPassword = Optional<IUser, 'password'>;

// Tipo que pode ser 'MASTER' | 'ADMINISTRATOR' | 'MANAGER' | 'REGISTERED'
type Role = ValueOf<typeof E_ROLE>;
```

---

## 2. Tipos Base

### SearchableOption

Tipo utilizado em selects com busca (combobox, autocomplete).

```typescript
export type SearchableOption = {
  value: string;
  label: string;
};
```

### Meta

Metadados de paginacao retornados pela API.

```typescript
export type Meta = {
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
  firstPage: number;
};
```

### Paginated\<Entity\>

Wrapper generico para respostas paginadas.

```typescript
export type Paginated<Entity> = {
  data: Array<Entity>;
  meta: Meta;
};
```

### Base

Tipo base com campos comuns a todas as entidades persistidas.

```typescript
export type Base = {
  _id: string;
  createdAt: string;
  updatedAt: string | null;
  trashedAt: string | null;
  trashed: boolean;
};
```

### MetaDefault

Valor padrao para inicializacao de estados de paginacao (definido em `constant.ts`).

```typescript
export const MetaDefault: Meta = {
  total: 1,
  perPage: 50,
  page: 1,
  lastPage: 1,
  firstPage: 1,
};
```

---

## 3. Interfaces de Entidade

Todas as interfaces de entidade estendem `Base` via `Merge<Base, {...}>`.

### IStorage

Representa um arquivo armazenado no sistema.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `url` | `string` | URL publica do arquivo |
| `filename` | `string` | Nome do arquivo no servidor |
| `mimetype` | `string` | Tipo MIME (ex: `image/png`) |
| `size` | `number` | Tamanho em bytes |
| `originalName` | `string` | Nome original do upload |

### IPermission

Representa uma permissao do sistema.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `name` | `string` | Nome da permissao |
| `slug` | `string` | Identificador unico |
| `description` | `string \| null` | Descricao opcional |

### IGroup

Grupo de usuarios com permissoes associadas.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `name` | `string` | Nome do grupo |
| `slug` | `string` | Identificador unico |
| `description` | `string \| null` | Descricao opcional |
| `permissions` | `Array<IPermission>` | Permissoes do grupo |

### IUser

Representa um usuario da aplicacao.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `name` | `string` | Nome do usuario |
| `email` | `string` | Email do usuario |
| `password` | `string` | Hash da senha |
| `status` | `ValueOf<typeof E_USER_STATUS>` | `'ACTIVE'` ou `'INACTIVE'` |
| `group` | `IGroup` | Grupo ao qual pertence |

### IValidationToken

Token de validacao para operacoes como recuperacao de senha.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `user` | `IUser` | Usuario associado |
| `code` | `string` | Codigo de validacao |
| `status` | `ValueOf<typeof E_TOKEN_STATUS>` | `'REQUESTED'`, `'EXPIRED'` ou `'VALIDATED'` |

### IJWTPayload

Payload do token JWT de autenticacao.

```typescript
export type IJWTPayload = {
  sub: string;          // ID do usuario
  email: string;        // Email
  role: ValueOf<typeof E_ROLE>;   // Role do usuario
  type: ValueOf<typeof E_JWT_TYPE>; // 'ACCESS' ou 'REFRESH'
};
```

### IMenu

Representa um item de menu da aplicacao.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `name` | `string` | Nome do item |
| `slug` | `string` | Identificador unico |
| `type` | `ValueOf<typeof E_MENU_ITEM_TYPE>` | Tipo do item (TABLE, PAGE, FORM, EXTERNAL, SEPARATOR) |
| `table` | `ITable \| null` | Tabela associada (se type = TABLE) |
| `parent` | `IMenu \| null` | Menu pai (para submenus) |
| `url` | `string \| null` | URL externa (se type = EXTERNAL) |
| `html` | `string \| null` | Conteudo HTML (se type = PAGE) |

### ICategory

Estrutura hierarquica para campos do tipo categoria.

```typescript
export type ICategory = {
  id: string;
  label: string;
  children: Array<ICategory>; // Subcategorias recursivas
};
```

### IDropdown

Opcao de um campo dropdown.

```typescript
export type IDropdown = {
  id: string;
  label: string;
  color: string | null; // Cor opcional para badges
};
```

### IField

Representa um campo de uma tabela. E a interface mais detalhada do sistema.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `name` | `string` | Nome de exibicao |
| `slug` | `string` | Identificador unico |
| `type` | `ValueOf<typeof E_FIELD_TYPE>` | Tipo do campo |
| `required` | `boolean` | Se e obrigatorio |
| `multiple` | `boolean` | Se aceita multiplos valores |
| `format` | `ValueOf<typeof E_FIELD_FORMAT> \| null` | Formato (data, texto) |
| `showInFilter` | `boolean` | Visivel no filtro |
| `showInForm` | `boolean` | Visivel no formulario |
| `showInDetail` | `boolean` | Visivel no detalhe |
| `showInList` | `boolean` | Visivel na listagem |
| `widthInForm` | `number \| null` | Largura no formulario (%) |
| `widthInList` | `number \| null` | Largura na listagem (%) |
| `defaultValue` | `string \| null` | Valor padrao |
| `locked` | `boolean` | Se esta bloqueado para edicao |
| `native` | `boolean` | Se e campo nativo do sistema |
| `relationship` | `IFieldConfigurationRelationship \| null` | Config de relacionamento |
| `dropdown` | `Array<IDropdown>` | Opcoes do dropdown |
| `category` | `Array<ICategory>` | Arvore de categorias |
| `group` | `IFieldConfigurationGroup \| null` | Config de grupo |

### IFieldConfigurationRelationship

Configuracao de um campo de relacionamento.

```typescript
export type IFieldConfigurationRelationship = {
  table: Pick<ITable, '_id' | 'slug'>;  // Tabela de destino
  field: Pick<IField, '_id' | 'slug'>;  // Campo de exibicao
  order: 'asc' | 'desc';                // Ordenacao
};
```

### ITable

Representa uma tabela (o recurso central do LowCodeJS).

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `_schema` | `ITableSchema` | Schema Mongoose dinamico |
| `name` | `string` | Nome da tabela |
| `description` | `string \| null` | Descricao |
| `logo` | `IStorage \| null` | Logo da tabela |
| `slug` | `string` | Identificador unico |
| `fields` | `Array<IField>` | Campos da tabela |
| `type` | `ValueOf<typeof E_TABLE_TYPE>` | `'TABLE'` ou `'FIELD_GROUP'` |
| `style` | `ValueOf<typeof E_TABLE_STYLE>` | Estilo visual |
| `visibility` | `ValueOf<typeof E_TABLE_VISIBILITY>` | Nivel de visibilidade |
| `collaboration` | `ValueOf<typeof E_TABLE_COLLABORATION>` | Modo de colaboracao |
| `administrators` | `Array<IUser>` | Administradores da tabela |
| `owner` | `IUser` | Proprietario |
| `fieldOrderList` | `Array<string>` | Ordem dos campos na listagem |
| `fieldOrderForm` | `Array<string>` | Ordem dos campos no formulario |
| `methods` | `ITableMethod` | Hooks de codigo (onLoad, beforeSave, afterSave) |
| `groups` | `Array<IGroupConfiguration>` | Grupos de campos |

### ITableMethod

Hooks de codigo executaveis em eventos da tabela.

```typescript
export type ITableMethod = {
  onLoad: { code: string | null };
  beforeSave: { code: string | null };
  afterSave: { code: string | null };
};
```

### ISetting

Configuracoes globais do sistema.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `LOCALE` | `string` | Idioma do sistema |
| `LOGO_SMALL_URL` | `string \| null` | URL do logo pequeno |
| `LOGO_LARGE_URL` | `string \| null` | URL do logo grande |
| `FILE_UPLOAD_MAX_SIZE` | `number` | Tamanho maximo de upload |
| `FILE_UPLOAD_MAX_FILES_PER_UPLOAD` | `number` | Maximo de arquivos por upload |
| `FILE_UPLOAD_ACCEPTED` | `Array<string>` | Tipos de arquivo aceitos |
| `PAGINATION_PER_PAGE` | `number` | Itens por pagina |
| `MODEL_CLONE_TABLES` | `Array<ITable>` | Tabelas modelo para clone |
| `DATABASE_URL` | `string` | URL do banco de dados |
| `EMAIL_PROVIDER_HOST` | `string` | Host do servidor de email |
| `EMAIL_PROVIDER_PORT` | `number` | Porta do servidor de email |
| `EMAIL_PROVIDER_USER` | `string` | Usuario do servidor de email |
| `EMAIL_PROVIDER_PASSWORD` | `string` | Senha do servidor de email |

### IRow

Representa uma linha (registro) de uma tabela. Possui campos dinamicos alem dos campos base.

```typescript
export type IRow = Merge<
  Base,
  {
    creator: IUser;
    [x: string]: any; // Campos dinamicos conforme a tabela
  }
>;
```

### IReaction e IEvaluation

Tipos para campos interativos.

```typescript
export type IReaction = Merge<Base, {
  user: IUser;
  type: ValueOf<typeof E_REACTION_TYPE>; // 'LIKE' | 'UNLIKE'
}>;

export type IEvaluation = Merge<Base, {
  user: IUser;
  value: number; // Nota de avaliacao
}>;
```

### ISearch

Parametros de busca/filtragem.

```typescript
export type ISearch = Merge<Record<string, unknown>, {
  page: number;
  perPage: number;
  search?: string;
  trashed?: 'true' | 'false';
  sub?: string;
}>;
```

### IHTTPException e IHTTPExeptionError

Tipos para tratamento de erros da API.

```typescript
export type IHTTPException = {
  code: number;
  cause: string;
  message: string;
};

export type IHTTPExeptionError<T> = Merge<IHTTPException, { errors: T }>;
```

### ICloneTableResponse

Resposta da operacao de clone de tabela.

```typescript
export interface ICloneTableResponse {
  tableId: string;
  slug: string;
  fieldIdMap: Record<string, string>;
}
```

---

## 4. Enums (Constantes)

Todos os enums sao definidos como `const` objects com `as const`, garantindo tipagem literal.

### E_ROLE -- Roles de Usuario

```typescript
export const E_ROLE = {
  MASTER: 'MASTER',
  ADMINISTRATOR: 'ADMINISTRATOR',
  MANAGER: 'MANAGER',
  REGISTERED: 'REGISTERED',
} as const;
```

| Valor | Descricao |
|-------|-----------|
| `MASTER` | Super Administrador -- acesso total |
| `ADMINISTRATOR` | Administrador -- gerencia tabelas, menus, usuarios |
| `MANAGER` | Gerente -- acesso a tabelas |
| `REGISTERED` | Registrado -- acesso basico |

### E_FIELD_TYPE -- Tipos de Campo

```typescript
export const E_FIELD_TYPE = {
  TEXT_SHORT: 'TEXT_SHORT',
  TEXT_LONG: 'TEXT_LONG',
  DROPDOWN: 'DROPDOWN',
  DATE: 'DATE',
  RELATIONSHIP: 'RELATIONSHIP',
  FILE: 'FILE',
  FIELD_GROUP: 'FIELD_GROUP',
  REACTION: 'REACTION',
  EVALUATION: 'EVALUATION',
  CATEGORY: 'CATEGORY',
  USER: 'USER',
  // NATIVOS (gerenciados pelo sistema)
  CREATOR: 'CREATOR',
  IDENTIFIER: 'IDENTIFIER',
  CREATED_AT: 'CREATED_AT',
  TRASHED: 'TRASHED',
  TRASHED_AT: 'TRASHED_AT',
} as const;
```

| Valor | Descricao |
|-------|-----------|
| `TEXT_SHORT` | Texto curto (input) |
| `TEXT_LONG` | Texto longo (textarea / editor rico) |
| `DROPDOWN` | Lista de opcoes |
| `DATE` | Campo de data |
| `RELATIONSHIP` | Relacionamento com outra tabela |
| `FILE` | Upload de arquivo |
| `FIELD_GROUP` | Grupo de subcampos |
| `REACTION` | Reacao (like/unlike) |
| `EVALUATION` | Avaliacao numerica |
| `CATEGORY` | Categoria hierarquica |
| `USER` | Referencia a usuario |
| `CREATOR` | (nativo) Criador do registro |
| `IDENTIFIER` | (nativo) ID do registro |
| `CREATED_AT` | (nativo) Data de criacao |
| `TRASHED` | (nativo) Status de lixeira |
| `TRASHED_AT` | (nativo) Data de exclusao |

### E_FIELD_FORMAT -- Formatos de Campo

```typescript
export const E_FIELD_FORMAT = {
  // TEXT_SHORT
  ALPHA_NUMERIC: 'ALPHA_NUMERIC',
  INTEGER: 'INTEGER',
  DECIMAL: 'DECIMAL',
  URL: 'URL',
  EMAIL: 'EMAIL',
  // TEXT_LONG
  RICH_TEXT: 'RICH_TEXT',
  PLAIN_TEXT: 'PLAIN_TEXT',
  // DATE (diversos formatos)
  DD_MM_YYYY: 'dd/MM/yyyy',
  MM_DD_YYYY: 'MM/dd/yyyy',
  YYYY_MM_DD: 'yyyy/MM/dd',
  DD_MM_YYYY_HH_MM_SS: 'dd/MM/yyyy HH:mm:ss',
  // ... e mais 9 variacoes com barra e traco
} as const;
```

### E_TABLE_STYLE -- Estilos de Tabela

| Valor | Descricao |
|-------|-----------|
| `LIST` | Listagem tabular |
| `GALLERY` | Grade de cards |
| `DOCUMENT` | Visualizacao de documento |
| `CARD` | Card com imagem |
| `MOSAIC` | Mosaico de imagens |
| `KANBAN` | Quadro Kanban |
| `FORUM` | Estilo forum de discussao |

### E_TABLE_VISIBILITY -- Visibilidade da Tabela

| Valor | Descricao |
|-------|-----------|
| `PUBLIC` | Publica -- qualquer pessoa pode ver |
| `RESTRICTED` | Restrita -- apenas usuarios autenticados |
| `OPEN` | Aberta -- usuarios autenticados podem editar |
| `FORM` | Formulario online -- apenas envio |
| `PRIVATE` | Privada -- apenas administradores |

### E_TABLE_COLLABORATION -- Modo de Colaboracao

| Valor | Descricao |
|-------|-----------|
| `OPEN` | Qualquer usuario pode colaborar |
| `RESTRICTED` | Apenas administradores da tabela |

### E_TABLE_PERMISSION -- Permissoes de Tabela

| Grupo | Permissoes |
|-------|-----------|
| Tabela | `CREATE_TABLE`, `UPDATE_TABLE`, `REMOVE_TABLE`, `VIEW_TABLE` |
| Campo | `CREATE_FIELD`, `UPDATE_FIELD`, `REMOVE_FIELD`, `VIEW_FIELD` |
| Registro | `CREATE_ROW`, `UPDATE_ROW`, `REMOVE_ROW`, `VIEW_ROW` |

### E_MENU_ITEM_TYPE -- Tipos de Item de Menu

| Valor | Descricao |
|-------|-----------|
| `TABLE` | Link para tabela |
| `PAGE` | Pagina HTML |
| `FORM` | Formulario |
| `EXTERNAL` | Link externo |
| `SEPARATOR` | Separador visual |

### E_REACTION_TYPE -- Tipos de Reacao

| Valor | Descricao |
|-------|-----------|
| `LIKE` | Curtir |
| `UNLIKE` | Descurtir |

### Outros Enums

| Enum | Valores | Descricao |
|------|---------|-----------|
| `E_TABLE_TYPE` | `TABLE`, `FIELD_GROUP` | Tipo de tabela |
| `E_TOKEN_STATUS` | `REQUESTED`, `EXPIRED`, `VALIDATED` | Status do token |
| `E_JWT_TYPE` | `ACCESS`, `REFRESH` | Tipo de JWT |
| `E_USER_STATUS` | `ACTIVE`, `INACTIVE` | Status do usuario |
| `E_SCHEMA_TYPE` | `Number`, `String`, `Date`, `Boolean`, `ObjectId` | Tipos Mongoose |

---

## 5. Arrays de Opcoes para Selects

Esses arrays mapeiam valores de enums para labels em portugues, utilizados em componentes `<Select>`.

### FIELD_TYPE_OPTIONS

```typescript
export const FIELD_TYPE_OPTIONS = [
  { label: 'Texto', value: 'TEXT_SHORT' },
  { label: 'Texto longo', value: 'TEXT_LONG' },
  { label: 'Dropdown', value: 'DROPDOWN' },
  { label: 'Arquivo', value: 'FILE' },
  { label: 'Data', value: 'DATE' },
  { label: 'Relacionamento', value: 'RELATIONSHIP' },
  { label: 'Grupo de campos', value: 'FIELD_GROUP' },
  { label: 'Categoria', value: 'CATEGORY' },
  { label: 'Reacao', value: 'REACTION' },
  { label: 'Avaliacao', value: 'EVALUATION' },
  { label: 'Usuario', value: 'USER' },
] as const;
```

### Resumo de todos os arrays de opcoes

| Array | Quantidade | Uso |
|-------|-----------|-----|
| `FIELD_TYPE_OPTIONS` | 11 opcoes | Selecao de tipo de campo |
| `TEXT_FORMAT_OPTIONS` | 5 opcoes | Formato de texto curto (Alfanumerico, Inteiro, Decimal, URL, E-mail) |
| `TEXT_LONG_FORMAT_OPTIONS` | 2 opcoes | Formato de texto longo (Area de texto, Editor rico) |
| `DATE_FORMAT_OPTIONS` | 12 opcoes | Formatos de data (com `/` e `-`) |
| `MENU_ITEM_TYPE_OPTIONS` | 5 opcoes | Tipo de item de menu |
| `TABLE_COLLABORATION_OPTIONS` | 2 opcoes | Modo de colaboracao |
| `TABLE_VISIBILITY_OPTIONS` | 5 opcoes | Visibilidade da tabela |
| `TABLE_STYLE_OPTIONS` | 7 opcoes | Estilo visual da tabela |

### Mappers

| Mapper | Descricao |
|--------|-----------|
| `USER_GROUP_MAPPER` | Mapeia `E_ROLE` para labels em portugues (`MASTER` -> `'Master (Super Administrador)'`) |
| `USER_STATUS_MAPPER` | Mapeia `E_USER_STATUS` para labels (`ACTIVE` -> `'Ativo'`, `INACTIVE` -> `'Inativo'`) |

### PASSWORD_REGEX

Expressao regular para validacao de senha forte.

```typescript
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/;
```

Exige: 1 minuscula, 1 maiuscula, 1 digito, 1 caractere especial.

---

## 6. Tipos de Payload

Os payloads sao tipos utilizados para enviar dados nas requisicoes HTTP. Organizados por entidade em `payloads.ts`.

### Autenticacao

| Payload | Campos | Descricao |
|---------|--------|-----------|
| `SignInPayload` | `email`, `password` | Login |
| `SignUpPayload` | `name`, `email`, `password` | Cadastro |
| `RequestCodePayload` | `email` | Solicitar codigo de recuperacao |
| `ValidateCodePayload` | `code` | Validar codigo |
| `ResetPasswordPayload` | `password` | Redefinir senha |

### Usuario

| Payload | Campos obrigatorios | Campos opcionais |
|---------|---------------------|-----------------|
| `UserCreatePayload` | `name`, `email`, `password`, `group` | -- |
| `UserUpdatePayload` | `_id` | `name`, `email`, `password`, `group`, `status` |

### Grupo de Usuarios

| Payload | Campos obrigatorios | Campos opcionais |
|---------|---------------------|-----------------|
| `UserGroupCreatePayload` | `name` | `description`, `permissions` |
| `UserGroupUpdatePayload` | `_id` | `name`, `description`, `permissions` |

### Menu

| Payload | Campos obrigatorios | Campos opcionais |
|---------|---------------------|-----------------|
| `MenuCreatePayload` | `name`, `type` | `table`, `parent`, `html`, `url` |
| `MenuUpdatePayload` | `_id` | `name`, `type`, `table`, `parent`, `html`, `url` |

### Tabela

| Payload | Campos obrigatorios | Campos opcionais |
|---------|---------------------|-----------------|
| `TableCreatePayload` | `name` | `owner`, `logo`, `style`, `visibility` |
| `TableUpdatePayload` | `slug` | `name`, `description`, `logo`, `style`, `visibility`, `collaboration`, `administrators`, `fieldOrderList`, `fieldOrderForm`, `methods`, `fields`, `groups` |
| `TableMethodPayload` | -- | `onLoad`, `beforeSave`, `afterSave` |

### Campo

| Payload | Campos obrigatorios | Campos opcionais |
|---------|---------------------|-----------------|
| `FieldCreatePayload` | `slug`, `name`, `type` | `required`, `multiple`, `format`, `showIn*`, `width*`, `defaultValue`, `relationship`, `dropdown`, `category`, `group` |
| `FieldUpdatePayload` | `slug`, `_id`, `name`, `type` | Mesmos acima + `trashed`, `trashedAt` |
| `FieldConfigurationPayload` | -- | Todos os campos de configuracao |

### Registro (Row)

```typescript
export type RowCreatePayload = {
  slug: string;                    // Slug da tabela
  data: Record<string, unknown>;   // Dados dinamicos
};

export type RowUpdatePayload = {
  slug: string;
  rowId: string;
  data: Record<string, unknown>;
};
```

### Perfil e Configuracoes

| Payload | Campos |
|---------|--------|
| `ProfileUpdatePayload` | `name`, `email`, `allowPasswordChange?`, `currentPassword?`, `newPassword?` |
| `SettingUpdatePayload` | Partial de todas as configuracoes do ISetting |

### Clone de Tabela

```typescript
export type CloneTablePayload = {
  baseTableId: string; // ID da tabela modelo
  name: string;        // Nome da nova tabela
};
```

### Reacao e Avaliacao

```typescript
export type ReactionCreatePayload = {
  type: ValueOf<typeof E_REACTION_TYPE>; // 'LIKE' | 'UNLIKE'
};

export type EvaluationCreatePayload = {
  value: number; // Nota
};
```

---

## 7. Payloads de Query e FindBy

Utilizados para busca e filtragem de entidades.

### BaseQueryPayload

Campos comuns a todas as queries.

```typescript
export type BaseQueryPayload = {
  page?: number;
  perPage?: number;
  search?: string;
  authenticated?: string;
};
```

### Queries por Entidade

| Payload | Campos extras alem de BaseQueryPayload |
|---------|---------------------------------------|
| `UserQueryPayload` | `user?`, `_ids?`, `status?`, `trashed?` |
| `UserGroupQueryPayload` | (nenhum) |
| `MenuQueryPayload` | `trashed?`, `parent?` |
| `TableQueryPayload` | `name?`, `type?`, `owner?`, `trashed?`, `_ids?` |
| `FieldQueryPayload` | `type?`, `_ids?` |
| `StorageQueryPayload` | `type?` |

### FindBy Payloads

| Payload | Campos | Descricao |
|---------|--------|-----------|
| `UserFindByPayload` | `_id?`, `email?`, `exact` | Busca usuario por ID ou email |
| `MenuFindByPayload` | `_id?`, `slug?`, `parent?`, `trashed?`, `exact` | Busca menu |
| `TableFindByPayload` | `_id?`, `slug?`, `exact` | Busca tabela |
| `FieldFindByPayload` | `_id?`, `slug?`, `exact` | Busca campo |

### Row Action Payloads

```typescript
export type RowActionPayload = { slug: string; rowId: string };
export type RowActionBasePayload = { tableSlug: string; rowId: string };

export type RowReactionPayload = RowActionBasePayload & {
  field: string;
  type: ValueOf<typeof E_REACTION_TYPE>;
};

export type RowEvaluationPayload = RowActionBasePayload & {
  field: string;
  value: number;
};
```

---

## 8. Exemplo Completo

```typescript
import { E_FIELD_TYPE, E_TABLE_STYLE, E_TABLE_VISIBILITY } from '@/lib/constant';
import type { ITable, IField, Paginated } from '@/lib/interfaces';
import type { TableCreatePayload, RowCreatePayload } from '@/lib/payloads';

// Criar uma nova tabela
const payload: TableCreatePayload = {
  name: 'Projetos',
  style: E_TABLE_STYLE.KANBAN,
  visibility: E_TABLE_VISIBILITY.RESTRICTED,
};

// Tipar resposta paginada da API
type TableListResponse = Paginated<ITable>;

// Criar um novo registro
const rowPayload: RowCreatePayload = {
  slug: 'projetos',
  data: {
    titulo: 'Meu Projeto',
    descricao: 'Descricao do projeto',
    lista: ['backlog'],
  },
};

// Verificar tipo de campo
function isTextField(field: IField): boolean {
  return (
    field.type === E_FIELD_TYPE.TEXT_SHORT ||
    field.type === E_FIELD_TYPE.TEXT_LONG
  );
}
```
