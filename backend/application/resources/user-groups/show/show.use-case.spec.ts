import { beforeEach, describe, expect, it, vi } from 'vitest';

import UserGroupInMemoryRepository from '@application/repositories/user-group/user-group-in-memory.repository';

import UserGroupShowUseCase from './show.use-case';

let userGroupInMemoryRepository: UserGroupInMemoryRepository;
let sut: UserGroupShowUseCase;

describe('UserGroup Show Use Case', () => {
  beforeEach(() => {
    userGroupInMemoryRepository = new UserGroupInMemoryRepository();
    sut = new UserGroupShowUseCase(userGroupInMemoryRepository);
  });

  it('deve retornar um grupo de usuarios existente', async () => {
    const created = await userGroupInMemoryRepository.create({
      name: 'Administradores',
      slug: 'administradores',
      permissions: ['permission-1'],
    });

    const result = await sut.execute({ _id: created._id });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value._id).toBe(created._id);
      expect(result.value.name).toBe('Administradores');
    }
  });

  it('deve retornar erro USER_GROUP_NOT_FOUND quando grupo nao existe', async () => {
    const result = await sut.execute({ _id: 'non-existent-id' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('USER_GROUP_NOT_FOUND');
    }
  });

  it('deve retornar erro GET_USER_GROUP_BY_ID_ERROR quando houver falha', async () => {
    vi.spyOn(userGroupInMemoryRepository, 'findBy').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({ _id: 'some-id' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('GET_USER_GROUP_BY_ID_ERROR');
    }
  });
});
