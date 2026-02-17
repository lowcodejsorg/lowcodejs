# Core - Nucleo da Aplicacao

O diretorio `core/` contem os fundamentos da aplicacao: tipos, entidades, padroes de erro, injecao de dependencias, funcoes utilitarias e validacao de dados.

---

## entity.core.ts

Arquivo central de tipos e enums TypeScript. Define todas as entidades do dominio e seus tipos auxiliares.

### Tipos Utilitarios

```typescript
// Torna propriedades especificas opcionais
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

// Combina dois tipos em um unico tipo plano
export type Merge<T, U> = {
  [K in keyof (T & U)]: (T & U)[K];
};

// Extrai os valores de um tipo
export type ValueOf<T> = T[keyof T];
```

### Tipo Base

Todos os modelos estendem o tipo `Base`:

```typescript
export type Base = {
  _id: string;
  createdAt: Date;
  updatedAt: Date | null;
  trashedAt: Date | null;
  trashed: boolean;
};
```

### Enums (const objects)

#### E_FIELD_TYPE - 15 tipos de campo

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
  // NATIVE
  CREATOR: 'CREATOR',
  IDENTIFIER: 'IDENTIFIER',
  CREATED_AT: 'CREATED_AT',
  TRASHED: 'TRASHED',
  TRASHED_AT: 'TRASHED_AT',
} as const;
```

#### E_FIELD_FORMAT - Formatos de campo

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
  // DATE (12 formatos com / e -)
  DD_MM_YYYY: 'dd/MM/yyyy',
  MM_DD_YYYY: 'MM/dd/yyyy',
  YYYY_MM_DD: 'yyyy/MM/dd',
  DD_MM_YYYY_HH_MM_SS: 'dd/MM/yyyy HH:mm:ss',
  // ... mais formatos com separadores - e /
} as const;
```

#### E_ROLE - Papeis de usuario

```typescript
export const E_ROLE = {
  MASTER: 'MASTER',
  ADMINISTRATOR: 'ADMINISTRATOR',
  MANAGER: 'MANAGER',
  REGISTERED: 'REGISTERED',
} as const;
```

#### E_TABLE_STYLE - 7 estilos visuais

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

#### E_TABLE_VISIBILITY - 5 niveis de visibilidade

```typescript
export const E_TABLE_VISIBILITY = {
  PUBLIC: 'PUBLIC',        // Qualquer visitante pode ver
  RESTRICTED: 'RESTRICTED', // Apenas visualizacao para nao-donos
  OPEN: 'OPEN',            // Permite visualizar e criar registros
  FORM: 'FORM',            // Apenas criacao de registros (formulario)
  PRIVATE: 'PRIVATE',      // Apenas dono/admin
} as const;
```

#### Outros enums

| Enum | Valores |
|---|---|
| `E_MENU_ITEM_TYPE` | TABLE, PAGE, FORM, EXTERNAL, SEPARATOR |
| `E_TABLE_TYPE` | TABLE, FIELD_GROUP |
| `E_TABLE_COLLABORATION` | OPEN, RESTRICTED |
| `E_JWT_TYPE` | ACCESS, REFRESH |
| `E_TOKEN_STATUS` | REQUESTED, EXPIRED, VALIDATED |
| `E_USER_STATUS` | ACTIVE, INACTIVE |
| `E_REACTION_TYPE` | LIKE, UNLIKE |
| `E_SCHEMA_TYPE` | Number, String, Date, Boolean, ObjectId |

#### E_TABLE_PERMISSION - 12 permissoes

```typescript
export const E_TABLE_PERMISSION = {
  CREATE_TABLE: 'CREATE_TABLE',
  UPDATE_TABLE: 'UPDATE_TABLE',
  REMOVE_TABLE: 'REMOVE_TABLE',
  VIEW_TABLE: 'VIEW_TABLE',
  CREATE_FIELD: 'CREATE_FIELD',
  UPDATE_FIELD: 'UPDATE_FIELD',
  REMOVE_FIELD: 'REMOVE_FIELD',
  VIEW_FIELD: 'VIEW_FIELD',
  CREATE_ROW: 'CREATE_ROW',
  UPDATE_ROW: 'UPDATE_ROW',
  REMOVE_ROW: 'REMOVE_ROW',
  VIEW_ROW: 'VIEW_ROW',
} as const;
```

