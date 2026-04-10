import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
} from '@application/core/entity.core';
import RowInMemoryRepository from '@application/repositories/row/row-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';

import BulkRestoreUseCase from './bulk-restore.use-case';

let tableInMemoryRepository: TableInMemoryRepository;
let rowInMemoryRepository: RowInMemoryRepository;
let sut: BulkRestoreUseCase;

const TABLE_PAYLOAD = {
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
};

describe('Bulk Restore Use Case', () => {
  beforeEach(() => {
    tableInMemoryRepository = new TableInMemoryRepository();
    rowInMemoryRepository = new RowInMemoryRepository();
    sut = new BulkRestoreUseCase(
      tableInMemoryRepository,
      rowInMemoryRepository,
    );
    vi.clearAllMocks();
  });

  it('deve restaurar multiplos registros da lixeira com sucesso', async () => {
    const table = await tableInMemoryRepository.create(TABLE_PAYLOAD);

    const row1 = await rowInMemoryRepository.create({
      table,
      data: { nome: 'Cliente 1' },
    });
    const row2 = await rowInMemoryRepository.create({
      table,
      data: { nome: 'Cliente 2' },
    });

    await rowInMemoryRepository.update({
      table,
      _id: row1._id,
      data: { trashed: true, trashedAt: new Date() },
    });
    await rowInMemoryRepository.update({
      table,
      _id: row2._id,
      data: { trashed: true, trashedAt: new Date() },
    });

    const bulkRestoreSpy = vi.spyOn(rowInMemoryRepository, 'bulkRestore');

    const result = await sut.execute({
      slug: 'clientes',
      ids: [row1._id, row2._id],
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');

    expect(result.value.modified).toBe(2);
    expect(bulkRestoreSpy).toHaveBeenCalledTimes(1);
    expect(bulkRestoreSpy).toHaveBeenCalledWith({
      table,
      ids: [row1._id, row2._id],
    });
  });

  it('deve retornar TABLE_NOT_FOUND quando tabela nao existe', async () => {
    const findBySlugSpy = vi.spyOn(tableInMemoryRepository, 'findBySlug');

    const result = await sut.execute({
      slug: 'non-existent',
      ids: ['id-1', 'id-2'],
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');

    expect(result.value.code).toBe(404);
    expect(result.value.cause).toBe('TABLE_NOT_FOUND');
    expect(findBySlugSpy).toHaveBeenCalledTimes(1);
  });

  it('deve retornar modified: 0 quando nenhum registro na lixeira', async () => {
    const table = await tableInMemoryRepository.create(TABLE_PAYLOAD);

    const row1 = await rowInMemoryRepository.create({
      table,
      data: { nome: 'Cliente 1' },
    });

    const result = await sut.execute({
      slug: 'clientes',
      ids: [row1._id],
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');

    expect(result.value.modified).toBe(0);
  });

  it('deve retornar BULK_RESTORE_ROW_ERROR quando repository falha', async () => {
    tableInMemoryRepository.simulateError(
      'findBySlug',
      new Error('Database error'),
    );

    const result = await sut.execute({
      slug: 'clientes',
      ids: ['id-1'],
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');

    expect(result.value.code).toBe(500);
    expect(result.value.cause).toBe('BULK_RESTORE_ROWS_ERROR');
  });
});
