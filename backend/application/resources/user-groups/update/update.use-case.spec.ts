import { beforeEach, describe, expect, it, vi } from 'vitest';

import UserGroupInMemoryRepository from '@application/repositories/user-group/user-group-in-memory.repository';

import UserGroupUpdateUseCase from './update.use-case';

let userGroupInMemoryRepository: UserGroupInMemoryRepository;
let sut: UserGroupUpdateUseCase;

describe('UserGroup Update Use Case', () => {
  beforeEach(() => {
    userGroupInMemoryRepository = new UserGroupInMemoryRepository();
    sut = new UserGroupUpdateUseCase(userGroupInMemoryRepository);
  });

  it('deve atualizar um grupo de usuarios com sucesso', async () => {
    const created = await userGroupInMemoryRepository.create({
      name: 'Administradores',
      slug: 'administradores',
      permissions: ['permission-1'],
    });

    const result = await sut.execute({
      _id: created._id,
      // name: 'Super Administradores',
      permissions: ['permission-1', 'permission-2'],
      description: 'Group description',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      // expect(result.value.name).toBe('Super Administradores');
      expect(result.value.permissions).toHaveLength(2);
    }
  });

  it('deve retornar erro USER_GROUP_NOT_FOUND quando grupo nao existe', async () => {
    const result = await sut.execute({
      _id: 'non-existent-id',
      // name: 'Updated',
      permissions: ['permission-1'],
      description: 'Group description',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('USER_GROUP_NOT_FOUND');
    }
  });

  it('deve retornar erro quando nao informar permissoes', async () => {
    const created = await userGroupInMemoryRepository.create({
      name: 'Grupo',
      slug: 'grupo',
      permissions: ['permission-1'],
    });

    const result = await sut.execute({
      _id: created._id,
      // name: 'Updated',
      permissions: [],
      description: 'Group description',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(400);
    }
  });

  it('deve retornar erro UPDATE_USER_GROUP_ERROR quando houver falha', async () => {
    vi.spyOn(userGroupInMemoryRepository, 'findBy').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({
      _id: 'some-id',
      // name: 'Updated',
      permissions: ['permission-1'],
      description: 'Group description',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('UPDATE_USER_GROUP_ERROR');
    }
  });
});
