import { readdir } from 'fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LocaleListUseCase from './list.use-case';

vi.mock('fs/promises', () => ({
  readdir: vi.fn(),
}));

let sut: LocaleListUseCase;

describe('Locale List Use Case', () => {
  beforeEach(() => {
    sut = new LocaleListUseCase();
    vi.clearAllMocks();
  });

  it('deve retornar lista de locales com sucesso', async () => {
    vi.mocked(readdir).mockResolvedValueOnce([
      'pt-br.properties',
      'en-us.properties',
    ] as any);

    const result = await sut.execute();

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0].locale).toBe('pt-br');
      expect(result.value[1].locale).toBe('en-us');
    }
  });

  it('deve retornar lista vazia quando nao houver locales', async () => {
    vi.mocked(readdir).mockResolvedValueOnce([]);

    const result = await sut.execute();

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value).toHaveLength(0);
    }
  });

  it('deve retornar erro LOCALES_READ_ERROR quando houver falha', async () => {
    vi.mocked(readdir).mockRejectedValueOnce(new Error('Directory not found'));

    const result = await sut.execute();

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('LOCALES_READ_ERROR');
    }
  });
});
