import { beforeEach, describe, expect, it, vi } from 'vitest';

import UserInMemoryRepository from '@application/repositories/user/user-in-memory.repository';

import UpdatePasswordRecoveryUseCase from './reset-password.use-case';

let userInMemoryRepository: UserInMemoryRepository;
let sut: UpdatePasswordRecoveryUseCase;

describe('Reset Password Use Case', () => {
  beforeEach(() => {
    userInMemoryRepository = new UserInMemoryRepository();
    sut = new UpdatePasswordRecoveryUseCase(userInMemoryRepository);
  });

  it('deve atualizar senha com sucesso', async () => {
    const user = await userInMemoryRepository.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'old_password',
      group: 'group-id',
    });

    const result = await sut.execute({
      _id: user._id,
      password: 'new_password',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value).toBeNull();
    }
  });

  it('deve retornar erro USER_NOT_FOUND quando usuario nao existir', async () => {
    const result = await sut.execute({
      _id: 'non-existent-id',
      password: 'new_password',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('USER_NOT_FOUND');
    }
  });

  it('deve retornar erro UPDATE_PASSWORD_ERROR quando houver falha', async () => {
    vi.spyOn(userInMemoryRepository, 'findBy').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({
      _id: 'some-id',
      password: 'new_password',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('UPDATE_PASSWORD_ERROR');
    }
  });
});
