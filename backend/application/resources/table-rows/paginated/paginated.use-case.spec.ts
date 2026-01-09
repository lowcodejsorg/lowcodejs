import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
} from '@application/core/entity.core';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';

import TableRowPaginatedUseCase from './paginated.use-case';

vi.mock('@application/core/util.core', () => ({
  buildTable: vi.fn().mockResolvedValue({
    find: vi.fn().mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      sort: vi.fn().mockResolvedValue([
        {
          toJSON: (): Record<string, unknown> => ({
            _id: 'row-1',
            nome: 'Test 1',
          }),
          _id: { toString: (): string => 'row-1' },
        },
        {
          toJSON: (): Record<string, unknown> => ({
            _id: 'row-2',
            nome: 'Test 2',
          }),
          _id: { toString: (): string => 'row-2' },
        },
      ]),
    }),
    countDocuments: vi.fn().mockResolvedValue(2),
  }),
  buildPopulate: vi.fn().mockResolvedValue([]),
  buildQuery: vi.fn().mockResolvedValue({}),
  buildOrder: vi.fn().mockReturnValue({}),
  buildSchema: vi.fn().mockReturnValue({}),
}));

let tableInMemoryRepository: TableInMemoryRepository;
let sut: TableRowPaginatedUseCase;

describe('Table Row Paginated Use Case', () => {
  beforeEach(() => {
    tableInMemoryRepository = new TableInMemoryRepository();
    sut = new TableRowPaginatedUseCase(tableInMemoryRepository);
  });

  it('deve retornar lista de rows paginada', async () => {
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
      page: 1,
      perPage: 20,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.data).toHaveLength(2);
      expect(result.value.meta.total).toBe(2);
    }
  });

  it('deve retornar erro TABLE_NOT_FOUND quando tabela nao existir', async () => {
    const result = await sut.execute({
      slug: 'non-existent',
      page: 1,
      perPage: 20,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('TABLE_NOT_FOUND');
    }
  });

  it('deve retornar erro LIST_ROW_TABLE_PAGINATED_ERROR quando houver falha', async () => {
    vi.spyOn(tableInMemoryRepository, 'findBy').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({
      slug: 'some-slug',
      page: 1,
      perPage: 20,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('LIST_ROW_TABLE_PAGINATED_ERROR');
    }
  });
});
