import { beforeEach, describe, expect, it, vi } from 'vitest';

import MenuInMemoryRepository from '@application/repositories/menu/menu-in-memory.repository';

import MenuListUseCase from './list.use-case';

let menuInMemoryRepository: MenuInMemoryRepository;
let sut: MenuListUseCase;

describe('Menu List Use Case', () => {
  beforeEach(() => {
    menuInMemoryRepository = new MenuInMemoryRepository();
    sut = new MenuListUseCase(menuInMemoryRepository);
  });

  it('deve retornar lista vazia quando nao houver menus', async () => {
    const result = await sut.execute();

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value).toHaveLength(0);
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

    const result = await sut.execute();

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value).toHaveLength(5);
    }
  });

  it('deve retornar apenas menus nao deletados', async () => {
    const menu1 = await menuInMemoryRepository.create({
      name: 'Menu 1',
      slug: 'menu-1',
      type: 'PAGE',
    });

    await menuInMemoryRepository.create({
      name: 'Menu 2',
      slug: 'menu-2',
      type: 'PAGE',
    });

    await menuInMemoryRepository.delete(menu1._id);

    const result = await sut.execute();

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].name).toBe('Menu 2');
    }
  });

  it('deve retornar erro LIST_MENU_PAGINATED_ERROR quando houver falha', async () => {
    vi.spyOn(menuInMemoryRepository, 'findMany').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute();

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('LIST_MENU_PAGINATED_ERROR');
    }
  });
});
