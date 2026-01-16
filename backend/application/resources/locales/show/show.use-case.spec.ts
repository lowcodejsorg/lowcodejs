import { readFile } from 'fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LocaleShowUseCase from './show.use-case';

vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
}));

let sut: LocaleShowUseCase;

describe('Locale Show Use Case', () => {
  beforeEach(() => {
    sut = new LocaleShowUseCase();
    vi.clearAllMocks();
  });

  it('deve retornar traducoes com sucesso', async () => {
    const mockContent = `
# Comentario
HELLO=World
GOODBYE=Tchau
    `.trim();

    vi.mocked(readFile).mockResolvedValueOnce(mockContent);

    const result = await sut.execute({ locale: 'pt-br' });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.HELLO).toBe('World');
      expect(result.value.GOODBYE).toBe('Tchau');
    }
  });

  it('deve retornar array quando valor contem ponto e virgula', async () => {
    const mockContent = `
ITEMS=Item1;Item2;Item3
    `.trim();

    vi.mocked(readFile).mockResolvedValueOnce(mockContent);

    const result = await sut.execute({ locale: 'pt-br' });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.ITEMS).toEqual(['Item1', 'Item2', 'Item3']);
    }
  });

  it('deve ignorar linhas de comentario', async () => {
    const mockContent = `
# Este eh um comentario
KEY=Value
# Outro comentario
    `.trim();

    vi.mocked(readFile).mockResolvedValueOnce(mockContent);

    const result = await sut.execute({ locale: 'pt-br' });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(Object.keys(result.value)).toHaveLength(1);
      expect(result.value.KEY).toBe('Value');
    }
  });

  it('deve preservar sinal de igual no valor', async () => {
    const mockContent = `
EQUATION=a=b+c
    `.trim();

    vi.mocked(readFile).mockResolvedValueOnce(mockContent);

    const result = await sut.execute({ locale: 'pt-br' });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.EQUATION).toBe('a=b+c');
    }
  });

  it('deve retornar erro LOCALE_NOT_FOUND quando arquivo nao existir', async () => {
    vi.mocked(readFile).mockRejectedValueOnce(new Error('ENOENT'));

    const result = await sut.execute({ locale: 'inexistente' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('LOCALE_NOT_FOUND');
    }
  });
});
