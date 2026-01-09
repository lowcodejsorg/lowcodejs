import { beforeEach, describe, expect, it, vi } from 'vitest';

import UserInMemoryRepository from '@application/repositories/user/user-in-memory.repository';

import ProfileShowUseCase from './show.use-case';

let userInMemoryRepository: UserInMemoryRepository;
let sut: ProfileShowUseCase;

describe('Profile Show Use Case', () => {
  beforeEach(() => {
    userInMemoryRepository = new UserInMemoryRepository();
    sut = new ProfileShowUseCase(userInMemoryRepository);
  });

  it('deve retornar o perfil do usuario existente', async () => {
    const created = await userInMemoryRepository.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashed_password',
      group: 'group-id',
    });

    const result = await sut.execute({ _id: created._id });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value._id).toBe(created._id);
      expect(result.value.name).toBe('John Doe');
      expect(result.value.email).toBe('john@example.com');
    }
  });

  it('deve retornar erro USER_NOT_FOUND quando usuario nao existe', async () => {
    const result = await sut.execute({ _id: 'non-existent-id' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('USER_NOT_FOUND');
    }
  });

  it('deve retornar erro GET_USER_PROFILE_ERROR quando houver falha', async () => {
    vi.spyOn(userInMemoryRepository, 'findBy').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({ _id: 'some-id' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('GET_USER_PROFILE_ERROR');
    }
  });
});
