import { beforeEach, describe, expect, it, vi } from 'vitest';

import UserInMemoryRepository from '@application/repositories/user/user-in-memory.repository';

import UserPaginatedUseCase from './paginated.use-case';

let userInMemoryRepository: UserInMemoryRepository;
let sut: UserPaginatedUseCase;

describe('User Paginated Use Case', () => {
  beforeEach(() => {
    userInMemoryRepository = new UserInMemoryRepository();
    sut = new UserPaginatedUseCase(userInMemoryRepository);
  });

  it('deve retornar lista vazia quando nao houver usuarios', async () => {
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

  it('deve retornar lista de usuarios quando existirem', async () => {
    for (let i = 0; i < 5; i++) {
      await userInMemoryRepository.create({
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        password: 'password123',
        group: 'group-id',
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
      await userInMemoryRepository.create({
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        password: 'password123',
        group: 'group-id',
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

  it('deve retornar erro LIST_USER_PAGINATED_ERROR quando houver falha', async () => {
    vi.spyOn(userInMemoryRepository, 'findMany').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({
      page: 1,
      perPage: 20,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('LIST_USER_PAGINATED_ERROR');
    }
  });
});
