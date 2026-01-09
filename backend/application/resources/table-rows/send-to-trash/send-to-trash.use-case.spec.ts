import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
} from '@application/core/entity.core';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';

import TableRowSendToTrashUseCase from './send-to-trash.use-case';

const { mockRow } = vi.hoisted(() => ({
  mockRow: {
    _id: { toString: (): string => 'row-id' },
    trashed: false,
    toJSON: (): Record<string, unknown> => ({
      _id: 'row-id',
      nome: 'Test',
      trashed: true,
    }),
    populate: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    save: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@application/core/util.core', () => ({
  buildTable: vi.fn().mockResolvedValue({
    findOne: vi.fn().mockResolvedValue(mockRow),
  }),
  buildPopulate: vi.fn().mockResolvedValue([]),
  buildSchema: vi.fn().mockReturnValue({}),
}));

let tableInMemoryRepository: TableInMemoryRepository;
let sut: TableRowSendToTrashUseCase;

describe('Table Row Send To Trash Use Case', () => {
  beforeEach(() => {
    tableInMemoryRepository = new TableInMemoryRepository();
    sut = new TableRowSendToTrashUseCase(tableInMemoryRepository);
    vi.clearAllMocks();
    mockRow.trashed = false;
  });

  it('deve enviar row para lixeira com sucesso', async () => {
    await tableInMemoryRepository.create({
      name: 'Clientes',
      slug: 'clientes',
      _schema: {},
      fields: [],
      configuration: {
        owner: 'owner-id',
        administrators: [],
        style: E_TABLE_STYLE.LIST,
        visibility: E_TABLE_VISIBILITY.RESTRICTED,
        collaboration: E_TABLE_COLLABORATION.RESTRICTED,
        fields: { orderList: [], orderForm: [] },
      },
    });

    const result = await sut.execute({
      slug: 'clientes',
      _id: 'row-id',
    });

    expect(result.isRight()).toBe(true);
  });

  it('deve retornar erro TABLE_NOT_FOUND quando tabela nao existir', async () => {
    const result = await sut.execute({
      slug: 'non-existent',
      _id: 'row-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('TABLE_NOT_FOUND');
    }
  });

  it('deve retornar erro SEND_ROW_TABLE_TO_TRASH_ERROR quando houver falha', async () => {
    vi.spyOn(tableInMemoryRepository, 'findBy').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({
      slug: 'some-slug',
      _id: 'row-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('SEND_ROW_TABLE_TO_TRASH_ERROR');
    }
  });
});