### Tipos de Entidade Principais

```typescript
export type IUser = Merge<Base, {
  name: string;
  email: string;
  password: string;
  status: ValueOf<typeof E_USER_STATUS>;
  group: IGroup;
}>;

export type ITable = Merge<Base, {
  _schema: ITableSchema;
  name: string;
  description: string | null;
  logo: IStorage | null;
  slug: string;
  fields: IField[];
  type: ValueOf<typeof E_TABLE_TYPE>;
  style: ValueOf<typeof E_TABLE_STYLE>;
  visibility: ValueOf<typeof E_TABLE_VISIBILITY>;
  collaboration: ValueOf<typeof E_TABLE_COLLABORATION>;
  administrators: IUser[];
  owner: IUser;
  fieldOrderList: string[];
  fieldOrderForm: string[];
  methods: ITableMethod;
  groups: IGroupConfiguration[];
}>;

export type IField = Merge<Base, {
  name: string;
  slug: string;
  type: ValueOf<typeof E_FIELD_TYPE>;
  required: boolean;
  multiple: boolean;
  format: ValueOf<typeof E_FIELD_FORMAT> | null;
  showInFilter: boolean;
  showInForm: boolean;
  showInDetail: boolean;
  showInList: boolean;
  widthInForm: number | null;
  widthInList: number | null;
  defaultValue: string | null;
  locked?: boolean;
  native?: boolean;
  relationship: IFieldConfigurationRelationship | null;
  dropdown: IDropdown[];
  category: ICategory[];
  group: IFieldConfigurationGroup | null;
}>;

export type IRow = Merge<Base, Record<string, any>>;
```

### Tipos de Paginacao e Busca

```typescript
export type ISearch = Merge<Record<string, unknown>, {
  page: number;
  perPage: number;
  search?: string;
  trashed?: 'true' | 'false';
  sub?: string;
}>;

export type IMeta = {
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
  firstPage: number;
};

export type Paginated<Entity> = {
  data: Entity[];
  meta: IMeta;
};
```

### FIELD_NATIVE_LIST - 5 campos nativos

Campos nativos sao criados automaticamente para toda tabela e nao podem ser editados pelo usuario:

| Slug | Tipo | Descricao |
|---|---|---|
| `_id` | IDENTIFIER | ID do registro |
| `creator` | CREATOR | Referencia ao usuario criador |
| `createdAt` | CREATED_AT | Data de criacao |
| `trashed` | TRASHED | Flag de lixeira |
| `trashedAt` | TRASHED_AT | Data de envio para lixeira |

---

## either.core.ts

Implementacao do padrao **Either** para tratamento funcional de erros. `Left` representa erro, `Right` representa sucesso.

```typescript
// ERROR
export class Left<L, R> {
  readonly value: L;
  constructor(value: L) { this.value = value; }
  isRight(): this is Right<L, R> { return false; }
  isLeft(): this is Left<L, R> { return true; }
}

// SUCCESS
export class Right<L, R> {
  readonly value: R;
  constructor(value: R) { this.value = value; }
  isRight(): this is Right<L, R> { return true; }
  isLeft(): this is Left<L, R> { return false; }
}

export type Either<L, R> = Left<L, R> | Right<L, R>;

// Helpers
export const left = <L, R>(value: L): Either<L, R> => new Left(value);
export const right = <L, R>(value: R): Either<L, R> => new Right(value);
```

**Exemplo de uso em um use case:**

```typescript
async function createUser(payload: UserCreatePayload): Promise<Either<HTTPException, IUser>> {
  const existing = await userRepository.findBy({ email: payload.email, exact: true });
  if (existing) {
    return left(HTTPException.Conflict('Email ja cadastrado'));
  }
  const user = await userRepository.create(payload);
  return right(user);
}
```

---

## exception.core.ts

