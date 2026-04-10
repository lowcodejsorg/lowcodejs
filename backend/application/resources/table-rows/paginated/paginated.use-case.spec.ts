import { beforeEach, describe, expect, it } from 'vitest';

import {
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
} from '@application/core/entity.core';
import RowInMemoryRepository from '@application/repositories/row/row-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';
import InMemoryRowContextService from '@application/services/row-context/in-memory-row-context.service';
import InMemoryRowPasswordService from '@application/services/row-password/in-memory-row-password.service';

import TableRowPaginatedUseCase from './paginated.use-case';

let tableInMemoryRepository: TableInMemoryRepository;
let rowRepository: RowInMemoryRepository;
let rowPasswordService: InMemoryRowPasswordService;
let rowContextService: InMemoryRowContextService;
let sut: TableRowPaginatedUseCase;

describe('Table Row Paginated Use Case', () => {
  beforeEach(() => {
    tableInMemoryRepository = new TableInMemoryRepository();
    rowRepository = new RowInMemoryRepository();
    rowPasswordService = new InMemoryRowPasswordService();

    rowContextService = new InMemoryRowContextService();

    sut = new TableRowPaginatedUseCase(
      tableInMemoryRepository,
      rowRepository,
      rowPasswordService,
      rowContextService,
    );
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
    tableInMemoryRepository.simulateError(
      'findBySlug',
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
