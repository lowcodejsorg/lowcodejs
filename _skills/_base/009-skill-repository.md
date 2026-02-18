# Skill: Repository (Mongoose)

O repository segue um pattern de 3 arquivos por entidade: um contract (classe abstrata), uma implementacao Mongoose (producao), e uma implementacao in-memory (testes). Essa separacao garante inversao de dependencia -- o use case depende apenas do contract, e a implementacao concreta e injetada via DI container. A implementacao in-memory permite testes unitarios rapidos sem depender de banco de dados.

---

## Estrutura do Arquivo

Cada entidade tem sua propria pasta dentro de `repositories/` com exatamente 3 arquivos:

```
backend/application/repositories/
  user/
    user-contract.repository.ts        # Classe abstrata (contract)
    user-mongoose.repository.ts        # Implementacao Mongoose (producao)
    user-in-memory.repository.ts       # Implementacao in-memory (testes)
  table/
    table-contract.repository.ts
    table-mongoose.repository.ts
    table-in-memory.repository.ts
  [entity]/
    [entity]-contract.repository.ts
    [entity]-mongoose.repository.ts
    [entity]-in-memory.repository.ts
```

---

## Template

### Contract (classe abstrata)

```typescript
import type { IEntity, Merge } from '@application/core/entity.core';

export type EntityCreatePayload = Pick<IEntity, 'name'> & {
  // campos obrigatorios para criacao
};

export type EntityFindByPayload = Merge<
  Partial<Pick<IEntity, '_id'>>,
  { exact: boolean }
>;

export type EntityUpdatePayload = Merge<
  Pick<IEntity, '_id'>,
  Partial<EntityCreatePayload>
>;

export type EntityQueryPayload = {
  page?: number;
  perPage?: number;
  search?: string;
  trashed?: boolean;
};

export abstract class EntityContractRepository {
  abstract create(payload: EntityCreatePayload): Promise<IEntity>;
  abstract findBy(payload: EntityFindByPayload): Promise<IEntity | null>;
  abstract findMany(payload?: EntityQueryPayload): Promise<IEntity[]>;
  abstract update(payload: EntityUpdatePayload): Promise<IEntity>;
  abstract delete(_id: string): Promise<void>;
  abstract count(payload?: EntityQueryPayload): Promise<number>;
}
```

### Implementacao Mongoose

```typescript
import { Service } from 'fastify-decorators';

import type { IEntity } from '@application/core/entity.core';
import { normalize } from '@application/core/util.core';
import { Entity as Model } from '@application/model/entity.model';

import type {
  EntityContractRepository,
  EntityCreatePayload,
  EntityFindByPayload,
  EntityUpdatePayload,
  EntityQueryPayload,
} from './entity-contract.repository';

@Service()
export default class EntityMongooseRepository implements EntityContractRepository {
  private readonly populateOptions = [
    { path: 'relation' },
    // ou com nested populate: { path: 'relation', populate: { path: 'nested' } }
  ];

  private buildWhereClause(payload?: EntityQueryPayload): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    // Filtro por trashed (soft delete)
    if (payload?.trashed !== undefined) {
      where.trashed = payload.trashed;
    } else {
      where.trashed = false;
    }

    // Filtro por busca textual
    if (payload?.search) {
      where.$or = [
        { name: { $regex: normalize(payload.search), $options: 'i' } },
        // outros campos buscaveis
      ];
    }

    return where;
  }

  private transform(entity: InstanceType<typeof Model>): IEntity {
    return {
      ...entity.toJSON({ flattenObjectIds: true }),
      _id: entity._id.toString(),
    };
  }

  async create(payload: EntityCreatePayload): Promise<IEntity> {
    const created = await Model.create(payload);
    const populated = await created.populate(this.populateOptions);
    return this.transform(populated);
  }

  async findBy({ exact = false, ...payload }: EntityFindByPayload): Promise<IEntity | null> {
    const conditions: Record<string, unknown>[] = [];

    if (payload._id) conditions.push({ _id: payload._id });
    // outros campos de busca

    if (conditions.length === 0) {
      throw new Error('At least one query is required');
    }

    const whereClause = exact ? { $and: conditions } : { $or: conditions };

    const entity = await Model.findOne(whereClause).populate(this.populateOptions);
    if (!entity) return null;

    return this.transform(entity);
  }

  async findMany(payload?: EntityQueryPayload): Promise<IEntity[]> {
    const where = this.buildWhereClause(payload);

    let skip: number | undefined;
    let take: number | undefined;

    if (payload?.page && payload?.perPage) {
      skip = (payload.page - 1) * payload.perPage;
      take = payload.perPage;
    }

    const entities = await Model.find(where)
      .populate(this.populateOptions)
      .sort({ name: 'asc' })
      .skip(skip ?? 0)
      .limit(take ?? 0);

    return entities.map((e) => this.transform(e));
  }

  async update({ _id, ...payload }: EntityUpdatePayload): Promise<IEntity> {
    const entity = await Model.findOne({ _id });
    if (!entity) throw new Error('Entity not found');

    entity.set(payload);
    await entity.save();

    const populated = await entity.populate(this.populateOptions);
    return this.transform(populated);
  }

  async delete(_id: string): Promise<void> {
    await Model.updateOne(
      { _id },
      { $set: { trashed: true, trashedAt: new Date() } },
    );
  }

  async count(payload?: EntityQueryPayload): Promise<number> {
    const where = this.buildWhereClause(payload);
    return Model.countDocuments(where);
  }
}
```

