import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
} from '@application/core/entity.core';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';

import TableRowDeleteUseCase from './delete.use-case';

vi.mock('@application/core/util.core', () => ({
  buildTable: vi.fn().mockResolvedValue({
    findOneAndDelete: vi.fn().mockResolvedValue({ _id: 'row-id' }),
  }),
  buildSchema: vi.fn().mockReturnValue({}),
}));

let tableInMemoryRepository: TableInMemoryRepository;
let sut: TableRowDeleteUseCase;

describe('Table Row Delete Use Case', () => {
  beforeEach(() => {
    tableInMemoryRepository = new TableInMemoryRepository();
    sut = new TableRowDeleteUseCase(tableInMemoryRepository);
    vi.clearAllMocks();
  });

  it('deve deletar row com sucesso', async () => {
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
    if (result.isRight()) {
      expect(result.value).toBeNull();
    }
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

  it('deve retornar erro DELETE_ROW_ERROR quando houver falha', async () => {
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
      expect(result.value.cause).toBe('DELETE_ROW_ERROR');
    }
  });
});
