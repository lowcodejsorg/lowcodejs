import { beforeEach, describe, expect, it, vi } from 'vitest';

import { E_ROLE } from '@application/core/entity.core';
import UserInMemoryRepository from '@application/repositories/user/user-in-memory.repository';
import UserGroupInMemoryRepository from '@application/repositories/user-group/user-group-in-memory.repository';

import SignUpUseCase from './sign-up.use-case';

let userInMemoryRepository: UserInMemoryRepository;
let userGroupInMemoryRepository: UserGroupInMemoryRepository;
let sut: SignUpUseCase;

describe('Sign Up Use Case', () => {
  beforeEach(async () => {
    userInMemoryRepository = new UserInMemoryRepository();
    userGroupInMemoryRepository = new UserGroupInMemoryRepository();
    sut = new SignUpUseCase(
      userInMemoryRepository,
      userGroupInMemoryRepository,
    );

    await userGroupInMemoryRepository.create({
      name: 'Registered',
      slug: E_ROLE.REGISTERED,
      permissions: [],
    });
  });

  it('deve registrar usuario com sucesso', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.name).toBe('John Doe');
      expect(result.value.email).toBe('john@example.com');
    }
  });

  it('deve retornar erro USER_ALREADY_EXISTS quando email ja existir', async () => {
    await userInMemoryRepository.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      group: 'group-id',
    });

    const result = await sut.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(409);
      expect(result.value.cause).toBe('USER_ALREADY_EXISTS');
    }
  });

  it('deve retornar erro GROUP_NOT_FOUND quando grupo REGISTERED nao existir', async () => {
    const newUserRepo = new UserInMemoryRepository();
    const newGroupRepo = new UserGroupInMemoryRepository();
    const newSut = new SignUpUseCase(newUserRepo, newGroupRepo);

    const result = await newSut.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(409);
      expect(result.value.cause).toBe('GROUP_NOT_FOUND');
    }
  });

  it('deve retornar erro SIGN_UP_ERROR quando houver falha', async () => {
    vi.spyOn(userInMemoryRepository, 'findBy').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('SIGN_UP_ERROR');
    }
  });
});
