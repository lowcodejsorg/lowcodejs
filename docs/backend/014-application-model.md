# Modelos Mongoose

O diretorio `model/` contem 11 modelos Mongoose que definem o schema de persistencia no MongoDB. Todos os modelos seguem o padrao `{ timestamps: true, id: false }` e incluem campos de soft-delete (`trashed`, `trashedAt`).

---

## Padrao Comum

Todos os modelos compartilham a seguinte estrutura:

```typescript
type Entity = Merge<Omit<CoreType, '_id'>, mongoose.Document>;

export const Schema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    // ... campos especificos do modelo
    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  {
    timestamps: true,  // Adiciona createdAt e updatedAt automaticamente
    id: false,         // Desabilita o virtual 'id' (usa apenas _id)
  },
);

export const ModelName = (mongoose?.models?.ModelName ||
  mongoose.model<Entity>('ModelName', Schema, 'collection-name')) as mongoose.Model<Entity>;
```

O padrao `mongoose?.models?.ModelName || mongoose.model(...)` previne erros de re-registro do modelo em hot-reload durante desenvolvimento.

---

## 1. User (collection: `users`)

Modelo de usuario do sistema.

```typescript
export const Schema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  status: {
    type: String,
    enum: Object.values(E_USER_STATUS),    // ACTIVE | INACTIVE
    default: E_USER_STATUS.INACTIVE,
  },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'UserGroup' },
  trashed: { type: Boolean, default: false },
  trashedAt: { type: Date, default: null },
}, { timestamps: true, id: false });
```

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| name | String | Sim | Nome do usuario |
| email | String | Sim | Email (unico) |
| password | String | Sim | Senha (hash bcrypt) |
| status | String (enum) | Nao | ACTIVE ou INACTIVE (default: INACTIVE) |
| group | ObjectId (ref UserGroup) | Nao | Grupo de permissoes |

---

## 2. UserGroup (collection: `user-groups`)

Grupo de usuarios com permissoes associadas.

```typescript
export const Schema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: { type: String },
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
  trashed: { type: Boolean, default: false },
  trashedAt: { type: Date, default: null },
}, { timestamps: true, id: false });
```

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| name | String | Sim | Nome do grupo |
| slug | String | Sim | Identificador unico (ex: `administrator`, `registered`) |
| description | String | Nao | Descricao |
| permissions | ObjectId[] (ref Permission) | Nao | Lista de permissoes associadas |

---

## 3. Permission (collection: `permissions`)

Permissao individual que pode ser associada a grupos.

```typescript
export const Schema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: { type: String, default: null },
  trashed: { type: Boolean, default: false },
  trashedAt: { type: Date, default: null },
}, { timestamps: true, id: false });
```

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| name | String | Sim | Nome da permissao |
| slug | String | Sim | Identificador unico (ex: `CREATE_TABLE`, `VIEW_ROW`) |
| description | String | Nao | Descricao |

---

## 4. Table (collection: `tables`)

Modelo central do LowCodeJS. Representa uma tabela dinamica criada pelo usuario.

```typescript
// Subdocumento: configuracao de grupo de campos
const GroupConfiguration = new mongoose.Schema({
  slug: { type: String, required: true },
  name: { type: String, required: true },
  fields: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Field' }],
  _schema: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { _id: true, timestamps: true, id: false });

// Subdocumento: metodos (hooks de script)
const Methods = new mongoose.Schema({
  onLoad: { code: { type: String, default: null } },
  beforeSave: { code: { type: String, default: null } },
  afterSave: { code: { type: String, default: null } },
}, { _id: false });

export const Schema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  _schema: { type: mongoose.Schema.Types.Mixed },
  name: { type: String, required: true },
  description: { type: String, default: null },
  logo: { type: mongoose.Schema.Types.ObjectId, ref: 'Storage', default: null },
  slug: { type: String, required: true },
  fields: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Field' }],
  type: { type: String, enum: Object.values(E_TABLE_TYPE), default: 'TABLE' },
  style: { type: String, enum: Object.values(E_TABLE_STYLE), default: 'LIST' },
  visibility: { type: String, enum: Object.values(E_TABLE_VISIBILITY), default: 'RESTRICTED' },
  collaboration: { type: String, enum: Object.values(E_TABLE_COLLABORATION), default: 'RESTRICTED' },
  administrators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fieldOrderList: { type: [String], default: [] },
  fieldOrderForm: { type: [String], default: [] },
  methods: { type: Methods, default: { onLoad: { code: null }, beforeSave: { code: null }, afterSave: { code: null } } },
  groups: { type: [GroupConfiguration], default: [] },
  trashed: { type: Boolean, default: false },
  trashedAt: { type: Date, default: null },
}, { timestamps: true, id: false });
```

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| _schema | Mixed | Nao | Schema Mongoose gerado dinamicamente |
| name | String | Sim | Nome da tabela |
| description | String | Nao | Descricao |
| logo | ObjectId (ref Storage) | Nao | Logo da tabela |
| slug | String | Sim | Identificador unico na URL |
| fields | ObjectId[] (ref Field) | Nao | Lista de campos |
| type | String (enum) | Nao | TABLE ou FIELD_GROUP |
| style | String (enum) | Nao | Estilo visual (LIST, GALLERY, KANBAN, etc.) |
| visibility | String (enum) | Nao | Nivel de visibilidade |
| collaboration | String (enum) | Nao | Modo de colaboracao |
| administrators | ObjectId[] (ref User) | Nao | Administradores da tabela |
| owner | ObjectId (ref User) | Sim | Dono da tabela |
| fieldOrderList | String[] | Nao | Ordem dos campos na listagem |
| fieldOrderForm | String[] | Nao | Ordem dos campos no formulario |
| methods | Embedded (Methods) | Nao | Scripts onLoad/beforeSave/afterSave |
| groups | Embedded[] (GroupConfiguration) | Nao | Configuracoes de grupos de campos |

