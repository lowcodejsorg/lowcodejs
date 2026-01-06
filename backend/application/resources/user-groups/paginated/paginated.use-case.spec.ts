import { beforeEach, describe, expect, it, vi } from 'vitest';

import UserGroupInMemoryRepository from '@application/repositories/user-group/user-group-in-memory.repository';

import UserGroupPaginatedUseCase from './paginated.use-case';

let userGroupInMemoryRepository: UserGroupInMemoryRepository;
let sut: UserGroupPaginatedUseCase;

describe('UserGroup Paginated Use Case', () => {
  beforeEach(() => {
    userGroupInMemoryRepository = new UserGroupInMemoryRepository();
    sut = new UserGroupPaginatedUseCase(userGroupInMemoryRepository);
  });

  it('deve retornar lista vazia quando nao houver grupos', async () => {
    const result = await sut.execute({
      page: 1,
      perPage: 20,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.data).toHaveLength(0);
      expect(result.value.meta.total).toBe(0);
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

    const result = await sut.execute({
      page: 1,
      perPage: 20,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.data).toHaveLength(5);
      expect(result.value.meta.total).toBe(5);
      expect(result.value.meta.page).toBe(1);
      expect(result.value.meta.perPage).toBe(20);
    }
  });

  it('deve retornar meta com paginacao correta', async () => {
    for (let i = 0; i < 25; i++) {
      await userGroupInMemoryRepository.create({
        name: `Grupo ${i + 1}`,
        slug: `grupo-${i + 1}`,
        permissions: ['permission-1'],
      });
    }

    const result = await sut.execute({
      page: 1,
      perPage: 10,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.data).toHaveLength(10);
      expect(result.value.meta.total).toBe(25);
      expect(result.value.meta.lastPage).toBe(3);
      expect(result.value.meta.firstPage).toBe(1);
    }
  });

  it('deve filtrar grupos por search', async () => {
    await userGroupInMemoryRepository.create({
      name: 'Administradores',
      slug: 'administradores',
      permissions: ['permission-1'],
    });

    await userGroupInMemoryRepository.create({
      name: 'Usuarios',
      slug: 'usuarios',
      permissions: ['permission-1'],
    });

    const result = await sut.execute({
      page: 1,
      perPage: 20,
      search: 'admin',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.data).toHaveLength(1);
      expect(result.value.data[0].name).toBe('Administradores');
    }
  });

  it('deve retornar erro LIST_USER_GROUP_PAGINATED_ERROR quando houver falha', async () => {
    vi.spyOn(userGroupInMemoryRepository, 'findMany').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({
      page: 1,
      perPage: 20,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('LIST_USER_GROUP_PAGINATED_ERROR');
    }
  });
});
