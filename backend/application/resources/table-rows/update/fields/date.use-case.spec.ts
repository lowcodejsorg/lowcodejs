import { beforeEach, describe, expect, it } from 'vitest';

import RowInMemoryRepository from '@application/repositories/row/row-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';
import { makeDateField } from '@test/helpers/field-factory.helper';
import { makeTable } from '@test/helpers/table-factory.helper';

import TableRowUpdateUseCase from '../update.use-case';

let tableRepository: TableInMemoryRepository;
let rowRepository: RowInMemoryRepository;
let sut: TableRowUpdateUseCase;

describe('Table Row Update - DATE', () => {
  beforeEach(() => {
    tableRepository = new TableInMemoryRepository();
    rowRepository = new RowInMemoryRepository();
    sut = new TableRowUpdateUseCase(tableRepository, rowRepository);
  });

  it('deve atualizar row com data ISO valida', async () => {
    const field = makeDateField({ slug: 'data' });
    const table = await makeTable(tableRepository, [field], {
      slug: 'eventos',
    });

    const row = await rowRepository.create({
      table,
      data: { data: '2024-01-15T10:00:00.000Z' },
    });

    const result = await sut.execute({
      slug: 'eventos',
      _id: row._id,
      data: '2024-06-20T14:30:00.000Z',
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.data).toBe('2024-06-20T14:30:00.000Z');
  });

  it('deve rejeitar data invalida', async () => {
    const field = makeDateField({ slug: 'data' });
    const table = await makeTable(tableRepository, [field], {
      slug: 'eventos',
    });

    const row = await rowRepository.create({
      table,
      data: { data: '2024-01-15T10:00:00.000Z' },
    });

    const result = await sut.execute({
      slug: 'eventos',
      _id: row._id,
      data: 'data-invalida',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.cause).toBe('INVALID_PAYLOAD_FORMAT');
  });

  it('deve pular validacao de campo omitido (skipMissing)', async () => {
    const field = makeDateField({ slug: 'data', required: true });
    const table = await makeTable(tableRepository, [field], {
      slug: 'eventos',
    });

    const row = await rowRepository.create({
      table,
      data: { data: '2024-01-15T10:00:00.000Z' },
    });

    const result = await sut.execute({
      slug: 'eventos',
      _id: row._id,
    });

    expect(result.isRight()).toBe(true);
  });
});
