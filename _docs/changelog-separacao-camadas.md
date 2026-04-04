# Changelog: Separacao de Camadas + Testes Assertivos

**Data:** 2026-04-04
**Branch:** develop
**Commits:** `3f38105..7a79eab`
**Escopo:** 104 arquivos alterados | +8.217 linhas | -1.605 linhas

---

## Resumo Executivo

Refatoracao completa do backend para garantir isolamento rigoroso de camadas:
- **Model e model** — nenhum use-case ou service importa models do Mongoose
- **Repository e repository** — toda operacao de banco passa por contratos abstratos
- **Use-case e use-case** — logica de negocio pura, sem dependencias de infraestrutura

Alem disso, suite de testes expandida de **53 arquivos / 209 testes** para **79 arquivos / 351 testes**.

---

## Fase 1: Eliminacao de Vazamentos de Camada

### 1A. PermissionService — Model direto substituido por Repository

**Arquivo:** `services/permission/permission.service.ts`

**Antes:**
```typescript
import { User as UserModel } from '@application/model/user.model';

const user = await UserModel.findOne({ _id: userId })
  .populate({ path: 'group', populate: { path: 'permissions' } })
  .lean();

const group = user.group as { permissions?: IPermission[] } | undefined;
```

**Depois:**
```typescript
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';

constructor(private readonly userRepository: UserContractRepository) { super(); }

const user = await this.userRepository.findById(userId);

// IUser.group ja e tipado como IGroup com permissions: IPermission[]
if (!user.group?.permissions || !Array.isArray(user.group.permissions)) { ... }
```

**O que mudou:**
- Removido `import { User as UserModel }` — model nao e mais acessado diretamente
- Injetado `UserContractRepository` via constructor (DI do fastify-decorators)
- `UserModel.findOne().populate().lean()` substituido por `this.userRepository.findById()`
- O mongoose repository ja popula `group.permissions` internamente (linhas 17-19 do user-mongoose.repository.ts)
- Removido cast `as { permissions?: IPermission[] }` — `IUser.group` ja e `IGroup`
- Metodo `checkUserIsActive` tambem migrado para usar o repository

---

### 1B. TableAccessMiddleware — Model direto substituido por Repository

**Arquivo:** `middlewares/table-access.middleware.ts`

**Antes:**
```typescript
import { Table as TableModel } from '@application/model/table.model';

table = (await TableModel.findOne({ slug }).lean()) as unknown as ITable;
```

**Depois:**
```typescript
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';
import TableMongooseRepository from '@application/repositories/table/table-mongoose.repository';

const tableRepository = getInstanceByToken<TableContractRepository>(TableMongooseRepository);

const found = await tableRepository.findBySlug(slug);
if (!found) { throw HTTPException.NotFound(...); }
table = found;
```

**O que mudou:**
- Removido `import { Table as TableModel }`
- Usando `getInstanceByToken()` para obter o repository via DI (mesmo padrao ja usado para PermissionService na linha 32)
- `TableModel.findOne({ slug }).lean() as unknown as ITable` substituido por `tableRepository.findBySlug(slug)` que retorna `ITable | null` nativamente
- Eliminado o duplo cast `as unknown as ITable`

---

### 1C. SettingUpdateUseCase — mongoose extraido para utility

**Arquivos:**
- `core/object-id.util.ts` (NOVO)
- `resources/setting/update/update.use-case.ts`

**Antes:**
```typescript
import mongoose from 'mongoose';

mongoose.Types.ObjectId.isValid(id)
```

**Depois:**
```typescript
// core/object-id.util.ts (novo)
import mongoose from 'mongoose';
export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

// update.use-case.ts
import { isValidObjectId } from '@application/core/object-id.util';
isValidObjectId(id)
```

**O que mudou:**
- Criado `object-id.util.ts` — utility que encapsula a dependencia do mongoose
- Use-case nao importa mais `mongoose` diretamente
- A validacao de ObjectId e feita pela utility que vive na camada de infraestrutura

---

