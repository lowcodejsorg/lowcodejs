import { beforeEach, describe, expect, it, vi } from 'vitest';

import MenuInMemoryRepository from '@application/repositories/menu/menu-in-memory.repository';

import MenuDeleteUseCase from './delete.use-case';

let menuInMemoryRepository: MenuInMemoryRepository;
let sut: MenuDeleteUseCase;

describe('Menu Delete Use Case', () => {
  beforeEach(() => {
    menuInMemoryRepository = new MenuInMemoryRepository();
    sut = new MenuDeleteUseCase(menuInMemoryRepository);
  });

  it('deve deletar um menu com sucesso', async () => {
    const created = await menuInMemoryRepository.create({
      name: 'Dashboard',
      slug: 'dashboard',
      type: 'PAGE',
    });

    const result = await sut.execute({ _id: created._id });

    expect(result.isRight()).toBe(true);

    const deleted = await menuInMemoryRepository.findBy({
      _id: created._id,
      trashed: true,
      exact: true,
    });
    expect(deleted?.trashed).toBe(true);
  });

  it('deve retornar erro MENU_NOT_FOUND quando menu nao existe', async () => {
    const result = await sut.execute({ _id: 'non-existent-id' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('MENU_NOT_FOUND');
    }
  });

  it('deve retornar erro SEPARATOR_HAS_CHILDREN quando separator tem filhos ativos', async () => {
    const parent = await menuInMemoryRepository.create({
      name: 'Parent',
      slug: 'parent',
      type: 'SEPARATOR',
    });

    await menuInMemoryRepository.create({
      name: 'Child',
      slug: 'child',
      type: 'PAGE',
      parent: parent._id,
    });

    const result = await sut.execute({ _id: parent._id });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(409);
      expect(result.value.cause).toBe('SEPARATOR_HAS_CHILDREN');
    }
  });

  it('deve retornar erro DELETE_MENU_ERROR quando houver falha', async () => {
    vi.spyOn(menuInMemoryRepository, 'findBy').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({ _id: 'some-id' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('DELETE_MENU_ERROR');
    }
  });
});