### Implementacao In-Memory

```typescript
import type { IEntity } from '@application/core/entity.core';

import type {
  EntityContractRepository,
  EntityCreatePayload,
  EntityFindByPayload,
  EntityUpdatePayload,
  EntityQueryPayload,
} from './entity-contract.repository';

export default class EntityInMemoryRepository implements EntityContractRepository {
  private items: IEntity[] = [];

  async create(payload: EntityCreatePayload): Promise<IEntity> {
    const entity: IEntity = {
      ...payload,
      _id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      trashed: false,
      trashedAt: null,
    };
    this.items.push(entity);
    return entity;
  }

  async findBy({ _id, exact }: EntityFindByPayload): Promise<IEntity | null> {
    const entity = this.items.find((item) => item._id === _id);
    return entity ?? null;
  }

  async findMany(payload?: EntityQueryPayload): Promise<IEntity[]> {
    let filtered = this.items;

    // Filtro por trashed
    if (payload?.trashed !== undefined) {
      filtered = filtered.filter((item) => item.trashed === payload.trashed);
    } else {
      filtered = filtered.filter((item) => !item.trashed);
    }

    // Filtro por busca
    if (payload?.search) {
      const search = payload.search.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(search),
      );
    }

    // Paginacao
    if (payload?.page && payload?.perPage) {
      const start = (payload.page - 1) * payload.perPage;
      filtered = filtered.slice(start, start + payload.perPage);
    }

    return filtered;
  }

  async update({ _id, ...payload }: EntityUpdatePayload): Promise<IEntity> {
    const entity = this.items.find((item) => item._id === _id);
    if (!entity) throw new Error('Entity not found');
    Object.assign(entity, payload, { updatedAt: new Date() });
    return entity;
  }

  async delete(_id: string): Promise<void> {
    const entity = this.items.find((item) => item._id === _id);
    if (!entity) throw new Error('Entity not found');
    Object.assign(entity, {
      trashed: true,
      trashedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async count(payload?: EntityQueryPayload): Promise<number> {
    const filtered = await this.findMany({
      ...payload,
      page: undefined,
      perPage: undefined,
    });
    return filtered.length;
  }
}
```

---

## Exemplo Real

### Contract (user-contract.repository.ts)

```typescript
import type {
  E_ROLE,
  E_USER_STATUS,
  IUser,
  Merge,
  ValueOf,
} from '@application/core/entity.core';

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

export abstract class UserContractRepository {
  abstract create(payload: UserCreatePayload): Promise<IUser>;
  abstract findBy(payload: UserFindByPayload): Promise<IUser | null>;
  abstract findMany(payload?: UserQueryPayload): Promise<IUser[]>;
  abstract update(payload: UserUpdatePayload): Promise<IUser>;
  abstract delete(_id: string): Promise<void>;
  abstract count(payload?: UserQueryPayload): Promise<number>;
}
```

### Mongoose (user-mongoose.repository.ts -- trecho)

