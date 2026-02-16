# Repositorios

O diretorio `repositories/` implementa a camada de acesso a dados seguindo o padrao de **contratos abstratos** com inversao de dependencias. Cada repositorio possui tres componentes: contrato abstrato, implementacao Mongoose (producao) e implementacao in-memory (testes).

---

## Padrao Arquitetural

```
repositories/
└── {entidade}/
    ├── {entidade}-contract.repository.ts      # Classe abstrata (contrato)
    ├── {entidade}-mongoose.repository.ts      # Implementacao Mongoose
    └── {entidade}-in-memory.repository.ts     # Implementacao para testes
```

### Contrato (Abstract Class)

Cada contrato define os metodos que toda implementacao deve satisfazer:

```typescript
export abstract class UserContractRepository {
  abstract create(payload: UserCreatePayload): Promise<IUser>;
  abstract findBy(payload: UserFindByPayload): Promise<IUser | null>;
  abstract findMany(payload?: UserQueryPayload): Promise<IUser[]>;
  abstract update(payload: UserUpdatePayload): Promise<IUser>;
  abstract delete(_id: string): Promise<void>;
  abstract count(payload?: UserQueryPayload): Promise<number>;
}
```

### Implementacao Mongoose

Usa o decorator `@Service()` do `fastify-decorators` e interage diretamente com os modelos Mongoose.

### Implementacao In-Memory

Armazena dados em arrays na memoria. Usada em testes unitarios para isolar a logica de negocio do banco de dados.

### Registro de Dependencias

O arquivo `di-registry.ts` conecta contratos a implementacoes:

```typescript
injectablesHolder.injectService(UserContractRepository, UserMongooseRepository);
```

---

## 1. UserContractRepository

**Diretorio:** `repositories/user/`

### Tipos de Payload

```typescript
export type UserCreatePayload = Merge<
  Pick<IUser, 'name' | 'email' | 'password'>,
  { group: string; status?: ValueOf<typeof E_USER_STATUS> }
>;

export type UserUpdatePayload = Merge<
  Merge<Pick<IUser, '_id'>, Partial<UserCreatePayload>>,
  { group?: string; status?: ValueOf<typeof E_USER_STATUS> }
>;

export type UserFindByPayload = Merge<
  Partial<Pick<IUser, '_id' | 'email'>>,
  { exact: boolean }
>;

export type UserQueryPayload = {
  page?: number;
  perPage?: number;
  search?: string;
  user?: Merge<Pick<IUser, '_id'>, { role: ValueOf<typeof E_ROLE> }>;
  _ids?: string[];
  status?: ValueOf<typeof E_USER_STATUS>;
  trashed?: boolean;
};
```

### Metodos

| Metodo | Assinatura | Descricao |
|---|---|---|
| `create` | `(payload: UserCreatePayload) => Promise<IUser>` | Cria usuario |
| `findBy` | `(payload: UserFindByPayload) => Promise<IUser \| null>` | Busca por `_id` ou `email` |
| `findMany` | `(payload?: UserQueryPayload) => Promise<IUser[]>` | Lista com filtros |
| `update` | `(payload: UserUpdatePayload) => Promise<IUser>` | Atualiza usuario |
| `delete` | `(_id: string) => Promise<void>` | Remove (soft-delete) |
| `count` | `(payload?: UserQueryPayload) => Promise<number>` | Conta registros |

---

## 2. UserGroupContractRepository

**Diretorio:** `repositories/user-group/`

### Tipos de Payload

```typescript
export type UserGroupCreatePayload = Merge<
  Pick<IGroup, 'name' | 'slug'>,
  { description?: string | null; permissions: string[] }
>;

export type UserGroupFindByPayload = Merge<
  Partial<Pick<IGroup, '_id' | 'slug'>>,
  { exact: boolean }
>;
```

### Metodos

| Metodo | Busca por | Descricao |
|---|---|---|
| `create` | - | Cria grupo |
| `findBy` | `_id` ou `slug` | Busca unica |
| `findMany` | Filtros de paginacao | Lista com filtros |
| `update` | `_id` | Atualiza grupo |
| `delete` | `_id` | Remove (soft-delete) |
| `count` | Filtros | Conta registros |

---

## 3. PermissionContractRepository

**Diretorio:** `repositories/permission/`

### Tipos de Payload

```typescript
export type PermissionCreatePayload = Pick<IPermission, 'name' | 'slug' | 'description'>;

export type PermissionFindByPayload = Merge<
  Partial<Pick<IPermission, '_id' | 'slug'>>,
  { exact: boolean }
>;
```

### Metodos

| Metodo | Busca por | Descricao |
|---|---|---|
| `create` | - | Cria permissao |
| `findBy` | `_id` ou `slug` | Busca unica |
| `findMany` | Filtros de paginacao | Lista com filtros |
| `update` | `_id` | Atualiza |
| `delete` | `_id` | Remove |
| `count` | Filtros | Conta registros |