### 1D. Reaction/Evaluation — ObjectId do Mongoose removido

**Arquivos:**
- `resources/table-rows/reaction/reaction.use-case.ts`
- `resources/table-rows/evaluation/evaluation.use-case.ts`

**Antes:**
```typescript
import type { ObjectId } from 'mongoose';

row[payload.field]?.flatMap((r: ObjectId) => r?.toString()) ?? [];
```

**Depois:**
```typescript
// Sem import do mongoose

row[payload.field]?.flatMap((r: { toString(): string }) => r?.toString()) ?? [];
```

**O que mudou:**
- Removido `import type { ObjectId } from 'mongoose'`
- Tipo `ObjectId` substituido por `{ toString(): string }` — interface inline que descreve o comportamento necessario sem acoplar ao mongoose

---

### 1E. Limpeza de `any`, `as` e casts redundantes

**16+ arquivos afetados**

**Tipos `any` removidos:**

| Arquivo | Antes | Depois |
|---------|-------|--------|
| `table-rows/create/create.use-case.ts` | `type Payload = { [x: string]: any }` | `type Payload = Record<string, unknown> & { slug: string; creator?: string \| null }` |
| `table-rows/update/update.use-case.ts` | `type Payload = { [x: string]: any }` | `type Payload = Record<string, unknown> & { slug: string; _id: string }` |
| `group-rows/create/create.use-case.ts` | `Record<string, any>`, `{ [x: string]: any }` | `Record<string, unknown>` com campos tipados |
| `group-rows/update/update.use-case.ts` | idem | idem |

**Casts `as IField[]` redundantes removidos (16 arquivos):**

`table.fields as IField[]` era usado em toda parte, mas `ITable.fields` ja e tipado como `IField[]`. Removido em:
- `table-rows/`: create, update, show, paginated, reaction, evaluation, send-to-trash, remove-from-trash, forum-message
- `group-rows/`: create, update, list, show
- `group-fields/`: create, update, send-to-trash, remove-from-trash

**`@ts-ignore` removidos:**
- `table-rows/paginated/paginated.use-case.ts` (linha 93)
- `table-rows/update/update.use-case.ts` (linha 92)

**Tipagem de groupFields:**

Nos group-rows, `const groupFields = group.fields || []` inferia como `IField[] | never[]`. Corrigido com tipagem explicita:
```typescript
const groupFields: IField[] = group.fields || [];
```

---

## Fase 2: RowContractRepository

### 2A. Contrato Abstrato

**Arquivo NOVO:** `repositories/row/row-contract.repository.ts`

Classe abstrata com 16 metodos para todas as operacoes de rows dinamicas:

```
RowContractRepository
├── Core CRUD
│   ├── create(payload: RowCreatePayload): Promise<IRow>
│   ├── findOne(payload: RowFindOnePayload): Promise<IRow | null>
│   ├── findMany(payload: RowFindManyPayload): Promise<IRow[]>
│   ├── count(table, query): Promise<number>
│   ├── update(payload: RowUpdatePayload): Promise<IRow | null>
│   └── deleteOne(table, _id): Promise<boolean>
├── Trash
│   ├── sendToTrash(table, _id): Promise<IRow | null>
│   ├── restoreFromTrash(table, _id): Promise<IRow | null>
│   ├── bulkTrash(payload): Promise<number>
│   ├── bulkRestore(payload): Promise<number>
│   ├── bulkDelete(payload): Promise<number>
│   └── emptyTrash(table): Promise<number>
├── Field-level
│   └── setFieldAndSave(payload): Promise<IRow>
├── Group rows (subdocumentos)
│   ├── addGroupItem(payload): Promise<IRow>
│   ├── updateGroupItem(payload): Promise<IRow>
│   └── deleteGroupItem(payload): Promise<boolean>
└── Atomic update
    └── findOneAndUpdate(table, filter, update): Promise<IRow | null>
```