Classe `HTTPException` que estende `Error` com suporte a todos os codigos HTTP de erro (4xx e 5xx).

### Interface

```typescript
export interface Exception {
  message: string;
  code: number;
  cause: string;
  errors?: Record<string, string>;
}
```

### Classe HTTPException

```typescript
export default class HTTPException extends Error {
  public readonly code: number;
  public override readonly cause: string;
  public errors?: Record<string, string>;

  protected constructor(payload: Exception) {
    super(payload.message);
    this.cause = payload.cause;
    this.code = payload.code;
    if (payload.errors) this.errors = payload.errors;
  }

  // Factory methods estaticos
  static BadRequest(message?, cause?, errors?): HTTPException;     // 400
  static Unauthorized(message?, cause?): HTTPException;            // 401
  static Forbidden(message?, cause?): HTTPException;               // 403
  static NotFound(message?, cause?): HTTPException;                // 404
  static Conflict(message?, cause?): HTTPException;                // 409
  static UnprocessableEntity(message?, cause?): HTTPException;     // 422
  static InternalServerError(message?, cause?): HTTPException;     // 500
  // ... e todos os demais codigos de 400 a 511
}
```

**Exemplo de uso:**

```typescript
throw HTTPException.BadRequest('Parametros invalidos', 'INVALID_PARAMETERS', {
  email: 'Email e obrigatorio',
  name: 'Nome deve ter no minimo 3 caracteres',
});
```

---

## di-registry.ts

Registro central de dependencias. Mapeia contratos abstratos para implementacoes Mongoose usando `fastify-decorators`.

```typescript
import { injectablesHolder } from 'fastify-decorators';

export function registerDependencies(): void {
  // 11 repositorios
  injectablesHolder.injectService(EvaluationContractRepository, EvaluationMongooseRepository);
  injectablesHolder.injectService(FieldContractRepository, FieldMongooseRepository);
  injectablesHolder.injectService(MenuContractRepository, MenuMongooseRepository);
  injectablesHolder.injectService(PermissionContractRepository, PermissionMongooseRepository);
  injectablesHolder.injectService(ReactionContractRepository, ReactionMongooseRepository);
  injectablesHolder.injectService(SettingContractRepository, SettingMongooseRepository);
  injectablesHolder.injectService(StorageContractRepository, StorageMongooseRepository);
  injectablesHolder.injectService(TableContractRepository, TableMongooseRepository);
  injectablesHolder.injectService(UserContractRepository, UserMongooseRepository);
  injectablesHolder.injectService(UserGroupContractRepository, UserGroupMongooseRepository);
  injectablesHolder.injectService(ValidationTokenContractRepository, ValidationTokenMongooseRepository);

  // 1 servico de email
  injectablesHolder.injectService(EmailContractService, NodemailerEmailService);
}
```

Para trocar de ORM ou provedor de email, basta alterar os imports e registros neste arquivo.

---

## controllers.ts

Auto-descoberta e carregamento de controllers. Escaneia recursivamente o diretorio `application/resources/` buscando arquivos `*.controller.ts`.

```typescript
const controllerPattern = /^(?!.*\.spec\.).*\.controller\.(ts|js)$/;

export async function loadControllers(): Promise<Controllers> {
  const controllers: Controllers = [];
  const controllersPath = join(process.cwd(), 'application/resources');
  const files = await readdir(controllersPath, { recursive: true });

  const controllerFiles = files
    .filter((file) => controllerPattern.test(file))
    .sort((a, b) => a.localeCompare(b));

  for (const file of controllerFiles) {
    const module = await import(join(controllersPath, file));
    controllers.push(module.default);
  }

  return controllers;
}
```

- Exclui arquivos `.spec.ts` (testes)
- Loga cada controller carregado em modo `development`
- Ordena controllers alfabeticamente para carregamento deterministico

---

## util.core.ts

Modulo central de funcoes utilitarias. Contem a logica de construcao dinamica de modelos Mongoose, queries e populates.

### PASSWORD_REGEX

```typescript
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/;
```

Exige: letra minuscula, maiuscula, digito e caractere especial.

