---
name: maiyu:backend-di-registry
description: |
  Generates dependency injection registry for backend Node.js projects.
  Use when: user asks to create DI setup, dependency injection, service registration,
  IoC container, or mentions "DI", "registry", "inject" for dependency management.
  Supports: fastify-decorators, tsyringe, inversify, NestJS modules, awilix.
  Frameworks: Fastify, Express, NestJS, AdonisJS.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating, detect:

1. From `dependencies`: `fastify-decorators` | `tsyringe` | `inversify` | `@nestjs/core` | `awilix`
2. Scan for existing registry: `core/di-registry.ts` | `src/container.ts`
3. Scan for contract/interface pattern: `*-contract.repository.ts`, `*-contract.service.ts`

## Conventions

### Rules
- No ternary operators — use if/else or early returns
- No `any` type — use `unknown`, concrete types, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- All functions must have explicit return types
- Multiple conditions use const mapper (object lookup) instead of switch/if-else chains

### Pattern
- **Contract** (abstract class or interface): defines the API
- **Implementation**: concrete class implementing the contract
- **Registry**: single file mapping contracts → implementations
- Change ORM/provider by editing ONLY the registry file

### Naming
- Contract: `{Entity}ContractRepository`, `{Feature}ContractService`
- Implementation: `{Entity}MongooseRepository`, `{Entity}PrismaRepository`
- Registry: `core/di-registry.ts` or `src/container.ts`

## Templates

### Fastify Decorators (Reference Implementation)

```typescript
// core/di-registry.ts
import { injectablesHolder } from 'fastify-decorators';

// Repositories
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';
import UserMongooseRepository from '@application/repositories/user/user-mongoose.repository';

import { TableContractRepository } from '@application/repositories/table/table-contract.repository';
import TableMongooseRepository from '@application/repositories/table/table-mongoose.repository';

import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import FieldMongooseRepository from '@application/repositories/field/field-mongoose.repository';

// Services
import { EmailContractService } from '@application/services/email/email-contract.service';
import NodemailerEmailService from '@application/services/email/nodemailer-email.service';

/**
 * Central DI registry.
 * To switch ORM/provider, change only the imports and registrations here.
 */
export function registerDependencies(): void {
  // Repositories
  injectablesHolder.injectService(UserContractRepository, UserMongooseRepository);
  injectablesHolder.injectService(TableContractRepository, TableMongooseRepository);
  injectablesHolder.injectService(FieldContractRepository, FieldMongooseRepository);

  // Services
  injectablesHolder.injectService(EmailContractService, NodemailerEmailService);
}
```

**Contract Example:**
```typescript
// repositories/user/user-contract.repository.ts
import type { IUser, ISearch, IMeta } from '@application/core/entity.core';

export abstract class UserContractRepository {
  abstract create(data: Partial<IUser>): Promise<IUser>;
  abstract findById(id: string): Promise<IUser | null>;
  abstract findByEmail(email: string): Promise<IUser | null>;
  abstract paginated(search: ISearch): Promise<{ data: Array<IUser>; meta: IMeta }>;
  abstract update(id: string, data: Partial<IUser>): Promise<IUser | null>;
  abstract delete(id: string): Promise<void>;
}
```

**Implementation Example:**
```typescript
// repositories/user/user-mongoose.repository.ts
import { Service } from 'fastify-decorators';

import { User } from '@application/model/user.model';
import type { IUser, ISearch, IMeta } from '@application/core/entity.core';
import { UserContractRepository } from './user-contract.repository';

@Service()
export default class UserMongooseRepository extends UserContractRepository {
  async create(data: Partial<IUser>): Promise<IUser> {
    return User.create(data);
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id).populate('group').lean();
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email }).populate('group').lean();
  }

  async paginated(search: ISearch): Promise<{ data: Array<IUser>; meta: IMeta }> {
    const { page = 1, perPage = 50 } = search;
    const skip = (page - 1) * perPage;

    const [data, total] = await Promise.all([
      User.find({}).skip(skip).limit(perPage).populate('group').lean<IUser[]>(),
      User.countDocuments({}),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }

  async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, data, { new: true }).populate('group').lean();
  }

  async delete(id: string): Promise<void> {
    await User.findByIdAndDelete(id);
  }
}
```

**Usage in Use Cases:**
```typescript
import { Service } from 'fastify-decorators';
import { getInstanceByToken } from 'fastify-decorators';

import { UserContractRepository } from '@application/repositories/user/user-contract.repository';

@Service()
export default class CreateUserUseCase {
  constructor(
    private readonly repository: UserContractRepository = getInstanceByToken(
      UserContractRepository,
    ),
  ) {}

  async execute(payload: CreatePayload): Promise<Either<HTTPException, IUser>> {
    // Uses contract — doesn't know about Mongoose
    const existing = await this.repository.findByEmail(payload.email);
    // ...
  }
}
```

### tsyringe

```typescript
// src/container.ts
import { container } from 'tsyringe';

import { UserContractRepository } from './repositories/user-contract.repository';
import { UserMongooseRepository } from './repositories/user-mongoose.repository';

container.register(UserContractRepository, { useClass: UserMongooseRepository });

export { container };
```

### inversify

```typescript
// src/container.ts
import { Container } from 'inversify';

import { TYPES } from './types';
import { UserContractRepository } from './repositories/user-contract.repository';
import { UserMongooseRepository } from './repositories/user-mongoose.repository';

const container = new Container();

container.bind<UserContractRepository>(TYPES.UserRepository).to(UserMongooseRepository);

export { container };
```

### NestJS Modules

```typescript
// src/users/users.module.ts
import { Module } from '@nestjs/common';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserContractRepository } from './repositories/user-contract.repository';
import { UserMongooseRepository } from './repositories/user-mongoose.repository';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: UserContractRepository, useClass: UserMongooseRepository },
  ],
  exports: [UsersService],
})
export class UsersModule {}
```

## Checklist

- [ ] Abstract contract class for each entity
- [ ] Implementation class with `@Service()` decorator
- [ ] Central registry function mapping contracts to implementations
- [ ] Use cases depend on contracts (not implementations)
- [ ] Easy to swap implementations by changing registry only
