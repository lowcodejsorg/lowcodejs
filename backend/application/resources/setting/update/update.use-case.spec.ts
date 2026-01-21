import { beforeEach, describe, expect, it, vi } from 'vitest';

import SettingInMemoryRepository from '@application/repositories/setting/setting-in-memory.repository';

import SettingUpdateUseCase from './update.use-case';

let settingInMemoryRepository: SettingInMemoryRepository;
let sut: SettingUpdateUseCase;

describe('Setting Update Use Case', () => {
  beforeEach(() => {
    settingInMemoryRepository = new SettingInMemoryRepository();
    sut = new SettingUpdateUseCase(settingInMemoryRepository);
  });

  it('deve atualizar configurações com sucesso', async () => {
    const result = await sut.execute({
      LOCALE: 'en-us',
      FILE_UPLOAD_MAX_SIZE: 5242880,
      FILE_UPLOAD_ACCEPTED: 'jpg;png;pdf',
      MODEL_CLONE_TABLES: 'table1;table2',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.LOCALE).toBe('en-us');
      expect(result.value.FILE_UPLOAD_MAX_SIZE).toBe(5242880);
      expect(result.value.FILE_UPLOAD_ACCEPTED).toEqual(['jpg', 'png', 'pdf']);
      expect(result.value.MODEL_CLONE_TABLES).toEqual(['table1', 'table2']);
    }
  });

  it('deve atualizar process.env com os novos valores', async () => {
    await sut.execute({
      LOCALE: 'en-us',
    });

    expect(process.env.LOCALE).toBe('en-us');
  });

  it('deve retornar erro SETTINGS_UPDATE_ERROR quando houver falha', async () => {
    vi.spyOn(settingInMemoryRepository, 'update').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({
      LOCALE: 'pt-br',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('SETTINGS_UPDATE_ERROR');
    }
  });
});