### buildSchema(fields, groups?)

Converte um array de `IField[]` para `ITableSchema` compativel com Mongoose. Mapeia cada tipo de campo para o tipo de schema correspondente:

```typescript
export function buildSchema(fields: IField[], groups?: IGroupConfiguration[]): ITableSchema {
  const schema: ITableSchema = {};
  for (const field of fields) {
    // Pula _id e createdAt (nativos do Mongoose)
    if (field.type === E_FIELD_TYPE.IDENTIFIER || field.type === E_FIELD_TYPE.CREATED_AT) continue;
    Object.assign(schema, mapperSchema(field, groups));
  }
  return schema;
}
```

O `FieldTypeMapper` mapeia tipos de campo para tipos Mongoose:

| E_FIELD_TYPE | E_SCHEMA_TYPE |
|---|---|
| TEXT_SHORT, TEXT_LONG | String |
| DATE, CREATED_AT, TRASHED_AT | Date |
| FILE, RELATIONSHIP, USER, CREATOR | ObjectId |
| DROPDOWN, CATEGORY | String (array) |
| TRASHED | Boolean |
| FIELD_GROUP | Embedded (subdocumento) |

### buildTable(table)

Cria dinamicamente um modelo Mongoose a partir de um schema de tabela. Esta e a funcao central que permite ao LowCodeJS criar tabelas dinamicas.

```typescript
export async function buildTable(table): Promise<mongoose.Model<Entity>> {
  // 1. Remove modelo existente se houver
  if (mongoose.models[table.slug]) delete mongoose.models[table.slug];

  // 2. Processa schema - converte campos Embedded em subdocument schemas
  for (const [key, value] of Object.entries(table._schema)) {
    if (Array.isArray(value) && value[0]?.type === 'Embedded') {
      const subSchema = new mongoose.Schema(subSchemaDefinition, { _id: false });
      schemaDefinition[key] = [subSchema];
    }
  }

  // 3. Cria schema Mongoose com timestamps e virtuals
  const schema = new mongoose.Schema(schemaDefinition, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
  });

  // 4. Registra virtual populate para relacionamentos reversos
  const reverseRelationships = await findReverseRelationships(table.slug);
  for (const rel of reverseRelationships) {
    schema.virtual(rel.virtualName, {
      ref: rel.sourceTableSlug,
      localField: '_id',
      foreignField: rel.fieldSlug,
    });
  }

  // 5. Registra hooks beforeSave e afterSave (se houver codigo)
  if (table?.methods?.beforeSave?.code) {
    schema.pre('save', async function (next) { /* executa script */ });
  }
  if (table?.methods?.afterSave?.code) {
    schema.post('save', async function (doc, next) { /* executa script */ });
  }

  // 6. Cria modelo e colecao
  const model = mongoose.model<Entity>(table.slug, schema, table.slug);
  await model.createCollection();
  return model;
}
```

### buildPopulate(fields?, groups?, tableSlug?)

Constroi a cadeia de populate para relacionamentos. Suporta:

- **FILE**: Popula com modelo Storage
- **USER / CREATOR**: Popula com modelo User (select: `name email _id`)
- **REACTION**: Popula com subdocumento user
- **EVALUATION**: Popula com subdocumento user
- **RELATIONSHIP**: Popula recursivamente (busca tabela relacionada, constroi modelo, popula campos)
- **FIELD_GROUP**: Popula campos internos do grupo (User, Storage)
- **Relacionamentos reversos**: Via `findReverseRelationships()` e virtual populate

### buildQuery(params, fields, groups?, tableSlug?)

Constroi query MongoDB a partir dos parametros de filtro. Suporta:

- **Texto (TEXT_SHORT/LONG)**: Busca com `$regex` e normalizacao de acentos
- **Relacionamento/Dropdown/Category/User**: Filtro com `$in` (valores separados por virgula)
- **Datas**: Range com `$gte/$lte` usando sufixos `-initial` e `-final`
- **Campos embedded (FIELD_GROUP)**: Query com dot notation (`grupo.campo`)
- **Busca global (`search`)**: Aplica `$or` em todos os campos texto
- **Relacionamentos reversos**: Reverse lookup via colecao source

