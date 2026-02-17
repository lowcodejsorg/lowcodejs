# Skill: Mongoose Model

O model no LowcodeJS e a camada de definicao do schema Mongoose que mapeia diretamente uma entidade do dominio para uma collection no MongoDB. Cada model define a estrutura dos documentos, validacoes a nivel de banco, relacionamentos via `ref`, e convencoes como soft delete e timestamps automaticos. O model e consumido exclusivamente pelo repository Mongoose correspondente.

---

## Estrutura do Arquivo

Cada model fica em seu proprio arquivo dentro da pasta `model/`:

```
backend/application/model/
  user.model.ts
  user-group.model.ts
  project.model.ts
  [entity].model.ts
```

O nome do arquivo segue o padrao `[entity].model.ts` em kebab-case, onde `[entity]` e o nome da entidade no singular.

---

## Template

```typescript
import mongoose from 'mongoose';
import { E_ENTITY_STATUS, Merge, type IEntity as Core } from '@application/core/entity.core';

// Tipo que combina a entidade core (sem _id) com mongoose.Document
type Entity = Merge<Omit<Core, '_id'>, mongoose.Document>;

export const Schema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },

    // Campos obrigatorios
    name: { type: String, required: true },

    // Campos com enum
    status: {
      type: String,
      enum: Object.values(E_ENTITY_STATUS),
      default: E_ENTITY_STATUS.INACTIVE,
    },

    // Relacionamentos
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'EntityGroup' },

    // Soft delete
    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  { timestamps: true, id: false },
);

// Re-uso do model existente OU criacao de um novo
export const Entity = (mongoose?.models?.Entity ||
  mongoose.model<Entity>('Entity', Schema, 'entities')) as mongoose.Model<Entity>;
```

---

## Exemplo Real

```typescript
import mongoose from 'mongoose';
import { E_USER_STATUS, Merge, type IUser as Core } from '@application/core/entity.core';

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
  { timestamps: true, id: false },
);

export const User = (mongoose?.models?.User ||
  mongoose.model<Entity>('User', Schema, 'users')) as mongoose.Model<Entity>;
```

### Detalhes do exemplo

- **`_id` com `auto: true`**: O MongoDB gera o ObjectId automaticamente. Nao use `default: new ObjectId()` pois geraria o mesmo ID para todos os documentos.
- **`E_USER_STATUS` com `Object.values()`**: Garante que o enum do schema esta sempre sincronizado com o enum definido em `entity.core.ts`.
- **`ref: 'UserGroup'`**: Referencia ao model `UserGroup` para popular o campo `group` com `populate()` no repository.
- **`trashed` e `trashedAt`**: Convencao de soft delete. Documentos "deletados" recebem `trashed: true` e `trashedAt: new Date()` ao inves de serem removidos do banco.
- **`timestamps: true`**: Mongoose cria automaticamente os campos `createdAt` e `updatedAt`.
- **`id: false`**: Desabilita a criacao do virtual `id` (string) pelo Mongoose, ja que usamos `_id` (ObjectId) diretamente.
- **Re-uso do model**: O pattern `mongoose?.models?.User || mongoose.model(...)` evita o erro `OverwriteModelError` quando o arquivo e importado multiplas vezes (comum em hot reload e testes).
- **Cast `as mongoose.Model<Entity>`**: Garante que o TypeScript reconhece o tipo correto do model independente de qual branch do `||` foi executada.

---

## Regras e Convencoes

1. **`_id` sempre e `ObjectId` com `auto: true`** -- nunca use `String`, `Number` ou `UUID` como tipo do `_id`. O auto-generate do MongoDB e o padrao do projeto.

2. **`timestamps: true` e `id: false` sao obrigatorios** no segundo argumento do `new mongoose.Schema()`. Isso garante consistencia entre todos os models.

3. **Re-uso do model existente** -- sempre use o pattern `mongoose?.models?.ModelName || mongoose.model(...)` para evitar `OverwriteModelError`.

4. **Enums usam `Object.values()`** -- nunca liste os valores manualmente no array `enum`. Importe o enum de `entity.core.ts` e use `Object.values(E_ENTITY_STATUS)`.

5. **Relacionamentos usam `ref`** -- o valor do `ref` deve ser exatamente o nome usado no `mongoose.model('NomeDoModel', ...)` do model referenciado.

6. **Soft delete com `trashed` e `trashedAt`** -- toda entidade que suporta exclusao deve ter esses dois campos. `trashed` e `Boolean` com default `false`, `trashedAt` e `Date` com default `null`.

7. **O terceiro argumento de `mongoose.model()`** deve ser o nome da collection no MongoDB em lowercase e no plural (ex: `'users'`, `'user-groups'`, `'projects'`).

8. **O tipo `Entity`** deve ser `Merge<Omit<Core, '_id'>, mongoose.Document>` -- o `Omit<Core, '_id'>` remove o `_id` da interface core porque o Mongoose define o seu proprio `_id` via `Document`.

9. **Exportacoes nomeadas** -- exporte `Schema` e o model (`User`, `Project`, etc.) como named exports, nunca default export.

---

## Checklist

- [ ] O arquivo esta em `backend/application/model/[entity].model.ts`
- [ ] O tipo `Entity` usa `Merge<Omit<Core, '_id'>, mongoose.Document>`
- [ ] O campo `_id` esta definido como `{ type: mongoose.Schema.Types.ObjectId, auto: true }`
- [ ] `timestamps: true` e `id: false` estao no options do Schema
- [ ] O model usa o pattern de re-uso: `mongoose?.models?.X || mongoose.model<Entity>(...)`
- [ ] O cast `as mongoose.Model<Entity>` esta presente
- [ ] Enums usam `Object.values(E_ENUM)` e nao arrays manuais
- [ ] Relacionamentos usam `ref` com o nome exato do model referenciado
- [ ] Campos de soft delete (`trashed`, `trashedAt`) estao presentes se a entidade suporta exclusao
- [ ] O terceiro argumento de `mongoose.model()` e o nome da collection em lowercase plural
- [ ] O `Schema` e o model sao named exports

---

## Erros Comuns

| Erro | Problema | Correcao |
|------|----------|----------|
| `mongoose.model('User', Schema)` sem re-uso | Causa `OverwriteModelError` em hot reload e testes | Usar `mongoose?.models?.User \|\| mongoose.model(...)` |
| `_id: { type: String }` | Tipo errado para o `_id`, quebra populate e queries | Usar `mongoose.Schema.Types.ObjectId` com `auto: true` |
| `enum: ['ACTIVE', 'INACTIVE']` hardcoded | Valores ficam desincronizados com o enum em `entity.core.ts` | Usar `enum: Object.values(E_ENTITY_STATUS)` |
| `{ timestamps: false }` ou omissao | Campos `createdAt` e `updatedAt` nao sao criados automaticamente | Sempre incluir `{ timestamps: true, id: false }` |
| `ref: 'user-group'` com nome errado | `populate()` falha silenciosamente retornando `null` | Usar o nome exato do model: `ref: 'UserGroup'` |
| `export default mongoose.model(...)` | Inconsistente com o padrao do projeto | Usar named export: `export const User = ...` |
| Omitir `trashed` e `trashedAt` | Impossibilita soft delete para a entidade | Adicionar ambos os campos com seus defaults |
| `Merge<Core, mongoose.Document>` sem `Omit` | Conflito de tipos no `_id` entre a interface core e o Document | Usar `Merge<Omit<Core, '_id'>, mongoose.Document>` |

---

> **Cross-references:** ver `009-skill-repository.md` para como o repository Mongoose consome o model e utiliza o Schema para queries e populacao.