---

## 4. TableContractRepository

**Diretorio:** `repositories/table/`

### Tipos de Payload

```typescript
export type TableCreatePayload = Merge<
  Pick<ITable, 'name' | 'slug'>,
  {
    _schema?: ITableSchema;
    description?: string | null;
    logo?: string | null;
    fields?: string[];
    type?: ValueOf<typeof E_TABLE_TYPE>;
    style?: ValueOf<typeof E_TABLE_STYLE>;
    visibility?: ValueOf<typeof E_TABLE_VISIBILITY>;
    collaboration?: ValueOf<typeof E_TABLE_COLLABORATION>;
    administrators?: string[];
    owner: string;
    fieldOrderList?: string[];
    fieldOrderForm?: string[];
    methods?: ITableMethod;
    groups?: IGroupConfiguration[];
  }
>;

export type TableUpdateManyPayload = {
  _ids: string[];
  type?: ValueOf<typeof E_TABLE_TYPE>;
  data: {
    style?: ValueOf<typeof E_TABLE_STYLE>;
    visibility?: ValueOf<typeof E_TABLE_VISIBILITY>;
    collaboration?: ValueOf<typeof E_TABLE_COLLABORATION>;
  };
};
```

### Metodos

| Metodo | Assinatura | Descricao |
|---|---|---|
| `create` | `(payload: TableCreatePayload) => Promise<ITable>` | Cria tabela |
| `findBy` | `(payload: TableFindByPayload) => Promise<ITable \| null>` | Busca por `_id` ou `slug` |
| `findMany` | `(payload?: TableQueryPayload) => Promise<ITable[]>` | Lista com filtros |
| `update` | `(payload: TableUpdatePayload) => Promise<ITable>` | Atualiza tabela |
| `updateMany` | `(payload: TableUpdateManyPayload) => Promise<void>` | Atualiza multiplas tabelas |
| `delete` | `(_id: string) => Promise<void>` | Remove |
| `count` | `(payload?: TableQueryPayload) => Promise<number>` | Conta |

---

## 5. FieldContractRepository

**Diretorio:** `repositories/field/`

### Tipos de Payload

```typescript
export type FieldCreatePayload = Pick<IField,
  'name' | 'slug' | 'type' | 'required' | 'multiple' | 'format' |
  'showInFilter' | 'showInForm' | 'showInDetail' | 'showInList' |
  'widthInForm' | 'widthInList' | 'locked' | 'native' | 'defaultValue' |
  'relationship' | 'dropdown' | 'category' | 'group'
>;
```

### Metodos

| Metodo | Assinatura | Descricao |
|---|---|---|
| `create` | `(payload: FieldCreatePayload) => Promise<IField>` | Cria campo |
| `createMany` | `(payloads: FieldCreatePayload[]) => Promise<IField[]>` | Cria multiplos campos |
| `findBy` | `(payload: FieldFindByPayload) => Promise<IField \| null>` | Busca por `_id` ou `slug` |
| `findMany` | `(payload?: FieldQueryPayload) => Promise<IField[]>` | Lista com filtros |
| `update` | `(payload: FieldUpdatePayload) => Promise<IField>` | Atualiza campo |
| `delete` | `(_id: string) => Promise<void>` | Remove |
| `count` | `(payload?: FieldQueryPayload) => Promise<number>` | Conta |

---

## 6. StorageContractRepository

**Diretorio:** `repositories/storage/`

### Tipos de Payload

```typescript
export type StorageCreatePayload = Pick<IStorage, 'url' | 'filename' | 'mimetype' | 'originalName' | 'size'>;

export type StorageFindByPayload = Merge<
  Partial<Pick<IStorage, '_id' | 'filename'>>,
  { exact: boolean }
>;
```

### Metodos

| Metodo | Assinatura | Descricao |
|---|---|---|
| `create` | `(payload: StorageCreatePayload) => Promise<IStorage>` | Cria registro |
| `createMany` | `(payload: StorageCreatePayload[]) => Promise<IStorage[]>` | Cria multiplos |
| `findBy` | `(payload: StorageFindByPayload) => Promise<IStorage \| null>` | Busca por `_id` ou `filename` |
| `findMany` | `(payload?: StorageQueryPayload) => Promise<IStorage[]>` | Lista com filtros |
| `update` | `(payload: StorageUpdatePayload) => Promise<IStorage>` | Atualiza |
| `delete` | `(_id: string) => Promise<IStorage \| null>` | Remove e retorna o registro |
| `count` | `(payload?: StorageQueryPayload) => Promise<number>` | Conta |

---

## 7. MenuContractRepository

**Diretorio:** `repositories/menu/`