### buildOrder(query, fields)

Constroi objeto de ordenacao MongoDB a partir de parametros `order-{slug}`:

```typescript
// Entrada: { 'order-nome': 'asc', 'order-data': 'desc' }
// Saida: { nome: 'asc', data: 'desc' }
```

### normalize(search)

Cria regex insensivel a acentos para busca em portugues:

```typescript
export function normalize(search: string): string {
  return escapedSearch
    .replace(/a/gi, '[aáàâãä]')
    .replace(/e/gi, '[eéèêë]')
    .replace(/i/gi, '[iíìîï]')
    .replace(/o/gi, '[oóòôõö]')
    .replace(/u/gi, '[uúùûü]')
    .replace(/c/gi, '[cç]')
    .replace(/n/gi, '[nñ]');
}
```

### findReverseRelationships(tableSlug)

Encontra todas as tabelas que possuem campos RELATIONSHIP apontando para a tabela dada. Retorna array de `IReverseRelationship` com `sourceTableSlug`, `fieldSlug` e `virtualName`.

### getRelationship(fields)

Filtra campos que precisam de populate: `RELATIONSHIP`, `FILE`, `REACTION`, `EVALUATION`, `USER`, `CREATOR`.

---

## row-payload-validator.core.ts

Validacao de payload de registros (rows) contra as definicoes de campo.

### validateRowPayload(payload, fields, groups?, options?)

```typescript
export function validateRowPayload(
  payload: Record<string, unknown>,
  fields: IField[],
  groups?: IGroupConfiguration[],
  options: { skipMissing?: boolean } = {},
): Record<string, string> | null {
  // Retorna null se valido, ou mapa de erros { campo: mensagem }
}
```

### Validacao por tipo de campo

| Tipo | Validacao |
|---|---|
| TEXT_SHORT | `typeof string` + validacao de formato (EMAIL, URL, INTEGER, DECIMAL) |
| TEXT_LONG | `typeof string` |
| DATE | ISO 8601 valido |
| DROPDOWN | Array de strings |
| CATEGORY | Array de strings |
| FILE / RELATIONSHIP / USER | Array de ObjectId validos (regex 24 hex) |
| FIELD_GROUP | Array de objetos com validacao recursiva dos campos do grupo |
| REACTION / EVALUATION | Campos gerenciados pelo sistema, validacao ignorada |

### FORMAT_VALIDATORS

```typescript
const FORMAT_VALIDATORS: Record<string, { regex: RegExp; message: string }> = {
  [E_FIELD_FORMAT.EMAIL]:   { regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Formato de e-mail invalido' },
  [E_FIELD_FORMAT.URL]:     { regex: /^https?:\/\/.+/, message: 'Formato de URL invalido' },
  [E_FIELD_FORMAT.INTEGER]: { regex: /^-?\d+$/, message: 'Deve ser um numero inteiro' },
  [E_FIELD_FORMAT.DECIMAL]: { regex: /^-?\d+(\.\d+)?$/, message: 'Deve ser um numero decimal' },
};
```

---

## table/ - Subdiretorio de Execucao de Scripts

Permite a execucao de codigo JavaScript definido pelo usuario nos hooks `beforeSave` e `afterSave` de tabelas.

### types.ts

Define os tipos para o executor:

```typescript
export type ExecutionErrorType = 'syntax' | 'runtime' | 'timeout' | 'unknown';

export interface ExecutionResult {
  success: boolean;
  error?: ExecutionError;
  logs: string[];
}

export interface ExecutionContext {
  userAction: 'novo_registro' | 'editar_registro' | 'excluir_registro' | 'carregamento_formulario';
  executionMoment: 'carregamento_formulario' | 'antes_salvar' | 'depois_salvar';
  userId?: string;
  isNew?: boolean;
  tableInfo?: TableInfo;
}
```

### handler.ts

Ponto de entrada principal. Orquestra: construcao do sandbox, execucao do codigo, e retorno de resultados.