**Tipos definidos:**
- `RowTableContext` = `Optional<ITable, '_id' | 'createdAt' | 'updatedAt' | 'trashed' | 'trashedAt'>` — mesmo tipo que `buildTable()` espera
- Payloads tipados para cada operacao: `RowCreatePayload`, `RowFindOnePayload`, `RowFindManyPayload`, `RowUpdatePayload`, `RowSetFieldPayload`, `RowBulkUpdatePayload`, `RowBulkDeletePayload`, `RowGroupItemPayload`

---

### 2B. Implementacao Mongoose

**Arquivo NOVO:** `repositories/row/row-mongoose.repository.ts`

**Responsabilidades encapsuladas:**
- `buildTable()` — chamado internamente via `getModel(table)`
- `buildPopulate()` — chamado internamente via `getPopulate(table, includeReverse)`
- `transformRow(doc)` — converte documentos Mongoose em `IRow` limpo:
  - Chama `doc.toJSON({ flattenObjectIds: true })`
  - Converte `_id` para string via `String(doc._id)`
- Subdocument access via `SubdocArray` interface (para `.id()`, `.set()`, `.deleteOne()` do Mongoose)
- `row.get(slug)` para acessar campos dinamicos sem cast

**Todos os metodos retornam `IRow`** — objetos JavaScript puros, sem metodos Mongoose.

---

### 2C. Implementacao In-Memory

**Arquivo NOVO:** `repositories/row/row-in-memory.repository.ts`

- `Map<string, IRow[]>` — colecoes separadas por table slug
- Metodo `reset()` para limpar estado entre testes
- Gera `_id` via `crypto.randomUUID()`
- Implementa filtros basicos, sort, skip/limit para `findMany`
- Suporta `$set` no `findOneAndUpdate` para testes de forum-message
- Group items: push/update/splice em arrays de subdocumentos

**Impacto nos testes:** Elimina completamente os mocks frageis de `vi.mock('@application/core/util.core')` com cadeias de `.findOne().populate().toJSON()`.

---

### 2D. Registro no DI

**Arquivo:** `core/di-registry.ts`

```typescript
import { RowContractRepository } from '@application/repositories/row/row-contract.repository';
import RowMongooseRepository from '@application/repositories/row/row-mongoose.repository';

injectablesHolder.injectService(RowContractRepository, RowMongooseRepository);
```

---

### 2E. Refatoracao dos 19 Use-Cases

Todos os use-cases abaixo foram refatorados para injetar `RowContractRepository` via constructor e delegar todas as operacoes de banco ao repository.

#### table-rows/ (14 use-cases)

| Use-Case | Antes | Depois |
|----------|-------|--------|
| **create** | `buildTable()` + `model.create()` + `created.populate()` + `toJSON()` + `toString()` | `this.rowRepository.create({ table, data })` |
| **show** | `buildTable()` + `model.findOne()` + `row.populate()` + `toJSON()` + `toString()` | `this.rowRepository.findOne({ table, query, includeReverseRelationships: true })` |
| **update** | `buildTable()` + `model.findOne().populate()` + `row.set({...}).save()` + re-populate + `toJSON()` | `this.rowRepository.update({ table, _id, data })` |
| **paginated** | `buildTable()` + `model.find(query).populate().skip().limit().sort()` + `model.countDocuments()` + map com `toJSON()` | `this.rowRepository.findMany({ table, query, skip, limit, sort })` + `this.rowRepository.count(table, query)` |
| **delete** | `buildTable()` + `model.findOneAndDelete()` | `this.rowRepository.deleteOne(table, _id)` |
| **send-to-trash** | `buildTable()` + `model.findOne()` + `row.set({ trashed: true }).save()` + populate | `this.rowRepository.findOne()` (check trashed) + `this.rowRepository.sendToTrash()` |
| **remove-from-trash** | `buildTable()` + `model.findOne()` + `row.set({ trashed: false }).save()` + populate | `this.rowRepository.findOne()` (check !trashed) + `this.rowRepository.restoreFromTrash()` |
| **bulk-trash** | `buildTable()` + `model.updateMany({ trashed: false }, { $set: { trashed: true } })` | `this.rowRepository.bulkTrash({ table, ids })` |
| **bulk-restore** | `buildTable()` + `model.updateMany({ trashed: true }, { $set: { trashed: false } })` | `this.rowRepository.bulkRestore({ table, ids })` |
| **bulk-delete** | `buildTable()` + `model.deleteMany({ trashed: true })` | `this.rowRepository.bulkDelete({ table, ids })` |
| **empty-trash** | `buildTable()` + `model.deleteMany({ trashed: true })` | `this.rowRepository.emptyTrash(table)` |
| **reaction** | `buildTable()` + `model.findOne()` + `row.set(field, ids).save()` + populate + `toJSON()` | `this.rowRepository.findOne()` + `this.rowRepository.setFieldAndSave()` |
| **evaluation** | Identico ao reaction | Identico ao reaction |
| **forum-message** | `buildTable()` + `model.findOne()` + `model.findOneAndUpdate()` + populate + `toJSON() as unknown as IRow` | `this.rowRepository.findOne()` + `this.rowRepository.findOneAndUpdate()` |

