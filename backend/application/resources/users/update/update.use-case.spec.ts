import { beforeEach, describe, expect, it, vi } from 'vitest';

import { E_USER_STATUS } from '@application/core/entity.core';
import UserInMemoryRepository from '@application/repositories/user/user-in-memory.repository';

import UserUpdateUseCase from './update.use-case';

let userInMemoryRepository: UserInMemoryRepository;
let sut: UserUpdateUseCase;

describe('User Update Use Case', () => {
  beforeEach(() => {
    userInMemoryRepository = new UserInMemoryRepository();
    sut = new UserUpdateUseCase(userInMemoryRepository);
  });

  it('deve atualizar usuario com sucesso (sem password)', async () => {
    const created = await userInMemoryRepository.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      group: 'group-id',
    });

    const result = await sut.execute({
      _id: created._id,
      name: 'John Updated',
      email: 'john.updated@example.com',
      group: 'new-group-id',
      status: E_USER_STATUS.ACTIVE,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.name).toBe('John Updated');
      expect(result.value.email).toBe('john.updated@example.com');
    }
  });

  it('deve atualizar usuario com nova senha (hasheada)', async () => {
    const created = await userInMemoryRepository.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'oldpassword',
      group: 'group-id',
    });

    const result = await sut.execute({
      _id: created._id,
      name: 'John Doe',
      email: 'john@example.com',
      group: 'group-id',
      status: E_USER_STATUS.ACTIVE,
      password: 'newpassword',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.password).not.toBe('newpassword');
      expect(result.value.password).not.toBe('oldpassword');
    }
  });

  it('deve retornar erro USER_NOT_FOUND (404) quando usuario nao existe', async () => {
    const result = await sut.execute({
      _id: 'non-existent-id',
      name: 'John Doe',
      email: 'john@example.com',
      group: 'group-id',
      status: E_USER_STATUS.ACTIVE,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('USER_NOT_FOUND');
      expect(result.value.message).toBe('User not found');
    }
  });

  it('deve retornar erro UPDATE_USER_ERROR (500) em falha de DB', async () => {
    vi.spyOn(userInMemoryRepository, 'findBy').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({
      _id: 'any-id',
      name: 'John Doe',
      email: 'john@example.com',
      group: 'group-id',
      status: E_USER_STATUS.ACTIVE,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('UPDATE_USER_ERROR');
    }
  });
});