### Tipos de Payload

```typescript
export type MenuCreatePayload = Merge<
  Pick<IMenu, 'name' | 'slug' | 'type'>,
  Partial<Pick<IMenu, 'table' | 'parent' | 'url' | 'html'>>
>;

export type MenuFindByPayload = Merge<
  Partial<Pick<IMenu, '_id' | 'slug' | 'parent'>>,
  { trashed?: boolean; exact: boolean }
>;
```

### Metodos

| Metodo | Busca por | Descricao |
|---|---|---|
| `create` | - | Cria item de menu |
| `findBy` | `_id`, `slug` ou `parent` | Busca unica |
| `findMany` | Filtros de paginacao + parent | Lista com filtros |
| `update` | `_id` | Atualiza |
| `delete` | `_id` | Remove |
| `count` | Filtros | Conta |

---

## 8. ReactionContractRepository

**Diretorio:** `repositories/reaction/`

### Tipos de Payload

```typescript
export type ReactionCreatePayload = Merge<Pick<IReaction, 'type'>, { user: string }>;

export type ReactionFindByPayload = Merge<
  Partial<Pick<IReaction, '_id'>>,
  { user?: string; exact: boolean }
>;
```

### Metodos

| Metodo | Busca por | Descricao |
|---|---|---|
| `create` | - | Cria reacao |
| `findBy` | `_id` ou `user` | Busca unica |
| `findMany` | Filtros + user + type | Lista |
| `update` | `_id` | Atualiza |
| `delete` | `_id` | Remove |
| `count` | Filtros | Conta |

---

## 9. EvaluationContractRepository

**Diretorio:** `repositories/evaluation/`

### Tipos de Payload

```typescript
export type EvaluationCreatePayload = Merge<Pick<IEvaluation, 'value'>, { user: string }>;

export type EvaluationFindByPayload = Merge<
  Partial<Pick<IEvaluation, '_id'>>,
  { user?: string; exact: boolean }
>;
```

### Metodos

| Metodo | Busca por | Descricao |
|---|---|---|
| `create` | - | Cria avaliacao |
| `findBy` | `_id` ou `user` | Busca unica |
| `findMany` | Filtros + user | Lista |
| `update` | `_id` | Atualiza |
| `delete` | `_id` | Remove |
| `count` | Filtros | Conta |

---

## 10. SettingContractRepository

**Diretorio:** `repositories/setting/`

Este repositorio e o mais simples, com apenas 2 metodos. A colecao `settings` contem um unico documento com as configuracoes globais.

### Tipos de Payload

```typescript
export type SettingUpdatePayload = Partial<
  Merge<Omit<ISetting, 'MODEL_CLONE_TABLES'>, { MODEL_CLONE_TABLES?: string[] }>
>;
```

### Metodos

| Metodo | Assinatura | Descricao |
|---|---|---|
| `get` | `() => Promise<ISetting \| null>` | Retorna as configuracoes globais |
| `update` | `(payload: SettingUpdatePayload) => Promise<ISetting>` | Atualiza configuracoes |

---

## 11. ValidationTokenContractRepository

**Diretorio:** `repositories/validation-token/`

### Tipos de Payload

```typescript
export type ValidationTokenCreatePayload = Merge<
  Pick<IValidationToken, 'code' | 'status'>,
  { user: string }
>;

export type ValidationTokenFindByPayload = Merge<
  Partial<Pick<IValidationToken, '_id' | 'code'>>,
  { user?: string; exact: boolean }
>;
```

### Metodos

| Metodo | Busca por | Descricao |
|---|---|---|
| `create` | - | Cria token de validacao |
| `findBy` | `_id`, `code` ou `user` | Busca unica |
| `findMany` | Filtros + user + status | Lista |
| `update` | `_id` | Atualiza |
| `delete` | `_id` | Remove |
| `count` | Filtros | Conta |

---

## Resumo Comparativo

| Repositorio | Metodos | Busca por | Especial |
|---|---|---|---|
| User | 6 | `_id`, `email` | Filtro por status, role |
| UserGroup | 6 | `_id`, `slug` | Filtro por role do usuario |
| Permission | 6 | `_id`, `slug` | - |
| Table | 7 | `_id`, `slug` | `updateMany`, filtro por type/owner |
| Field | 7 | `_id`, `slug` | `createMany`, filtro por type |
| Storage | 7 | `_id`, `filename` | `createMany`, filtro por mimetype |
| Menu | 6 | `_id`, `slug`, `parent` | Filtro por parent |
| Reaction | 6 | `_id`, `user` | Filtro por type |
| Evaluation | 6 | `_id`, `user` | - |
| Setting | 2 | - | Apenas `get` e `update` |
| ValidationToken | 6 | `_id`, `code`, `user` | Filtro por status |