---

## 5. Field (collection: `fields`)

Definicao de um campo de uma tabela.

```typescript
// Subdocumento: configuracao de relacionamento
const Relationship = new mongoose.Schema({
  table: {
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    slug: { type: String, required: true },
  },
  field: {
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    slug: { type: String, required: true },
  },
  order: { type: String, enum: ['asc', 'desc'], default: 'asc' },
}, { _id: false });

// Subdocumento: referencia a grupo
const Group = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, default: null },
  slug: { type: String, default: null },
}, { _id: false });

// Subdocumento: opcao de dropdown
const Dropdown = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  color: { type: String, default: null },
}, { _id: false });

// Subdocumento: opcao de categoria (com filhos recursivos)
const Category = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  children: { type: [mongoose.Schema.Types.Mixed], default: [] },
}, { _id: false });
```

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| name | String | Sim | Nome exibido |
| slug | String | Nao | Identificador unico |
| type | String (enum E_FIELD_TYPE) | Sim | Tipo do campo (15 tipos) |
| required | Boolean | Nao | Se e obrigatorio (default: false) |
| multiple | Boolean | Nao | Se aceita multiplos valores (default: false) |
| format | String (enum E_FIELD_FORMAT) | Nao | Formato de validacao |
| showInFilter | Boolean | Nao | Exibir no filtro (default: false) |
| showInForm | Boolean | Nao | Exibir no formulario (default: false) |
| showInDetail | Boolean | Nao | Exibir no detalhe (default: false) |
| showInList | Boolean | Nao | Exibir na listagem (default: false) |
| widthInForm | Number | Nao | Largura no formulario (default: 50) |
| widthInList | Number | Nao | Largura na listagem (default: 10) |
| locked | Boolean | Nao | Se esta travado para edicao (default: false) |
| native | Boolean | Nao | Se e campo nativo do sistema (default: false) |
| defaultValue | String | Nao | Valor padrao |
| relationship | Embedded (Relationship) | Nao | Config de relacionamento |
| dropdown | Embedded[] (Dropdown) | Nao | Opcoes do dropdown |
| category | Embedded[] (Category) | Nao | Categorias hierarquicas |
| group | Embedded (Group) | Nao | Referencia ao grupo de campos |

---

## 6. Storage (collection: `storage`)

Arquivo armazenado no sistema.

```typescript
export const Schema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  url: { type: String, required: true },
  filename: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  originalName: { type: String, required: true },
  trashed: { type: Boolean, default: false },
  trashedAt: { type: Date, default: null },
}, { timestamps: true, id: false });
```

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| url | String | Sim | URL de acesso ao arquivo |
| filename | String | Sim | Nome gerado no servidor |
| mimetype | String | Sim | Tipo MIME (ex: `image/webp`, `application/pdf`) |
| size | Number | Sim | Tamanho em bytes |
| originalName | String | Sim | Nome original do upload |

---

## 7. Menu (collection: `menus`)

Item de menu para navegacao.

```typescript
export const Schema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  type: {
    type: String,
    enum: Object.values(E_MENU_ITEM_TYPE),  // TABLE | PAGE | FORM | EXTERNAL | SEPARATOR
    default: E_MENU_ITEM_TYPE.SEPARATOR,
    required: true,
  },
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', default: null },
  html: { type: String, default: null },
  url: { type: String, default: null },
  trashed: { type: Boolean, default: false },
  trashedAt: { type: Date, default: null },
}, { timestamps: true, id: false });
```

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| name | String | Sim | Nome exibido |
| slug | String | Sim | Identificador unico |
| type | String (enum) | Sim | Tipo do item de menu |
| table | ObjectId (ref Table) | Nao | Tabela associada (para TABLE e FORM) |
| parent | ObjectId (ref Menu) | Nao | Item pai para hierarquia |
| html | String | Nao | Conteudo HTML (para tipo PAGE) |
| url | String | Nao | URL externa (para tipo EXTERNAL) |

---

## 8. Reaction (collection: `reactions`)

Reacao (curtida/descurtida) de um usuario em um registro.