```typescript
import { Service } from 'fastify-decorators';

import { E_ROLE, type IUser } from '@application/core/entity.core';
import { normalize } from '@application/core/util.core';
import { User as Model } from '@application/model/user.model';

import type {
  UserContractRepository,
  UserCreatePayload,
  UserFindByPayload,
  UserQueryPayload,
  UserUpdatePayload,
} from './user-contract.repository';

@Service()
export default class UserMongooseRepository implements UserContractRepository {
  private readonly populateOptions = [
    { path: 'group', populate: { path: 'permissions' } },
  ];

  private async buildWhereClause(
    payload?: UserQueryPayload,
  ): Promise<Record<string, unknown>> {
    const where: Record<string, unknown> = {};

    if (payload?.trashed !== undefined) {
      where.trashed = payload.trashed;
    } else {
      where.trashed = false;
    }

    if (payload?.status) {
      where.status = payload.status;
    }

    if (payload?.search) {
      where.$or = [
        { name: { $regex: normalize(payload.search), $options: 'i' } },
        { email: { $regex: normalize(payload.search), $options: 'i' } },
      ];
    }

    return where;
  }

  private transform(entity: InstanceType<typeof Model>): IUser {
    return {
      ...entity.toJSON({ flattenObjectIds: true }),
      _id: entity._id.toString(),
    };
  }

  async create(payload: UserCreatePayload): Promise<IUser> {
    const created = await Model.create(payload);
    const populated = await created.populate(this.populateOptions);
    return this.transform(populated);
  }

  async findBy({ exact = false, ...payload }: UserFindByPayload): Promise<IUser | null> {
    const conditions: Record<string, unknown>[] = [];
    if (payload._id) conditions.push({ _id: payload._id });
    if (payload.email) conditions.push({ email: payload.email });

    if (conditions.length === 0) throw new Error('At least one query is required');

    const whereClause = exact ? { $and: conditions } : { $or: conditions };
    const user = await Model.findOne(whereClause).populate(this.populateOptions);
    if (!user) return null;

    return this.transform(user);
  }

  async update({ _id, ...payload }: UserUpdatePayload): Promise<IUser> {
    const user = await Model.findOne({ _id });
    if (!user) throw new Error('User not found');
    user.set(payload);
    await user.save();
    const populated = await user.populate(this.populateOptions);
    return this.transform(populated);
  }

  async delete(_id: string): Promise<void> {
    await Model.updateOne({ _id }, { $set: { trashed: true, trashedAt: new Date() } });
  }
}
```

### In-Memory usado em teste unitario

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import UserInMemoryRepository from '@application/repositories/user/user-in-memory.repository';
import UserShowUseCase from './show.use-case';

let userInMemoryRepository: UserInMemoryRepository;
let sut: UserShowUseCase;

describe('User Show Use Case', () => {
  beforeEach(() => {
    userInMemoryRepository = new UserInMemoryRepository();
    sut = new UserShowUseCase(userInMemoryRepository);
  });

  it('deve retornar usuario quando encontrado', async () => {
    const created = await userInMemoryRepository.create({
      name: 'John Doe', email: 'john@example.com', password: 'password123', group: 'group-id',
    });
    const result = await sut.execute({ _id: created._id });
    expect(result.isRight()).toBe(true);
  });
});
```

---

## Secoes Detalhadas

### `transform()` method

O metodo `transform()` converte o documento Mongoose em um objeto plain com `_id` como string:

```typescript
private transform(entity: InstanceType<typeof Model>): IEntity {
  return {
    ...entity.toJSON({ flattenObjectIds: true }),
    _id: entity._id.toString(),
  };
}
```

- `toJSON({ flattenObjectIds: true })` converte todos os ObjectIds internos (refs) em strings.
- `_id: entity._id.toString()` garante que o `_id` do documento raiz tambem e string.
- Esse metodo e chamado em todo retorno de dados (`create`, `findBy`, `findMany`, `update`).

### `populateOptions` pattern

O array `populateOptions` define quais relacoes devem ser carregadas automaticamente:

```typescript
// Simples
private readonly populateOptions = [
  { path: 'category' },
];

// Com nested populate
private readonly populateOptions = [
  { path: 'group', populate: { path: 'permissions' } },
];

// Multiplas relacoes
private readonly populateOptions = [
  { path: 'owner' },
  { path: 'fields' },
  { path: 'logo' },
];
```

### `buildWhereClause()` com operadores MongoDB

```typescript
// $regex para busca textual case-insensitive
where.$or = [
  { name: { $regex: normalize(search), $options: 'i' } },
  { email: { $regex: normalize(search), $options: 'i' } },
];

// $in para filtro por multiplos IDs
where._id = { $in: payload._ids };

// $ne para excluir um registro
where._id = { $ne: payload.user._id };

