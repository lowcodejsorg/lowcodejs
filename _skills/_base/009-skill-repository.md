# Skill: Repository (3 em 1)

O repository no LowcodeJS segue um pattern de 3 arquivos por entidade: um contract (classe abstrata), uma implementacao Mongoose (producao), e uma implementacao in-memory (testes). Essa separacao garante inversao de dependencia -- o use case depende apenas do contract, e a implementacao concreta e injetada via DI container. O in-memory permite testes unitarios rapidos sem depender de banco de dados.

---

## Estrutura do Arquivo

Cada entidade tem sua propria pasta dentro de `repositories/` com exatamente 3 arquivos:

```
backend/application/repositories/
  user/
    user-contract.repository.ts       # Classe abstrata (contract)
    user-mongoose.repository.ts       # Implementacao Mongoose (producao)
    user-in-memory.repository.ts      # Implementacao in-memory (testes)
  project/
    project-contract.repository.ts
    project-mongoose.repository.ts
    project-in-memory.repository.ts
  [entity]/
    [entity]-contract.repository.ts
    [entity]-mongoose.repository.ts
    [entity]-in-memory.repository.ts
```

---

## Template

### Contract (classe abstrata)

```typescript
import type { IEntity, Merge, ValueOf } from '@application/core/entity.core';

// Payloads tipados para cada operacao
export type EntityCreatePayload = {
  // campos obrigatorios para criacao
};

export type EntityFindByPayload = {
  _id?: string;
  // outros campos de busca
  exact?: boolean;
};

export type EntityUpdatePayload = Merge<Partial<Omit<IEntity, '_id'>>, { _id: string }>;

export type EntityQueryPayload = {
  page?: number;
  perPage?: number;
  search?: string;
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
import { Service } from '@application/core/di.core';
import { EntityContractRepository, type EntityCreatePayload, type EntityFindByPayload, type EntityUpdatePayload, type EntityQueryPayload } from './entity-contract.repository';
import { Entity as EntityModel } from '@application/model/entity.model';
import type { IEntity } from '@application/core/entity.core';

@Service()
export class EntityMongooseRepository extends EntityContractRepository {
  private readonly populateOptions = [
    { path: 'relation', select: 'name' },
  ];

  private transform(entity: any): IEntity {
    return entity.toJSON({ flattenObjectIds: true });
  }

  private buildWhereClause(payload?: EntityQueryPayload) {
    const where: Record<string, any> = { trashed: false };

    if (payload?.search) {
      where.$or = [
        { name: { $regex: payload.search, $options: 'i' } },
        // outros campos buscaveis
      ];
    }

    return where;
  }

  async create(payload: EntityCreatePayload): Promise<IEntity> {
    const entity = await EntityModel.create(payload);
    const populated = await entity.populate(this.populateOptions);
    return this.transform(populated);
  }

  async findBy(payload: EntityFindByPayload): Promise<IEntity | null> {
    const entity = await EntityModel.findOne(payload).populate(this.populateOptions);
    if (!entity) return null;
    return this.transform(entity);
  }

  async findMany(payload?: EntityQueryPayload): Promise<IEntity[]> {
    const where = this.buildWhereClause(payload);
    const page = payload?.page ?? 1;
    const perPage = payload?.perPage ?? 10;

    const entities = await EntityModel.find(where)
      .populate(this.populateOptions)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });

    return entities.map((e) => this.transform(e));
  }

  async update(payload: EntityUpdatePayload): Promise<IEntity> {
    const { _id, ...data } = payload;
    const entity = await EntityModel.findByIdAndUpdate(_id, data, { new: true })
      .populate(this.populateOptions);
    return this.transform(entity!);
  }

  async delete(_id: string): Promise<void> {
    await EntityModel.findByIdAndUpdate(_id, {
      trashed: true,
      trashedAt: new Date(),
    });
  }

  async count(payload?: EntityQueryPayload): Promise<number> {
    const where = this.buildWhereClause(payload);
    return EntityModel.countDocuments(where);
  }
}
```

### Implementacao In-Memory