**Imports removidos de todos os 14 arquivos:**
- `buildTable` de `@application/core/util.core` ou `@application/core/builders`
- `buildPopulate` de `@application/core/util.core` ou `@application/core/builders`
- `import type { IField }` (quando so era usado para casts)

**Import adicionado em todos:**
- `RowContractRepository` de `@application/repositories/row/row-contract.repository`

#### group-rows/ (5 use-cases)

| Use-Case | Antes | Depois |
|----------|-------|--------|
| **create** | `buildTable()` + `build.findOne()` + push manual no array + `row.save()` + `buildPopulate()` + `row.populate()` + `toJSON()` | `this.rowRepository.addGroupItem({ table, rowId, groupFieldSlug, data })` |
| **update** | `buildTable()` + `build.findOne()` + `(row as any)[slug].id(itemId)` + `subdoc.set()` + `row.save()` + populate + `toJSON()` | `this.rowRepository.findOne()` + `this.rowRepository.updateGroupItem({ table, rowId, groupFieldSlug, itemId, data })` |
| **delete** | `buildTable()` + `build.findOne()` + `(row as any)[slug].id(itemId)` + `subdoc.deleteOne()` + `row.save()` | `this.rowRepository.findOne()` + `this.rowRepository.deleteGroupItem({ table, rowId, groupFieldSlug, itemId })` |
| **list** | `buildTable()` + `buildPopulate()` + `build.findOne().populate()` + `toJSON()` + extrair array | `this.rowRepository.findOne({ table, query })` + extrair array do IRow |
| **show** | Identico ao list + filtrar por itemId | Identico ao list + filtrar por itemId |

**Eliminados nos 5 arquivos:**
- `(row as any)[groupField.slug]` — substituido por `isRecord` type guard + acesso seguro
- `(rowJson as any)[groupField.slug]` — idem
- `(i: any) => i._id?.toString()` — substituido por narrowing com `isRecord`

#### forum-message (detalhes adicionais)

O use-case mais complexo — 4 metodos (create, update, remove, markMentionRead). Mudancas especificas:

- **`persistMessagesAndReturnRow`**: parametro `model` removido, substituido por `table`. Usa `this.rowRepository.findOneAndUpdate()` em vez de `model.findOneAndUpdate()` + `populate()` + `toJSON() as unknown as IRow`
- **`normalizeId`**: reescrito com `isRecord()` type guard em vez de casts `(value as { _id?: unknown })`
- **Todas as condicoes ternarias** convertidas para `if/else` (13+ ocorrencias)
- **`resolveForumConfig`**: casts `as IField[]` removidos, usando tipagem explicita

---

## Fase 3: Testes Assertivos

### 3A. Testes Novos Criados (26 arquivos)

