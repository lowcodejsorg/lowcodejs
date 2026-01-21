import { beforeEach, describe, expect, it, vi } from 'vitest';

import SettingInMemoryRepository from '@application/repositories/setting/setting-in-memory.repository';

import SettingShowUseCase from './show.use-case';

let settingInMemoryRepository: SettingInMemoryRepository;
let sut: SettingShowUseCase;

describe('Setting Show Use Case', () => {
  beforeEach(() => {
    settingInMemoryRepository = new SettingInMemoryRepository();
    sut = new SettingShowUseCase(settingInMemoryRepository);
  });

  it('deve retornar configurações do banco quando existem', async () => {
    await settingInMemoryRepository.update({
      LOCALE: 'en-us',
      FILE_UPLOAD_MAX_SIZE: 5242880,
      FILE_UPLOAD_ACCEPTED: 'jpg;png',
      MODEL_CLONE_TABLES: 'table1;table2',
    });

    const result = await sut.execute();

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.LOCALE).toBe('en-us');
      expect(result.value.FILE_UPLOAD_ACCEPTED).toEqual(['jpg', 'png']);
      expect(result.value.MODEL_CLONE_TABLES).toEqual(['table1', 'table2']);
    }
  });

  it('deve retornar process.env quando não há configurações no banco', async () => {
    const result = await sut.execute();

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.MODEL_CLONE_TABLES).toEqual([]);
    }
  });

  it('deve retornar erro SETTINGS_READ_ERROR quando houver falha', async () => {
    vi.spyOn(settingInMemoryRepository, 'get').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute();

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('SETTINGS_READ_ERROR');
    }
  });
});