```typescript
import { randomUUID } from 'node:crypto';
import type { IEntity } from '@application/core/entity.core';
import { EntityContractRepository, type EntityCreatePayload, type EntityFindByPayload, type EntityUpdatePayload, type EntityQueryPayload } from './entity-contract.repository';

export class EntityInMemoryRepository extends EntityContractRepository {
  private items: IEntity[] = [];

  // Helper para resetar o estado entre testes
  reset() {
    this.items = [];
  }

  async create(payload: EntityCreatePayload): Promise<IEntity> {
    const entity: IEntity = {
      _id: randomUUID(),
      ...payload,
      trashed: false,
      trashedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.items.push(entity);
    return entity;
  }

  async findBy(payload: EntityFindByPayload): Promise<IEntity | null> {
    const entity = this.items.find((item) => {
      if (payload.exact) {
        return Object.entries(payload)
          .filter(([key]) => key !== 'exact')
          .every(([key, value]) => item[key as keyof IEntity] === value);
      }
      return Object.entries(payload)
        .filter(([key]) => key !== 'exact')
        .some(([key, value]) => item[key as keyof IEntity] === value);
    });
    return entity ?? null;
  }

  async findMany(payload?: EntityQueryPayload): Promise<IEntity[]> {
    let result = this.items.filter((item) => !item.trashed);

    if (payload?.search) {
      const search = payload.search.toLowerCase();
      result = result.filter((item) =>
        item.name.toLowerCase().includes(search),
      );
    }

    if (payload?.page && payload?.perPage) {
      const start = (payload.page - 1) * payload.perPage;
      result = result.slice(start, start + payload.perPage);
    }

    return result;
  }

  async update(payload: EntityUpdatePayload): Promise<IEntity> {
    const index = this.items.findIndex((item) => item._id === payload._id);
    const { _id, ...data } = payload;
    this.items[index] = {
      ...this.items[index],
      ...data,
      updatedAt: new Date(),
    };
    return this.items[index];
  }

  async delete(_id: string): Promise<void> {
    const index = this.items.findIndex((item) => item._id === _id);
    this.items[index] = {
      ...this.items[index],
      trashed: true,
      trashedAt: new Date(),
    };
  }

  async count(payload?: EntityQueryPayload): Promise<number> {
    const items = await this.findMany({
      ...payload,
      page: undefined,
      perPage: undefined,
    });
    return items.length;
  }
}
```

---

## Exemplo Real

### Contract (user-contract.repository.ts)

```typescript
import type { IUser, Merge, ValueOf } from '@application/core/entity.core';

export type UserCreatePayload = {
  name: string;
  email: string;
  password: string;
  group: string;
};

export type UserFindByPayload = {
  _id?: string;
  email?: string;
  exact?: boolean;
};

export type UserUpdatePayload = Merge<Partial<Omit<IUser, '_id'>>, { _id: string }>;

export type UserQueryPayload = {
  page?: number;
  perPage?: number;
  search?: string;
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

### Mongoose consumindo o model (trecho)

```typescript
import { Service } from '@application/core/di.core';
import { UserContractRepository, type UserCreatePayload } from './user-contract.repository';
import { User as UserModel } from '@application/model/user.model';
import type { IUser } from '@application/core/entity.core';

@Service()
export class UserMongooseRepository extends UserContractRepository {
  private readonly populateOptions = [
    { path: 'group', select: 'name permissions' },
  ];

  private transform(entity: any): IUser {
    return entity.toJSON({ flattenObjectIds: true });
  }

  async create(payload: UserCreatePayload): Promise<IUser> {
    const user = await UserModel.create(payload);
    const populated = await user.populate(this.populateOptions);
    return this.transform(populated);
  }

  // ... demais metodos seguem o template
}
```

### In-Memory usado em teste unitario

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { UserInMemoryRepository } from './user-in-memory.repository';
import { CreateUserUseCase } from '@application/use-case/user/create-user.use-case';

describe('CreateUserUseCase', () => {
  let repository: UserInMemoryRepository;
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    repository = new UserInMemoryRepository();
    useCase = new CreateUserUseCase(repository);
  });

  it('deve criar um usuario com sucesso', async () => {
    const result = await useCase.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: '123456',
      group: 'group-id',
    });

    expect(result.isRight()).toBe(true);
  });
});
```

---

## Regras e Convencoes

1. **Sempre 3 arquivos por entidade** -- contract, mongoose e in-memory. Nunca crie um sem os outros dois.

2. **O contract e uma classe abstrata**, nao uma interface. Isso permite que o DI container resolva a dependencia por referencia de classe.

3. **Todos os metodos do contract sao `abstract`** e retornam `Promise<T>`. Mesmo operacoes sincronas no in-memory devem retornar Promise para manter a assinatura consistente.

