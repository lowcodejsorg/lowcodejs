import { beforeEach, describe, expect, it } from 'vitest';

import {
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
} from '@application/core/entity.core';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';

import BulkRestoreUseCase from './bulk-restore.use-case';

let tableInMemoryRepository: TableInMemoryRepository;
let sut: BulkRestoreUseCase;

describe('Bulk Restore Tables Use Case', () => {
  beforeEach(() => {
    tableInMemoryRepository = new TableInMemoryRepository();
    sut = new BulkRestoreUseCase(tableInMemoryRepository);
  });

  it('deve restaurar multiplas tabelas da lixeira com sucesso', async () => {
    const table1 = await tableInMemoryRepository.create({
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

    const table2 = await tableInMemoryRepository.create({
      name: 'Produtos',
      slug: 'produtos',
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

    await tableInMemoryRepository.update({
      _id: table1._id,
      trashed: true,
      trashedAt: new Date(),
    });

    await tableInMemoryRepository.update({
      _id: table2._id,
      trashed: true,
      trashedAt: new Date(),
    });

    const result = await sut.execute({ ids: [table1._id, table2._id] });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.modified).toBe(2);

    const restored1 = await tableInMemoryRepository.findById(table1._id);
    const restored2 = await tableInMemoryRepository.findById(table2._id);
    expect(restored1?.trashed).toBe(false);
    expect(restored1?.trashedAt).toBeNull();
    expect(restored2?.trashed).toBe(false);
    expect(restored2?.trashedAt).toBeNull();
  });

  it('deve retornar 0 modificados quando IDs nao existem', async () => {
    const result = await sut.execute({
      ids: ['non-existent-1', 'non-existent-2'],
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.modified).toBe(0);
  });

  it('deve ignorar tabelas que nao estao na lixeira', async () => {
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

    const result = await sut.execute({ ids: [table._id] });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.modified).toBe(0);
  });

  it('deve retornar erro BULK_RESTORE_TABLES_ERROR quando houver falha', async () => {
    tableInMemoryRepository.simulateError(
      'updateMany',
      new Error('Database error'),
    );

    const result = await sut.execute({ ids: ['some-id'] });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(500);
    expect(result.value.cause).toBe('BULK_RESTORE_TABLES_ERROR');
  });
});