```typescript
export async function executeScript(params: ExecuteScriptParams): Promise<ExecutionResult> {
  const sandbox = buildSandbox({ doc, tableSlug, fields, context, logs });
  const result = await execute(code, sandbox, timeout);
  return result;
}
```

### executor.ts

Executa codigo em uma VM sandbox isolada usando `node:vm`:

```typescript
export async function execute(code: string, sandbox: SandboxGlobals, timeout = 5000): Promise<ExecutionResult> {
  const context = vm.createContext(sandbox);
  const script = new vm.Script(code, { filename: 'user-script.js' });
  const result = script.runInContext(context, { timeout, breakOnSigint: true });
  // Suporte a execucao async com timeout
  if (result instanceof Promise) {
    await Promise.race([result, createTimeoutPromise(timeout)]);
  }
}
```

### sandbox.ts

Constroi o ambiente sandbox com APIs disponiveis para scripts de usuario:

| API | Descricao |
|---|---|
| `field.get(slug)` | Obtem valor de um campo do documento |
| `field.set(slug, value)` | Define valor de um campo |
| `field.getAll()` | Retorna todos os campos |
| `context.action` | Acao do usuario (novo/editar/excluir) |
| `context.moment` | Momento de execucao (antes/depois salvar) |
| `context.isNew` | Se e um novo registro |
| `email.send(to, subject, body)` | Envia email |
| `email.sendTemplate(to, subject, message, data?)` | Envia email com template EJS |
| `utils.today()` / `utils.now()` | Data atual |
| `utils.formatDate(date, format?)` | Formata data |
| `utils.sha256(text)` | Hash SHA-256 |
| `utils.uuid()` | Gera UUID v4 |
| `console.log/warn/error` | Logging interceptado |

Builtins permitidos: `JSON`, `Date`, `Math`, `parseInt`, `parseFloat`, `Number`, `String`, `Boolean`, `Array`, `Object`, `RegExp`, `Map`, `Set`, `Promise`, `Error` e variantes, `encodeURI*`, `decodeURI*`.

### field-resolver.ts

Funcoes utilitarias para resolucao e conversao de valores de campos em tabelas dinamicas.

#### `normalizeSlug(slug: string): string`

Normaliza um slug convertendo hifens em underscores:

```typescript
export function normalizeSlug(slug: string): string {
  return slug.replace(/-/g, '_');
}
// Exemplo: 'data-nascimento' → 'data_nascimento'
```

#### `resolveFieldValue(doc: Record<string, any>, slug: string): any`

Resolve o valor de um campo no documento tentando 3 formatos de slug:

1. **Slug original** - tenta `doc[slug]` diretamente
2. **Com underscores** - converte hifens para underscores via `normalizeSlug()`
3. **Com hifens** - converte underscores para hifens

```typescript
export function resolveFieldValue(doc: Record<string, any>, slug: string): any {
  if (slug in doc) return doc[slug];
  const normalizedSlug = normalizeSlug(slug);
  if (normalizedSlug in doc) return doc[normalizedSlug];
  const hyphenSlug = slug.replace(/_/g, '-');
  if (hyphenSlug in doc) return doc[hyphenSlug];
  return undefined;
}
```

Retorna `undefined` caso nenhum formato seja encontrado no documento.

#### `convertValue(value: any): any`

Converte strings para tipos apropriados de forma inteligente:

| Entrada | Saida | Tipo |
|---|---|---|
| `"42"` | `42` | `number` |
| `"3.14"` | `3.14` | `number` |
| `"true"` / `"false"` | `true` / `false` | `boolean` |
| `"2024-01-15"` | `Date` object | `Date` |
| `"2024-01-15T10:30:00"` | `Date` object | `Date` |
| `null` / `undefined` | `null` / `undefined` | inalterado |
| valores nao-string | valor original | inalterado |

```typescript
export function convertValue(value: any): any {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'string') return value;
  // Boolean: "true"/"false" → true/false
  // Number: strings numericas → Number
  // Date: strings ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss) → Date
  return value;
}
```
