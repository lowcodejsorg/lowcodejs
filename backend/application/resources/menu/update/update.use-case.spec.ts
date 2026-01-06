import { beforeEach, describe, expect, it, vi } from 'vitest';

import MenuInMemoryRepository from '@application/repositories/menu/menu-in-memory.repository';

import MenuUpdateUseCase from './update.use-case';

let menuInMemoryRepository: MenuInMemoryRepository;
let sut: MenuUpdateUseCase;

describe('Menu Update Use Case', () => {
  beforeEach(() => {
    menuInMemoryRepository = new MenuInMemoryRepository();
    sut = new MenuUpdateUseCase(menuInMemoryRepository);
  });

  it('deve atualizar um menu com sucesso', async () => {
    const created = await menuInMemoryRepository.create({
      name: 'Dashboard',
      slug: 'dashboard',
      type: 'PAGE',
    });

    const result = await sut.execute({
      _id: created._id,
      name: 'Updated Dashboard',
      parent: null,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.name).toBe('Updated Dashboard');
    }
  });

  it('deve atualizar slug do menu', async () => {
    const created = await menuInMemoryRepository.create({
      name: 'Dashboard',
      slug: 'dashboard',
      type: 'PAGE',
    });

    const result = await sut.execute({
      _id: created._id,
      slug: 'new-dashboard',
      parent: null,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.slug).toBe('new-dashboard');
    }
  });

  it('deve retornar erro MENU_NOT_FOUND quando menu nao existe', async () => {
    const result = await sut.execute({
      _id: 'non-existent-id',
      name: 'Updated',
      parent: null,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('MENU_NOT_FOUND');
    }
  });

  it('deve retornar erro MENU_ALREADY_EXISTS quando novo slug ja existe', async () => {
    await menuInMemoryRepository.create({
      name: 'Existing',
      slug: 'existing',
      type: 'PAGE',
    });

    const toUpdate = await menuInMemoryRepository.create({
      name: 'To Update',
      slug: 'to-update',
      type: 'PAGE',
    });

    const result = await sut.execute({
      _id: toUpdate._id,
      slug: 'existing',
      parent: null,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(409);
      expect(result.value.cause).toBe('MENU_ALREADY_EXISTS');
    }
  });

  it('deve retornar erro INVALID_PARAMETERS quando tipo TABLE sem table', async () => {
    const created = await menuInMemoryRepository.create({
      name: 'Menu',
      slug: 'menu',
      type: 'PAGE',
    });

    const result = await sut.execute({
      _id: created._id,
      type: 'TABLE',
      parent: null,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(400);
      expect(result.value.cause).toBe('INVALID_PARAMETERS');
    }
  });

  it('deve retornar erro UPDATE_MENU_ERROR quando houver falha', async () => {
    vi.spyOn(menuInMemoryRepository, 'findBy').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({
      _id: 'some-id',
      name: 'Updated',
      parent: null,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('UPDATE_MENU_ERROR');
    }
  });
});
