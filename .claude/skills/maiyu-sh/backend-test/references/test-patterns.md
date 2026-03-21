# Test Patterns Reference

## Unit Test: Create Use-Case (Complete Example)

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UserInMemoryRepository from '@application/repositories/user/user-in-memory.repository';
import UserCreateUseCase from './create.use-case';

let userInMemoryRepository: UserInMemoryRepository;
let sut: UserCreateUseCase;

describe('User Create Use Case', () => {
  beforeEach(() => {
    userInMemoryRepository = new UserInMemoryRepository();
    sut = new UserCreateUseCase(userInMemoryRepository);
  });

  it('deve criar um usuário com sucesso', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      group: 'group-id',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.name).toBe('John Doe');
      expect(result.value.email).toBe('john@example.com');
      expect(result.value.password).not.toBe('password123');
    }
  });

  it('deve retornar erro USER_ALREADY_EXISTS quando email ja existe', async () => {
    await userInMemoryRepository.create({
      name: 'Existing User',
      email: 'existing@example.com',
      password: 'password123',
      group: 'group-id',
    });

    const result = await sut.execute({
      name: 'New User',
      email: 'existing@example.com',
      password: 'password123',
      group: 'group-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(409);
      expect(result.value.cause).toBe('USER_ALREADY_EXISTS');
    }
  });

  it('deve retornar erro CREATE_USER_ERROR quando houver falha', async () => {
    vi.spyOn(userInMemoryRepository, 'findBy').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      group: 'group-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('CREATE_USER_ERROR');
    }
  });
});
```

## E2E Test: Create Controller (Complete Example)

```typescript
import supertest from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { UserGroup } from '@application/model/user-group.model';
import { User } from '@application/model/user.model';
import { kernel } from '@start/kernel';
import { createAuthenticatedUser } from '@test/helpers/auth.helper';

describe('E2E User Create Controller', () => {
  beforeEach(async () => {
    await kernel.ready();
    await User.deleteMany({});
    await UserGroup.deleteMany({});
  });

  afterAll(async () => {
    await kernel.close();
  });

  describe('POST /users', () => {
    it('deve criar usuario com sucesso', async () => {
      const { cookies, permissions } = await createAuthenticatedUser();

      const group = await UserGroup.create({
        name: 'Customer',
        slug: 'customer',
        permissions,
      });

      const response = await supertest(kernel.server)
        .post('/users')
        .set('Cookie', cookies)
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'S3nha@123A',
          group: group._id.toString(),
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.name).toBe('New User');
      expect(response.body.email).toBe('newuser@example.com');
    });

    it('deve retornar 409 quando usuario ja existe', async () => {
      const { cookies, permissions } = await createAuthenticatedUser();

      const group = await UserGroup.create({
        name: 'Customer',
        slug: 'customer',
        permissions,
      });

      // Create first user
      await supertest(kernel.server)
        .post('/users')
        .set('Cookie', cookies)
        .send({
          name: 'Existing User',
          email: 'existing@example.com',
          password: 'S3nha@123A',
          group: group._id.toString(),
        });

      // Attempt to create duplicate
      const response = await supertest(kernel.server)
        .post('/users')
        .set('Cookie', cookies)
        .send({
          name: 'Duplicate User',
          email: 'existing@example.com',
          password: 'S3nha@123A',
          group: group._id.toString(),
        });

      expect(response.statusCode).toBe(409);
      expect(response.body.cause).toBe('USER_ALREADY_EXISTS');
    });

    it('deve retornar 400 quando payload invalido', async () => {
      const { cookies } = await createAuthenticatedUser();

      const response = await supertest(kernel.server)
        .post('/users')
        .set('Cookie', cookies)
        .send({
          name: '',
          email: 'invalid-email',
        });

      expect(response.statusCode).toBe(400);
    });

    it('deve retornar 401 quando nao autenticado', async () => {
      const response = await supertest(kernel.server)
        .post('/users')
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'S3nha@123A',
          group: 'group-id',
        });

      expect(response.statusCode).toBe(401);
    });
  });
});
```

## Unit Test: Paginated Use-Case

```typescript
import { beforeEach, describe, expect, it } from 'vitest';
import UserInMemoryRepository from '@application/repositories/user/user-in-memory.repository';
import UserPaginatedUseCase from './paginated.use-case';

let userInMemoryRepository: UserInMemoryRepository;
let sut: UserPaginatedUseCase;

