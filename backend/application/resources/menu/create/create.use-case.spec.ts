import { beforeEach, describe, expect, it, vi } from 'vitest';

import MenuInMemoryRepository from '@application/repositories/menu/menu-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';

import MenuCreateUseCase from './create.use-case';

let menuInMemoryRepository: MenuInMemoryRepository;
let tableInMemoryRepository: TableInMemoryRepository;
let sut: MenuCreateUseCase;

describe('Menu Create Use Case', () => {
  beforeEach(() => {
    menuInMemoryRepository = new MenuInMemoryRepository();
    tableInMemoryRepository = new TableInMemoryRepository();
    sut = new MenuCreateUseCase(
      menuInMemoryRepository,
      tableInMemoryRepository,
    );
  });

  it('deve criar um menu com sucesso', async () => {
    const result = await sut.execute({
      name: 'Dashboard',
      slug: 'dashboard',
      type: 'PAGE',
      parent: null,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.name).toBe('Dashboard');
      expect(result.value.slug).toBe('dashboard');
      expect(result.value.type).toBe('PAGE');
      expect(result.value.url).toBe('/pages/dashboard');
    }
  });

  it('deve criar um menu do tipo EXTERNAL', async () => {
    const result = await sut.execute({
      name: 'Google',
      slug: 'google',
      type: 'EXTERNAL',
      url: 'https://google.com',
      parent: null,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.name).toBe('Google');
      expect(result.value.type).toBe('EXTERNAL');
      expect(result.value.url).toBe('https://google.com');
    }
  });

  it('deve retornar erro MENU_ALREADY_EXISTS quando slug ja existe', async () => {
    await menuInMemoryRepository.create({
      name: 'Existing Menu',
      slug: 'existing',
      type: 'PAGE',
    });

    const result = await sut.execute({
      name: 'New Menu',
      slug: 'existing',
      type: 'PAGE',
      parent: null,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(409);
      expect(result.value.cause).toBe('MENU_ALREADY_EXISTS');
    }
  });

  it('deve retornar erro PARENT_MENU_NOT_FOUND quando parent nao existe', async () => {
    const result = await sut.execute({
      name: 'Sub Menu',
      slug: 'sub-menu',
      type: 'PAGE',
      parent: 'non-existent-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('PARENT_MENU_NOT_FOUND');
    }
  });

  it('deve retornar erro INVALID_PARAMETERS quando tipo TABLE sem table', async () => {
    const result = await sut.execute({
      name: 'Table Menu',
      slug: 'table-menu',
      type: 'TABLE',
      parent: null,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(400);
      expect(result.value.cause).toBe('INVALID_PARAMETERS');
    }
  });

  it('deve retornar erro CREATE_MENU_ERROR quando houver falha', async () => {
    vi.spyOn(menuInMemoryRepository, 'findBy').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({
      name: 'Menu',
      slug: 'menu',
      type: 'PAGE',
      parent: null,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('CREATE_MENU_ERROR');
    }
  });
});
