import { beforeEach, describe, expect, it, vi } from 'vitest';

import MenuInMemoryRepository from '@application/repositories/menu/menu-in-memory.repository';

import MenuPaginatedUseCase from './paginated.use-case';

let menuInMemoryRepository: MenuInMemoryRepository;
let sut: MenuPaginatedUseCase;

describe('Menu Paginated Use Case', () => {
  beforeEach(() => {
    menuInMemoryRepository = new MenuInMemoryRepository();
    sut = new MenuPaginatedUseCase(menuInMemoryRepository);
  });

  it('deve retornar lista vazia quando nao houver menus', async () => {
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

  it('deve retornar lista de menus quando existirem', async () => {
    for (let i = 0; i < 5; i++) {
      await menuInMemoryRepository.create({
        name: `Menu ${i + 1}`,
        slug: `menu-${i + 1}`,
        type: 'PAGE',
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
      await menuInMemoryRepository.create({
        name: `Menu ${i + 1}`,
        slug: `menu-${i + 1}`,
        type: 'PAGE',
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

  it('deve filtrar menus por search', async () => {
    await menuInMemoryRepository.create({
      name: 'Dashboard',
      slug: 'dashboard',
      type: 'PAGE',
    });

    await menuInMemoryRepository.create({
      name: 'Settings',
      slug: 'settings',
      type: 'PAGE',
    });

    const result = await sut.execute({
      page: 1,
      perPage: 20,
      search: 'dash',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.data).toHaveLength(1);
      expect(result.value.data[0].name).toBe('Dashboard');
    }
  });

  it('deve retornar erro LIST_MENU_PAGINATED_ERROR quando houver falha', async () => {
    vi.spyOn(menuInMemoryRepository, 'findMany').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({
      page: 1,
      perPage: 20,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('LIST_MENU_PAGINATED_ERROR');
    }
  });
});
