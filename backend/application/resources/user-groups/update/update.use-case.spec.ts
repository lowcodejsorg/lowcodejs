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
    const findByIdSpy = vi.spyOn(userGroupInMemoryRepository, 'findById');
    const updateSpy = vi.spyOn(userGroupInMemoryRepository, 'update');

    const created = await userGroupInMemoryRepository.create({
      name: 'Administradores',
      slug: 'administradores',
      permissions: ['permission-1'],
    });

    const result = await sut.execute({
      _id: created._id,
      permissions: ['permission-1', 'permission-2'],
      description: 'Group description',
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');

    expect(result.value.permissions).toHaveLength(2);
    expect(findByIdSpy).toHaveBeenCalledWith(created._id);
    expect(updateSpy).toHaveBeenCalledOnce();
  });

  it('deve retornar erro USER_GROUP_NOT_FOUND quando grupo nao existe', async () => {
    const result = await sut.execute({
      _id: 'non-existent-id',
      permissions: ['permission-1'],
      description: 'Group description',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');

    expect(result.value.code).toBe(404);
    expect(result.value.cause).toBe('USER_GROUP_NOT_FOUND');
    expect(result.value.message).toBe('Grupo de usuários não encontrado');
  });

  it('deve retornar erro quando nao informar permissoes', async () => {
    const created = await userGroupInMemoryRepository.create({
      name: 'Grupo',
      slug: 'grupo',
      permissions: ['permission-1'],
    });

    const result = await sut.execute({
      _id: created._id,
      permissions: [],
      description: 'Group description',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');

    expect(result.value.code).toBe(400);
    expect(result.value.message).toBe(
      'Ao menos uma permissão deve ser informada para o grupo de usuários',
    );
  });

  it('deve retornar erro UPDATE_USER_GROUP_ERROR quando houver falha', async () => {
    userGroupInMemoryRepository.simulateError(
      'findById',
      new Error('Database error'),
    );

    const result = await sut.execute({
      _id: 'some-id',
      permissions: ['permission-1'],
      description: 'Group description',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');

    expect(result.value.code).toBe(500);
    expect(result.value.cause).toBe('UPDATE_USER_GROUP_ERROR');
    expect(result.value.message).toBe('Erro interno do servidor');
  });
});
