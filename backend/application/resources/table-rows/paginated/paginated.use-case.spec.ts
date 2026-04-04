import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
} from '@application/core/entity.core';
import RowInMemoryRepository from '@application/repositories/row/row-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';

import TableRowPaginatedUseCase from './paginated.use-case';

vi.mock('@application/core/builders', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('@application/core/builders')>();
  return {
    ...original,
    buildQuery: vi.fn().mockResolvedValue({}),
    buildOrder: vi.fn().mockReturnValue({}),
    transformRowContext: vi.fn().mockImplementation((row) => row),
  };
});

let tableInMemoryRepository: TableInMemoryRepository;
let rowRepository: RowInMemoryRepository;
let sut: TableRowPaginatedUseCase;

describe('Table Row Paginated Use Case', () => {
  beforeEach(() => {
    tableInMemoryRepository = new TableInMemoryRepository();
    rowRepository = new RowInMemoryRepository();
    sut = new TableRowPaginatedUseCase(tableInMemoryRepository, rowRepository);
  });

  it('deve retornar lista de rows paginada', async () => {
    const table = await tableInMemoryRepository.create({
      name: 'Clientes',
      slug: 'clientes',
      _schema: {},
      fields: [],
      owner: 'owner-id',
      administrators: [],
      style: E_TABLE_STYLE.LIST,
      visibility: E_TABLE_VISIBILITY.RESTRICTED,
      collaboration: E_TABLE_COLLABORATION.RESTRICTED,
      fieldOrderList: [],
      fieldOrderForm: [],
    });

    await rowRepository.create({ table, data: { nome: 'Test 1' } });
    await rowRepository.create({ table, data: { nome: 'Test 2' } });

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
    vi.spyOn(tableInMemoryRepository, 'findBySlug').mockRejectedValueOnce(
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