| Resource | Operacao | Testes | Cenarios |
|----------|----------|--------|----------|
| **group-fields** | create | 5 | sucesso, TABLE_NOT_FOUND, GROUP_NOT_FOUND, FIELD_ALREADY_EXIST, erro interno |
| | list | 3 | sucesso, TABLE_NOT_FOUND, GROUP_NOT_FOUND |
| | show | 3 | sucesso, TABLE_NOT_FOUND, FIELD_NOT_FOUND |
| | update | 5 | sucesso, TABLE_NOT_FOUND, GROUP_NOT_FOUND, FIELD_NOT_FOUND, erro interno |
| | send-to-trash | 5 | sucesso, TABLE_NOT_FOUND, FIELD_NOT_FOUND, ALREADY_TRASHED, NATIVE_FIELD |
| | remove-from-trash | 4 | sucesso, TABLE_NOT_FOUND, FIELD_NOT_FOUND, NOT_TRASHED |
| **group-rows** | create | 5 | sucesso, TABLE_NOT_FOUND, GROUP_NOT_FOUND, ROW_NOT_FOUND, erro interno |
| | list | 5 | sucesso, array vazio, TABLE_NOT_FOUND, GROUP_NOT_FOUND, ROW_NOT_FOUND |
| | show | 4 | sucesso, TABLE_NOT_FOUND, ROW_NOT_FOUND, ITEM_NOT_FOUND |
| | update | 6 | sucesso, TABLE_NOT_FOUND, GROUP_NOT_FOUND, ROW_NOT_FOUND, ITEM_NOT_FOUND, erro interno |
| | delete | 6 | sucesso, TABLE_NOT_FOUND, GROUP_NOT_FOUND, ROW_NOT_FOUND, ITEM_NOT_FOUND, erro interno |
| **table-rows** | bulk-trash | 4 | sucesso, TABLE_NOT_FOUND, modified: 0, erro interno |
| | bulk-restore | 4 | sucesso, TABLE_NOT_FOUND, modified: 0, erro interno |
| | bulk-delete | 4 | sucesso, TABLE_NOT_FOUND, deleted: 0, erro interno |
| | empty-trash | 4 | sucesso, TABLE_NOT_FOUND, deleted: 0, erro interno |
| | forum-message | 9 | create, TABLE_NOT_FOUND, FORUM_TABLE_REQUIRED, ROW_NOT_FOUND, FORUM_MESSAGE_EMPTY, erro interno, update, AUTHOR_REQUIRED, delete |
| **table-base** | bulk-trash | 4 | sucesso, IDs inexistentes, ja na lixeira, erro interno |
| | bulk-restore | 4 | sucesso, IDs inexistentes, nao na lixeira, erro interno |
| | empty-trash | 4 | sucesso, lixeira vazia, nao-trashed, erro interno |
| **table-fields** | show | 4 | sucesso (refatorado), TABLE_NOT_FOUND, FIELD_NOT_FOUND, erro interno |
| | delete | 7 | sucesso, TABLE_NOT_FOUND, FIELD_NOT_FOUND, NOT_TRASHED, NATIVE, LOCKED, erro interno |
| | add-category | 8 | root, subcategory, TABLE_NOT_FOUND, FIELD_NOT_FOUND, not-in-table, INVALID_TYPE, PARENT_NOT_FOUND, erro interno |
| **menu** | restore | 4 | sucesso, MENU_NOT_FOUND, NOT_TRASHED, erro interno |
| | reorder | 5 | sucesso, array vazio, MENU_NOT_FOUND, pais diferentes, erro interno |
| | hard-delete | 4 | sucesso, MENU_NOT_FOUND, NOT_TRASHED, erro interno |
| **tools** | export-table | 5 | structure, data, full, TABLE_NOT_FOUND, erro interno |
| | import-table | 7 | sucesso, OWNER_ID_REQUIRED, INVALID_PLATFORM, SLUG_EXISTS, STRUCTURE_REQUIRED, header faltando, erro interno |

---

### 3B. Testes Existentes Fortalecidos (52 arquivos)

**Mudancas aplicadas em todos os 52 arquivos:**

