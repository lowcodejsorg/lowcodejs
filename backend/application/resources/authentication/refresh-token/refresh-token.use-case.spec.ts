import { beforeEach, describe, expect, it, vi } from 'vitest';

import UserInMemoryRepository from '@application/repositories/user/user-in-memory.repository';

import RefreshTokenUseCase from './refresh-token.use-case';

let userInMemoryRepository: UserInMemoryRepository;
let sut: RefreshTokenUseCase;

describe('Refresh Token Use Case', () => {
  beforeEach(() => {
    userInMemoryRepository = new UserInMemoryRepository();
    sut = new RefreshTokenUseCase(userInMemoryRepository);
  });

  it('deve retornar usuario quando refresh token for valido', async () => {
    const user = await userInMemoryRepository.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password',
      group: 'group-id',
    });

    const result = await sut.execute({ user: user._id });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value._id).toBe(user._id);
      expect(result.value.email).toBe('john@example.com');
    }
  });

  it('deve retornar erro USER_NOT_FOUND quando usuario nao existir', async () => {
    const result = await sut.execute({ user: 'non-existent-id' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('USER_NOT_FOUND');
    }
  });

  it('deve retornar erro REFRESH_TOKEN_ERROR quando houver falha', async () => {
    vi.spyOn(userInMemoryRepository, 'findBy').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({ user: 'some-id' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('REFRESH_TOKEN_ERROR');
    }
  });
});
