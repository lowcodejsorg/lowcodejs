import { beforeEach, describe, expect, it, vi } from 'vitest';

import UserGroupInMemoryRepository from '@application/repositories/user-group/user-group-in-memory.repository';

import UserGroupListUseCase from './list.use-case';

let userGroupInMemoryRepository: UserGroupInMemoryRepository;
let sut: UserGroupListUseCase;

describe('UserGroup List Use Case', () => {
  beforeEach(() => {
    userGroupInMemoryRepository = new UserGroupInMemoryRepository();
    sut = new UserGroupListUseCase(userGroupInMemoryRepository);
  });

  it('deve retornar lista vazia quando nao houver grupos', async () => {
    const result = await sut.execute();

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value).toHaveLength(0);
    }
  });

  it('deve retornar lista de grupos quando existirem', async () => {
    for (let i = 0; i < 5; i++) {
      await userGroupInMemoryRepository.create({
        name: `Grupo ${i + 1}`,
        slug: `grupo-${i + 1}`,
        permissions: ['permission-1'],
      });
    }

    const result = await sut.execute();

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value).toHaveLength(5);
    }
  });

  it('deve retornar erro LIST_USER_GROUP_ERROR quando houver falha', async () => {
    vi.spyOn(userGroupInMemoryRepository, 'findMany').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute();

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('LIST_USER_GROUP_ERROR');
    }
  });
});
