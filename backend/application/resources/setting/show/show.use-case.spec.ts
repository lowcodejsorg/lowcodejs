import { beforeEach, describe, expect, it, vi } from 'vitest';

import SettingInMemoryRepository from '@application/repositories/setting/setting-in-memory.repository';

import SettingShowUseCase from './show.use-case';

let settingInMemoryRepository: SettingInMemoryRepository;
let sut: SettingShowUseCase;

describe('Setting Show Use Case', () => {
  const kanbanTemplate = {
    _id: 'KANBAN_TEMPLATE',
    name: 'Kanban',
    slug: 'kanban-tarefas',
    description: 'Modelo predefinido de tarefas em Kanban',
  };

  const cardsTemplate = {
    _id: 'CARDS_TEMPLATE',
    name: 'Cards',
    slug: 'cards',
    description: 'Modelo predefinido para Cards',
  };

  const mosaicTemplate = {
    _id: 'MOSAIC_TEMPLATE',
    name: 'Mosaico',
    slug: 'mosaico',
    description: 'Modelo predefinido para Mosaico',
  };

  const documentTemplate = {
    _id: 'DOCUMENT_TEMPLATE',
    name: 'Documento',
    slug: 'documento',
    description: 'Modelo predefinido para documento por índice',
  };

  const forumTemplate = {
    _id: 'FORUM_TEMPLATE',
    name: 'Forum',
    slug: 'chat-forum',
    description: 'Modelo predefinido para canais e mensagens em forum',
  };

  const calendarTemplate = {
    _id: 'CALENDAR_TEMPLATE',
    name: 'Calendario',
    slug: 'calendario',
    description: 'Modelo predefinido para agenda/calendário',
  };

  beforeEach(() => {
    settingInMemoryRepository = new SettingInMemoryRepository();
    sut = new SettingShowUseCase(settingInMemoryRepository);
  });

  it('deve retornar configurações do banco quando existem', async () => {
    const getSpy = vi.spyOn(settingInMemoryRepository, 'get');

    await settingInMemoryRepository.update({
      LOCALE: 'en-us',
      FILE_UPLOAD_MAX_SIZE: 5242880,
      FILE_UPLOAD_ACCEPTED: 'jpg;png',
      MODEL_CLONE_TABLES: ['table1', 'table2'],
    });

    const result = await sut.execute();

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');

    expect(result.value.LOCALE).toBe('en-us');
    expect(result.value.FILE_UPLOAD_ACCEPTED).toEqual(['jpg', 'png']);
    expect(result.value.MODEL_CLONE_TABLES).toEqual([
      kanbanTemplate,
      cardsTemplate,
      mosaicTemplate,
      documentTemplate,
      forumTemplate,
      calendarTemplate,
      'table1',
      'table2',
    ]);
    expect(getSpy).toHaveBeenCalledOnce();
  });

  it('deve retornar process.env quando não há configurações no banco', async () => {
    const getSpy = vi.spyOn(settingInMemoryRepository, 'get');

    const result = await sut.execute();

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');

    expect(result.value.MODEL_CLONE_TABLES).toEqual([
      kanbanTemplate,
      cardsTemplate,
      mosaicTemplate,
      documentTemplate,
      forumTemplate,
      calendarTemplate,
    ]);
    expect(getSpy).toHaveBeenCalledOnce();
  });

  it('deve retornar erro SETTINGS_READ_ERROR quando houver falha', async () => {
    settingInMemoryRepository.simulateError('get', new Error('Database error'));

    const result = await sut.execute();

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');

    expect(result.value.code).toBe(500);
    expect(result.value.cause).toBe('SETTINGS_READ_ERROR');
    expect(result.value.message).toBe('Erro ao buscar configurações');
  });
});
