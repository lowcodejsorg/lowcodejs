import { beforeEach, describe, expect, it, vi } from 'vitest';

import MenuInMemoryRepository from '@application/repositories/menu/menu-in-memory.repository';

import PageShowUseCase from './show.use-case';

let menuInMemoryRepository: MenuInMemoryRepository;
let sut: PageShowUseCase;

describe('Page Show Use Case', () => {
  beforeEach(() => {
    menuInMemoryRepository = new MenuInMemoryRepository();
    sut = new PageShowUseCase(menuInMemoryRepository);
  });

  it('deve retornar uma pagina existente pelo slug', async () => {
    const findBySlugSpy = vi.spyOn(menuInMemoryRepository, 'findBySlug');

    await menuInMemoryRepository.create({
      name: 'Dashboard',
      slug: 'dashboard',
      type: 'PAGE',
    });

    const result = await sut.execute({ slug: 'dashboard' });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');

    expect(result.value.name).toBe('Dashboard');
    expect(result.value.slug).toBe('dashboard');
    expect(findBySlugSpy).toHaveBeenCalledWith('dashboard', { trashed: false });
  });

  it('deve retornar erro PAGE_NOT_FOUND quando pagina nao existe', async () => {
    const result = await sut.execute({ slug: 'non-existent' });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');

    expect(result.value.code).toBe(404);
    expect(result.value.cause).toBe('PAGE_NOT_FOUND');
    expect(result.value.message).toBe('Página não encontrada');
  });

  it('deve retornar erro GET_MENU_ERROR quando houver falha', async () => {
    menuInMemoryRepository.simulateError(
      'findBySlug',
      new Error('Database error'),
    );

    const result = await sut.execute({ slug: 'some-slug' });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');

    expect(result.value.code).toBe(500);
    expect(result.value.cause).toBe('GET_MENU_ERROR');
    expect(result.value.message).toBe('Erro interno do servidor');
  });
});
