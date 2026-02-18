# Skill: Model (Mongoose Schema)

O model no projeto e definido como um arquivo individual por entidade em `application/model/[entity].model.ts`. Cada arquivo exporta um Mongoose Schema e o Model correspondente usando o singleton pattern para evitar recompilacao. O schema define campos, tipos, relacionamentos via `ref`, enums via `Object.values()`, e usa `timestamps: true` para `createdAt`/`updatedAt` automaticos. O `_id` e `ObjectId` auto-gerado pelo MongoDB. Soft delete usa `trashed: Boolean` + `trashedAt: Date`.

---

## Estrutura do Arquivo

Cada entidade tem seu proprio arquivo de model:

```
backend/
  application/
    model/
      user.model.ts              <-- model do User
      user-group.model.ts        <-- model do UserGroup
      table.model.ts             <-- model do Table
      storage.model.ts           <-- model do Storage
      [entity].model.ts          <-- um arquivo por entidade
  config/
    database.config.ts           <-- MongooseConnect + imports dos models
```

O arquivo `config/database.config.ts` importa todos os models para garantir o registro no Mongoose antes da conexao.

---

## Template

```typescript
// application/model/[entity].model.ts

import mongoose from 'mongoose';

import {
  E_ENTITY_STATUS,
  Merge,
  type IEntity as Core,
} from '@application/core/entity.core';

type Entity = Merge<Omit<Core, '_id'>, mongoose.Document>;

export const Schema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },

    name: { type: String, required: true },
    description: { type: String, default: null },
    status: {
      type: String,
      enum: Object.values(E_ENTITY_STATUS),
      default: E_ENTITY_STATUS.ACTIVE,
    },

    // Relacionamento belongsTo (ref)
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },

    // Relacionamento hasMany (array de refs)
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],

    // Soft delete
    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    id: false,
  },
);

export const Entity = (mongoose?.models?.Entity ||
  mongoose.model<Entity>('Entity', Schema, 'entities')) as mongoose.Model<Entity>;
```

---

## Exemplo Real

```typescript
// application/model/user.model.ts
import mongoose from 'mongoose';

import {
  E_USER_STATUS,
  Merge,
  type IUser as Core,
} from '@application/core/entity.core';

type Entity = Merge<Omit<Core, '_id'>, mongoose.Document>;

export const Schema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },

    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(E_USER_STATUS),
      default: E_USER_STATUS.INACTIVE,
    },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'UserGroup' },

    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    id: false,
  },
);

export const User = (mongoose?.models?.User ||
  mongoose.model<Entity>('User', Schema, 'users')) as mongoose.Model<Entity>;
```

```typescript
// application/model/table.model.ts (trecho -- model com subdocuments e arrays de refs)
import mongoose from 'mongoose';

import {
  E_TABLE_TYPE,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
  E_TABLE_COLLABORATION,
  Merge,
  type ITable as Core,
} from '@application/core/entity.core';

type Entity = Merge<Omit<Core, '_id'>, mongoose.Document>;

const GroupConfiguration = new mongoose.Schema(
  {
    slug: { type: String, required: true },
    name: { type: String, required: true },
    fields: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Field' }],
    _schema: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: true, timestamps: true, id: false },
);

export const Schema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String, default: null },
    type: {
      type: String,
      enum: Object.values(E_TABLE_TYPE),
      default: E_TABLE_TYPE.TABLE,
    },
    visibility: {
      type: String,
      enum: Object.values(E_TABLE_VISIBILITY),
      default: E_TABLE_VISIBILITY.RESTRICTED,
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fields: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Field' }],
    groups: { type: [GroupConfiguration], default: [] },

    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    id: false,
  },
);

export const Table = (mongoose?.models?.Table ||
  mongoose.model<Entity>('Table', Schema, 'tables')) as mongoose.Model<Entity>;
```

### Detalhes do exemplo

- **`_id: { type: mongoose.Schema.Types.ObjectId, auto: true }`**: todo model usa ObjectId como chave primaria, gerado automaticamente pelo MongoDB.
- **`timestamps: true`**: o Mongoose adiciona automaticamente `createdAt` e `updatedAt` (em camelCase) a cada documento.
- **`id: false`**: desabilita o getter virtual `id` do Mongoose, evitando confusao com `_id`.
- **`type: String, enum: Object.values(E_ENTITY_STATUS)`**: enums sao definidos como constantes TypeScript em `entity.core.ts` e validados pelo Mongoose via `enum`.
- **`{ type: mongoose.Schema.Types.ObjectId, ref: 'ModelName' }`**: define relacionamento belongsTo via referencia.
- **`[{ type: mongoose.Schema.Types.ObjectId, ref: 'ModelName' }]`**: define relacionamento hasMany via array de referencias.
- **`trashed: Boolean` + `trashedAt: Date`**: convencao de soft delete. Registros "deletados" recebem `trashed: true` e `trashedAt` com timestamp.
- **Singleton pattern**: `mongoose?.models?.Entity || mongoose.model<Entity>(...)` previne erro `OverwriteModelError` quando o model e importado multiplas vezes (ex.: hot reload, testes).
- **`type Entity = Merge<Omit<Core, '_id'>, mongoose.Document>`**: combina a interface da entidade (sem `_id` pois o Document ja fornece) com o tipo Document do Mongoose.
- **`mongoose.Schema.Types.Mixed`**: tipo para dados semi-estruturados (equivalente a JSON).

---

## Registro dos Models