// Filtro direto por valor
where.status = payload.status;
```

---

## Regras e Convencoes

1. **Sempre 3 arquivos por entidade** -- contract, mongoose e in-memory. Nunca crie um sem os outros dois.

2. **O contract e uma classe abstrata**, nao uma interface. Isso permite que o DI container resolva a dependencia por referencia de classe.

3. **Todos os metodos do contract sao `abstract`** e retornam `Promise<T>`. Mesmo operacoes sincronas no in-memory devem retornar Promise para manter a assinatura consistente.

4. **Payloads sao tipos separados**, nao inline. Cada operacao (`create`, `findBy`, `update`, `findMany`) tem seu proprio tipo de payload exportado do arquivo contract.

5. **O decorator `@Service()`** e usado apenas na implementacao Mongoose. O in-memory nao precisa pois e instanciado manualmente nos testes.

6. **`populate()` para carregar relacoes** -- use `populate(this.populateOptions)` com array de opcoes para carregar dados relacionados.

7. **`$regex` com `$options: 'i'` para buscas de texto** -- use `{ campo: { $regex: normalize(valor), $options: 'i' } }` para buscas parciais case-insensitive.

8. **`buildWhereClause()`** centraliza a logica de filtros. Sempre inclui `trashed: false` por padrao para excluir registros com soft delete.

9. **`delete()` faz soft delete** -- usa `Model.updateOne({ _id }, { $set: { trashed: true, trashedAt: new Date() } })` ao inves de remover o registro.

10. **`transform()` obrigatorio** -- todo retorno de dados deve passar pelo `transform()` para converter ObjectIds em strings.

11. **Update pattern: `findOne` → `set` → `save` → `populate`** -- nao use `findOneAndUpdate`. O pattern do projeto e buscar, setar, salvar e popular.

12. **In-memory `count()` delega para `findMany()`** sem paginacao para reutilizar a logica de filtros e evitar duplicacao.

13. **In-memory usa `_id` (nao `id`)** -- o campo de chave primaria e sempre `_id`, inclusive no in-memory.

14. **Naming convention** -- `[entity]-contract.repository.ts`, `[entity]-mongoose.repository.ts`, `[entity]-in-memory.repository.ts`.

15. **DI registration** -- no `di-registry.ts`, registrar como `injectablesHolder.injectService(EntityContractRepository, EntityMongooseRepository)`.

---

## Checklist

- [ ] A pasta `backend/application/repositories/[entity]/` contem exatamente 3 arquivos
- [ ] O contract e uma `abstract class` com todos os metodos `abstract`
- [ ] Todos os payloads estao tipados e exportados do arquivo contract
- [ ] A implementacao Mongoose tem o decorator `@Service()`
- [ ] A implementacao Mongoose usa `populate()` para relacoes (nao `include`)
- [ ] A implementacao Mongoose usa `$regex` com `$options: 'i'` para buscas (nao `contains`)
- [ ] A implementacao Mongoose usa `_id` (nao `id`)
- [ ] `buildWhereClause()` inclui `trashed: false` por padrao
- [ ] `delete()` faz soft delete com `{ $set: { trashed: true, trashedAt: new Date() } }`
- [ ] O metodo `transform()` converte o documento para plain object com `_id` string
- [ ] A implementacao in-memory tem `private items: IEntity[] = []`
- [ ] In-memory `create()` usa `crypto.randomUUID()` para o `_id`
- [ ] In-memory `count()` delega para `findMany()` sem paginacao
- [ ] Ambas as implementacoes implementam o contract
- [ ] O DI Registry registra `injectablesHolder.injectService(ContractRepo, MongooseImpl)`

---

## Erros Comuns

| Erro | Problema | Correcao |
|------|----------|----------|
| Criar interface ao inves de abstract class | DI container nao consegue resolver interfaces TypeScript em runtime | Usar `abstract class` como contract |
| Esquecer `@Service()` no Mongoose repository | DI container nao registra a implementacao | Adicionar `@Service()` antes da classe |
| `delete()` com `Model.deleteOne()` | Remove permanentemente o registro do banco | Usar `Model.updateOne({ _id }, { $set: { trashed: true, trashedAt: new Date() } })` |
| Usar `include` em vez de `populate()` | `include` e padrao Prisma, nao Mongoose | Usar `.populate(this.populateOptions)` |
| Usar `contains` em vez de `$regex` | `contains` e padrao Prisma, nao Mongoose | Usar `{ campo: { $regex: valor, $options: 'i' } }` |
| Usar `id` em vez de `_id` | `id` e padrao Prisma/PostgreSQL, nao Mongoose/MongoDB | Usar `_id` como campo de chave primaria |
| In-memory sem `crypto.randomUUID()` no create | `_id` fica `undefined`, quebra buscas e updates | Usar `crypto.randomUUID()` global |
| `buildWhereClause()` sem `trashed: false` | Queries retornam registros "deletados" | Sempre iniciar o where com `trashed: false` |
| Esquecer `transform()` no retorno | ObjectIds retornados como objetos em vez de strings | Sempre chamar `this.transform(entity)` antes de retornar |
| Update com `findOneAndUpdate()` | Nao dispara middlewares Mongoose e nao popula | Usar pattern `findOne` → `set` → `save` → `populate` |
| Payloads inline nos metodos do contract | Dificulta reuso dos tipos em use cases e testes | Definir tipos separados e exporta-los |
| In-memory `findMany()` sem filtrar `trashed` | Retorna registros com soft delete nos testes | Iniciar com filtro `!item.trashed` |

---

> **Cross-references:** ver `008-skill-model.md` para como o Mongoose schema e definido, `011-skill-di-registry.md` para como o contract e a implementacao Mongoose sao registrados no DI container, e `005-skill-teste-unitario.md` para como o in-memory repository e usado nos testes.