1. **Eliminacao de skips silenciosos:**
```typescript
// ANTES (perigoso — se isRight retorna false, assertions nao executam)
if (result.isRight()) {
  expect(result.value.name).toBe('test');
}

// DEPOIS (falha explicitamente)
expect(result.isRight()).toBe(true);
if (!result.isRight()) throw new Error('Expected right');
expect(result.value.name).toBe('test');
```

2. **Verificacao de chamadas ao repository via spies:**
```typescript
const findBySlugSpy = vi.spyOn(tableRepository, 'findBySlug');
await sut.execute(payload);
expect(findBySlugSpy).toHaveBeenCalledTimes(1);
expect(findBySlugSpy).toHaveBeenCalledWith('clientes');
```

3. **Testes de erro com 3 propriedades:**
```typescript
expect(result.value.code).toBe(404);
expect(result.value.cause).toBe('TABLE_NOT_FOUND');
expect(result.value.message).toBe('Tabela nao encontrada');
```

4. **Testes novos adicionados a suites existentes:**
- `sign-in`: verificar que `passwordService.compare` nao e chamado quando usuario inativo
- `sign-up`: verificar envio de email de boas-vindas, verificar que `create` nao e chamado quando email existe
- `sign-out`: verificar que sempre retorna Right
- `magic-link`: verificar token marcado como VALIDATED
- `request-code`: verificar codigo numerico de 6 digitos
- `validate-code`: verificar token validado
- `reset-password`: verificar senha hasheada
- `users/create`: erro GROUP_NOT_INFORMED
- `users/update`: alterar status
- `users/paginated`: segunda pagina
- `clone-table`: OWNER_ID_REQUIRED

5. **Eliminacao de `as any` em testes:**
- `storage/upload`: `as unknown as StorageContractService` substituido por `InMemoryStorageService`
- `users/paginated`: `user as any` substituido por objeto tipado com `E_ROLE.MASTER`
- `table-base/create`: `idField!.type` substituido por guard `if (!idField) throw`

6. **Mocks de `buildTable`/`buildPopulate` substituidos por `RowInMemoryRepository`:**
- `table-rows/create`, `show`, `update`, `delete`, `paginated`: removidos `vi.mock('@application/core/util.core')` com cadeias frageis de `.findOne().populate().toJSON()`
- `table-rows/send-to-trash`, `remove-from-trash`: removidos `vi.mock`, adicionados testes para ROW_NOT_FOUND e ALREADY_TRASHED/NOT_TRASHED
- `table-rows/reaction`, `evaluation`: removidos mocks de `buildTable`/`buildPopulate`, usando `RowInMemoryRepository`

---

## Resumo de Numeros

| Metrica | Antes | Depois | Delta |
|---------|-------|--------|-------|
| Arquivos de teste | 53 | 79 | +26 |
| Testes unitarios | 209 | 351 | +142 |
| Erros TypeScript | 2 (@ts-ignore) | 0 | -2 |
| Imports de mongoose em use-cases/services/middlewares | 5 | 0 | -5 |
| Casts `as any` em use-cases | 15+ | 0 | -15+ |
| Casts `as IField[]` redundantes | 16 | 0 | -16 |
| Arquivos novos | 0 | 4 | +4 |

### Arquivos Novos Criados

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `core/object-id.util.ts` | Utility | Encapsula `mongoose.Types.ObjectId.isValid()` |
| `repositories/row/row-contract.repository.ts` | Contrato | 16 metodos abstratos para rows dinamicas |
| `repositories/row/row-mongoose.repository.ts` | Implementacao | Encapsula `buildTable` + `buildPopulate` |
| `repositories/row/row-in-memory.repository.ts` | Teste | `Map<string, IRow[]>` por table slug |

### Verificacao

```bash
# Zero erros de tipo
cd backend && npx tsc --noEmit

# 351 testes passando
cd backend && npm run test:unit

# Zero imports de mongoose fora da camada de infraestrutura
grep -r "from 'mongoose'" backend/application/resources/ backend/application/services/permission/ backend/application/middlewares/
# (resultado vazio)

# Lint limpo
cd backend && npm run lint
```