```typescript
export const Schema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: Object.values(E_REACTION_TYPE),  // LIKE | UNLIKE
    default: E_REACTION_TYPE.LIKE,
    required: true,
  },
  trashed: { type: Boolean, default: false },
  trashedAt: { type: Date, default: null },
}, { timestamps: true, id: false });
```

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| user | ObjectId (ref User) | Nao | Usuario que reagiu |
| type | String (enum) | Sim | LIKE ou UNLIKE |

---

## 9. Evaluation (collection: `evaluations`)

Avaliacao numerica de um usuario em um registro.

```typescript
export const Schema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  value: { type: Number, default: 0 },
  trashed: { type: Boolean, default: false },
  trashedAt: { type: Date, default: null },
}, { timestamps: true, id: false });
```

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| user | ObjectId (ref User) | Nao | Usuario avaliador |
| value | Number | Nao | Valor da avaliacao (default: 0) |

---

## 10. ValidationToken (collection: `validation-tokens`)

Token de validacao (ex: confirmacao de email, reset de senha).

```typescript
export const Schema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  code: { type: String, required: true },
  status: {
    type: String,
    enum: Object.values(E_TOKEN_STATUS),  // REQUESTED | EXPIRED | VALIDATED
    default: E_TOKEN_STATUS.REQUESTED,
    required: true,
  },
  trashed: { type: Boolean, default: false },
  trashedAt: { type: Date, default: null },
}, { timestamps: true, id: false });
```

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| user | ObjectId (ref User) | Sim | Usuario associado |
| code | String | Sim | Codigo de validacao |
| status | String (enum) | Sim | REQUESTED, EXPIRED ou VALIDATED |

---

## 11. Setting (collection: `settings`)

Configuracoes globais da aplicacao. Existe um unico documento nesta colecao.

```typescript
const Schema = new mongoose.Schema({
  LOCALE: { type: String, default: 'pt-br' },
  FILE_UPLOAD_MAX_SIZE: { type: Number, default: 10485760 },         // 10MB
  FILE_UPLOAD_ACCEPTED: { type: String, default: 'jpg;jpeg;png;pdf' },
  FILE_UPLOAD_MAX_FILES_PER_UPLOAD: { type: Number, default: 10 },
  PAGINATION_PER_PAGE: { type: Number, default: 20 },
  MODEL_CLONE_TABLES: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Table' }],
  LOGO_SMALL_URL: { type: String },
  LOGO_LARGE_URL: { type: String },
  EMAIL_PROVIDER_HOST: { type: String },
  EMAIL_PROVIDER_PORT: { type: Number },
  EMAIL_PROVIDER_USER: { type: String },
  EMAIL_PROVIDER_PASSWORD: { type: String },
  trashed: { type: Boolean, default: false },
  trashedAt: { type: Date, default: null },
}, { timestamps: true, id: false });
```

| Campo | Tipo | Default | Descricao |
|---|---|---|---|
| LOCALE | String | `pt-br` | Idioma da aplicacao |
| FILE_UPLOAD_MAX_SIZE | Number | `10485760` (10MB) | Tamanho maximo de upload |
| FILE_UPLOAD_ACCEPTED | String | `jpg;jpeg;png;pdf` | Extensoes aceitas (separadas por `;`) |
| FILE_UPLOAD_MAX_FILES_PER_UPLOAD | Number | `10` | Maximo de arquivos por upload |
| PAGINATION_PER_PAGE | Number | `20` | Itens por pagina |
| MODEL_CLONE_TABLES | ObjectId[] (ref Table) | `[]` | Tabelas modelo para clonagem |
| LOGO_SMALL_URL | String | - | URL do logo pequeno |
| LOGO_LARGE_URL | String | - | URL do logo grande |
| EMAIL_PROVIDER_HOST | String | - | Host SMTP |
| EMAIL_PROVIDER_PORT | Number | - | Porta SMTP |
| EMAIL_PROVIDER_USER | String | - | Usuario SMTP |
| EMAIL_PROVIDER_PASSWORD | String | - | Senha SMTP |

---

## Diagrama de Relacionamentos

```
User ─────────┐
  └─ group ──→ UserGroup
                  └─ permissions[] ──→ Permission

Table ────────┐
  ├─ fields[] ──→ Field
  │               ├─ relationship ──→ { table, field }
  │               ├─ dropdown[] (embedded)
  │               ├─ category[] (embedded)
  │               └─ group (embedded)
  ├─ owner ──→ User
  ├─ administrators[] ──→ User
  ├─ logo ──→ Storage
  ├─ groups[] (embedded GroupConfiguration)
  │   ├─ fields[] ──→ Field
  │   └─ _schema (Mixed)
  └─ methods (embedded Methods)

Menu ─────────┐
  ├─ table ──→ Table
  └─ parent ──→ Menu (auto-referencia)

Reaction ──→ user ──→ User
Evaluation ──→ user ──→ User
ValidationToken ──→ user ──→ User
```
