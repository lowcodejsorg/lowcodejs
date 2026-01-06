import { beforeEach, describe, expect, it, vi } from 'vitest';

import UserGroupInMemoryRepository from '@application/repositories/user-group/user-group-in-memory.repository';

import UserGroupCreateUseCase from './create.use-case';

let userGroupInMemoryRepository: UserGroupInMemoryRepository;
let sut: UserGroupCreateUseCase;

describe('UserGroup Create Use Case', () => {
  beforeEach(() => {
    userGroupInMemoryRepository = new UserGroupInMemoryRepository();
    sut = new UserGroupCreateUseCase(userGroupInMemoryRepository);
  });

  it('deve criar um grupo de usuarios com sucesso', async () => {
    const result = await sut.execute({
      name: 'Administradores',
      description: 'Grupo de administradores',
      permissions: ['permission-1', 'permission-2'],
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.name).toBe('Administradores');
      expect(result.value.slug).toBe('administradores');
      expect(result.value.permissions).toHaveLength(2);
    }
  });

  it('deve retornar erro GROUP_EXISTS quando slug ja existe', async () => {
    await userGroupInMemoryRepository.create({
      name: 'Existing Group',
      slug: 'existing-group',
      permissions: ['permission-1'],
    });

    const result = await sut.execute({
      name: 'Existing Group',
      permissions: ['permission-1'],
      description: 'Group description',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(409);
      expect(result.value.cause).toBe('GROUP_EXISTS');
    }
  });

  it('deve retornar erro quando nao informar permissoes', async () => {
    const result = await sut.execute({
      name: 'Grupo sem permissoes',
      permissions: [],
      description: 'Group description',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(400);
    }
  });

  it('deve retornar erro CREATE_USER_GROUP_ERROR quando houver falha', async () => {
    vi.spyOn(userGroupInMemoryRepository, 'findBy').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({
      name: 'Grupo',
      permissions: ['permission-1'],
      description: 'Group description',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('CREATE_USER_GROUP_ERROR');
    }
  });
});
