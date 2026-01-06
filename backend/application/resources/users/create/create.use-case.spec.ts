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
      expect(result.value.password).not.toBe('password123'); // deve estar hasheado
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