O arquivo `config/database.config.ts` importa todos os models para garantir registro:

```typescript
// config/database.config.ts
import mongoose from 'mongoose';
import { Env } from '@start/env';

// Importar todos os models para garantir registro
import '@application/model/user.model';
import '@application/model/user-group.model';
import '@application/model/table.model';
import '@application/model/storage.model';
// ... demais models

export async function MongooseConnect(): Promise<void> {
  try {
    await mongoose.connect(Env.DATABASE_URL, {
      autoCreate: true,
      dbName: Env.DB_NAME,
    });
  } catch (error) {
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
}
```

---

## Regras e Convencoes

1. **Um arquivo por entidade** -- cada model vive em `application/model/[entity].model.ts`. Nunca centralize multiplos models em um unico arquivo.

2. **`_id: ObjectId` auto-gerado** -- nunca use UUID, autoincrement ou qualquer outro tipo de ID. ObjectId e o padrao do projeto.

3. **Soft delete com `trashed: Boolean` + `trashedAt: Date`** -- toda entidade que suporta exclusao deve ter `trashed` (default `false`) e `trashedAt` (default `null`). Quando `trashed: true`, o registro esta "deletado".

4. **`timestamps: true` obrigatorio** -- todo schema deve incluir `timestamps: true` nas options. Isso gera `createdAt` e `updatedAt` automaticamente (camelCase, nao snake_case).

5. **`id: false` obrigatorio** -- desabilita o getter virtual `id` para evitar confusao com `_id`.

6. **Enums via `Object.values(E_CONSTANT)`** -- enums sao definidos em `entity.core.ts` e usados no schema com `enum: Object.values(E_ENUM)`. Nunca hardcode arrays de strings.

7. **Refs para relacionamentos** -- use `{ type: mongoose.Schema.Types.ObjectId, ref: 'ModelName' }` para belongsTo. Use array `[{ type: ..., ref: ... }]` para hasMany.

8. **Singleton pattern obrigatorio** -- sempre use `mongoose?.models?.Name || mongoose.model<Entity>('Name', Schema, 'collection')` para evitar `OverwriteModelError`.

9. **Terceiro argumento do `mongoose.model()`** -- sempre passe o nome da collection como terceiro argumento (ex.: `'users'`, `'tables'`). Sem ele, o Mongoose pluraliza automaticamente e pode gerar nomes inesperados.

10. **Type alias `Entity`** -- use `type Entity = Merge<Omit<Core, '_id'>, mongoose.Document>` para combinar a interface core com o Document do Mongoose.

11. **Subdocument schemas** -- para campos complexos, crie schemas separados (ex.: `GroupConfiguration`) com `{ _id: true/false, timestamps: true/false, id: false }` conforme necessario.

---

## Checklist

- [ ] O arquivo esta em `backend/application/model/[entity].model.ts`.
- [ ] O schema usa `_id: { type: mongoose.Schema.Types.ObjectId, auto: true }`.
- [ ] As options do schema incluem `timestamps: true` e `id: false`.
- [ ] Soft delete usa `trashed: { type: Boolean, default: false }` e `trashedAt: { type: Date, default: null }`.
- [ ] Enums usam `enum: Object.values(E_ENUM)` com constantes de `entity.core.ts`.
- [ ] Relacionamentos usam `{ type: mongoose.Schema.Types.ObjectId, ref: 'ModelName' }`.
- [ ] O export usa singleton pattern: `mongoose?.models?.Name || mongoose.model<Entity>(...)`.
- [ ] O terceiro argumento de `mongoose.model()` especifica o nome da collection.
- [ ] O type alias `Entity` usa `Merge<Omit<Core, '_id'>, mongoose.Document>`.
- [ ] O model esta importado em `config/database.config.ts`.

---

## Erros Comuns

| Erro | Problema | Correcao |
|------|----------|----------|
| `OverwriteModelError` | Model registrado multiplas vezes (hot reload, testes) | Usar singleton: `mongoose?.models?.Name \|\| mongoose.model(...)` |
| `_id` como `String` ou UUID | Usando tipo errado para PK | Usar `{ type: mongoose.Schema.Types.ObjectId, auto: true }` |
| Soft delete com `deleted_at DateTime?` | Padrao Prisma, nao Mongoose | Usar `trashed: Boolean` + `trashedAt: Date` |
| `timestamps` em snake_case (`created_at`) | Mongoose gera `createdAt`/`updatedAt` em camelCase | Nao renomear; usar camelCase padrao |
| Enum como array hardcoded | Perde sincronismo com constantes TypeScript | Usar `enum: Object.values(E_CONSTANT)` |
| Faltou `id: false` nas options | Mongoose gera virtual `id` que conflita com `_id` | Adicionar `id: false` nas options do schema |
| Faltou terceiro argumento em `mongoose.model()` | Collection criada com nome pluralizado automaticamente | Passar nome da collection: `mongoose.model('User', Schema, 'users')` |
| Model nao registrado no `database.config.ts` | `populate()` falha com `MissingSchemaError` | Adicionar `import '@application/model/[entity].model'` no `database.config.ts` |
| `ref` apontando para nome errado | Populate nao encontra o model referenciado | Usar o nome exato registrado no `mongoose.model('NomeExato', ...)` |

---

> **Cross-references:** ver `009-skill-repository.md` para como o repository Mongoose consome o model para queries e populate de relacoes, e `config/database.config.ts` para como os models sao registrados na inicializacao.