describe('User Paginated Use Case', () => {
  beforeEach(() => {
    userInMemoryRepository = new UserInMemoryRepository();
    sut = new UserPaginatedUseCase(userInMemoryRepository);
  });

  it('deve retornar lista paginada', async () => {
    await userInMemoryRepository.create({
      name: 'User 1',
      email: 'user1@example.com',
      password: 'password',
      group: 'group-id',
    });
    await userInMemoryRepository.create({
      name: 'User 2',
      email: 'user2@example.com',
      password: 'password',
      group: 'group-id',
    });

    const result = await sut.execute({ page: 1, perPage: 10 });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.data).toHaveLength(2);
      expect(result.value.meta.total).toBe(2);
      expect(result.value.meta.page).toBe(1);
      expect(result.value.meta.lastPage).toBe(1);
    }
  });

  it('deve retornar lista vazia', async () => {
    const result = await sut.execute({ page: 1, perPage: 10 });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.data).toHaveLength(0);
      expect(result.value.meta.total).toBe(0);
      expect(result.value.meta.firstPage).toBe(0);
    }
  });

  it('deve filtrar por busca', async () => {
    await userInMemoryRepository.create({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password',
      group: 'group-id',
    });
    await userInMemoryRepository.create({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'password',
      group: 'group-id',
    });

    const result = await sut.execute({
      page: 1,
      perPage: 10,
      search: 'alice',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.data).toHaveLength(1);
      expect(result.value.data[0].name).toBe('Alice');
    }
  });
});
```

## Unit Test: Update Use-Case

```typescript
describe('User Update Use Case', () => {
  beforeEach(() => {
    userInMemoryRepository = new UserInMemoryRepository();
    sut = new UserUpdateUseCase(userInMemoryRepository);
  });

  it('deve atualizar usuario com sucesso', async () => {
    const user = await userInMemoryRepository.create({
      name: 'Original Name',
      email: 'user@example.com',
      password: 'password',
      group: 'group-id',
    });

    const result = await sut.execute({
      _id: user._id,
      name: 'Updated Name',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.name).toBe('Updated Name');
    }
  });

  it('deve retornar erro USER_NOT_FOUND quando nao existe', async () => {
    const result = await sut.execute({
      _id: 'non-existent-id',
      name: 'Updated Name',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('USER_NOT_FOUND');
    }
  });
});
```

## Unit Test: Delete Use-Case

```typescript
describe('User Delete Use Case', () => {
  beforeEach(() => {
    userInMemoryRepository = new UserInMemoryRepository();
    sut = new UserDeleteUseCase(userInMemoryRepository);
  });

  it('deve deletar usuario com sucesso', async () => {
    const user = await userInMemoryRepository.create({
      name: 'To Delete',
      email: 'delete@example.com',
      password: 'password',
      group: 'group-id',
    });

    const result = await sut.execute({ _id: user._id });

    expect(result.isRight()).toBe(true);

    const found = await userInMemoryRepository.findBy({
      _id: user._id,
      exact: true,
    });

    if (found) {
      expect(found.trashed).toBe(true);
      expect(found.trashedAt).toBeInstanceOf(Date);
    }
  });

  it('deve retornar erro USER_NOT_FOUND quando nao existe', async () => {
    const result = await sut.execute({ _id: 'non-existent-id' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('USER_NOT_FOUND');
    }
  });
});
```

## Test Helper: Authentication

```typescript
// test/helpers/auth.helper.ts
import { UserGroup } from '@application/model/user-group.model';
import { User } from '@application/model/user.model';
import { kernel } from '@start/kernel';
import bcrypt from 'bcryptjs';

export async function createAuthenticatedUser() {
  const permissions = await createDefaultPermissions();

  const group = await UserGroup.create({
    name: 'Admin',
    slug: 'master',
    permissions,
  });

  const password = await bcrypt.hash('S3nha@123A', 12);
  const user = await User.create({
    name: 'Test Admin',
    email: 'admin@test.com',
    password,
    status: 'active',
    group: group._id,
  });

  // Login to get cookies
  const loginResponse = await supertest(kernel.server)
    .post('/auth/sign-in')
    .send({ email: 'admin@test.com', password: 'S3nha@123A' });

  const cookies = loginResponse.headers['set-cookie'];

  return { user, group, cookies, permissions };
}
```

## Multiple Dependencies in Use-Case Test

When a use-case depends on multiple repositories or services:

```typescript
let userInMemoryRepository: UserInMemoryRepository;
let emailService: InMemoryEmailService;
let sut: UserCreateUseCase;

beforeEach(() => {
  userInMemoryRepository = new UserInMemoryRepository();
  emailService = new InMemoryEmailService();
  sut = new UserCreateUseCase(userInMemoryRepository, emailService);
});

it('should send welcome email after creation', async () => {
  const result = await sut.execute({ /* payload */ });

  expect(result.isRight()).toBe(true);
  expect(emailService.getSentEmails()).toHaveLength(1);
  expect(emailService.getSentEmails()[0].options.subject).toContain('Welcome');
});
```