4. **Payloads sao tipos separados**, nao inline. Cada operacao (`create`, `findBy`, `update`, `findMany`) tem seu proprio tipo de payload exportado do arquivo contract.

5. **`UpdatePayload` usa `Merge<Partial<Omit<IEntity, '_id'>>, { _id: string }>`** -- todos os campos sao opcionais exceto `_id`, que e obrigatorio para identificar o registro.

6. **O decorator `@Service()`** e usado apenas na implementacao Mongoose. O in-memory nao precisa pois e instanciado manualmente nos testes.

7. **`transform()` usa `toJSON({ flattenObjectIds: true })`** -- isso converte ObjectIds para strings, garantindo que a resposta esteja no formato da interface `IEntity`.

8. **`buildWhereClause()`** centraliza a logica de filtros. Sempre inclui `trashed: false` por padrao para excluir registros com soft delete.

9. **`populateOptions`** e um array privado readonly. Cada entrada especifica o `path` e o `select` dos campos a serem populados.

10. **`delete()` faz soft delete** -- atualiza `trashed: true` e `trashedAt: new Date()` ao inves de remover o documento.

11. **In-memory `count()` delega para `findMany()`** sem paginacao para reutilizar a logica de filtros e evitar duplicacao.

12. **In-memory `findBy()` com `exact`** -- quando `exact: true`, todos os campos devem corresponder (AND). Quando `false` ou omitido, qualquer campo pode corresponder (OR).

---

## Checklist

- [ ] A pasta `backend/application/repositories/[entity]/` contem exatamente 3 arquivos
- [ ] O contract e uma `abstract class` com todos os metodos `abstract`
- [ ] Todos os payloads estao tipados e exportados do arquivo contract
- [ ] `UpdatePayload` usa `Merge<Partial<Omit<IEntity, '_id'>>, { _id: string }>`
- [ ] A implementacao Mongoose tem o decorator `@Service()`
- [ ] A implementacao Mongoose tem `populateOptions`, `transform()` e `buildWhereClause()`
- [ ] `transform()` usa `toJSON({ flattenObjectIds: true })`
- [ ] `buildWhereClause()` inclui `trashed: false` por padrao
- [ ] `delete()` faz soft delete (nao remove o documento)
- [ ] A implementacao in-memory tem `private items: IEntity[] = []`
- [ ] In-memory `create()` usa `randomUUID()` para o `_id`
- [ ] In-memory `count()` delega para `findMany()` sem paginacao
- [ ] In-memory tem metodo `reset()` para limpar estado entre testes
- [ ] Ambas as implementacoes estendem o contract (nao implementam interface)

---

## Erros Comuns

| Erro | Problema | Correcao |
|------|----------|----------|
| Criar interface ao inves de abstract class | DI container nao consegue resolver interfaces TypeScript em runtime | Usar `abstract class` como contract |
| Esquecer `@Service()` no Mongoose repository | DI container nao registra a implementacao | Adicionar `@Service()` antes da classe |
| `delete()` com `deleteOne()` ou `findByIdAndDelete()` | Remove permanentemente o documento do banco | Usar `findByIdAndUpdate()` com `trashed: true` |
| `transform()` sem `flattenObjectIds: true` | ObjectIds sao retornados como objetos ao inves de strings | Usar `toJSON({ flattenObjectIds: true })` |
| In-memory sem `randomUUID()` no create | `_id` fica `undefined`, quebra buscas e updates | Usar `randomUUID()` de `node:crypto` |
| `buildWhereClause()` sem `trashed: false` | Queries retornam registros "deletados" | Sempre iniciar o where com `{ trashed: false }` |
| `count()` reimplementando logica de filtros | Duplicacao de codigo e risco de inconsistencia | Delegar para `findMany()` sem paginacao |
| `findBy()` sem tratar `null` | Mongoose retorna `null` quando nao encontra, pode causar erro em `transform()` | Checar `if (!entity) return null` antes de transformar |
| Payloads inline nos metodos do contract | Dificulta reuso dos tipos em use cases e testes | Definir tipos separados e exporta-los |
| In-memory `findMany()` sem filtrar `trashed` | Retorna registros com soft delete nos testes | Iniciar com `this.items.filter((item) => !item.trashed)` |

---

> **Cross-references:** ver `008-skill-model.md` para como o model Mongoose e definido e consumido pelo repository, `011-skill-di-registry.md` para como o contract e a implementacao Mongoose sao registrados no DI container, e `005-skill-teste-unitario.md` para como o in-memory repository e usado nos testes.
