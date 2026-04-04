import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
} from '@application/core/entity.core';
import RowInMemoryRepository from '@application/repositories/row/row-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';

import EmptyTrashUseCase from './empty-trash.use-case';

let tableInMemoryRepository: TableInMemoryRepository;
let rowInMemoryRepository: RowInMemoryRepository;
let sut: EmptyTrashUseCase;

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

describe('Empty Trash Use Case', () => {
  beforeEach(() => {
    tableInMemoryRepository = new TableInMemoryRepository();
    rowInMemoryRepository = new RowInMemoryRepository();
    sut = new EmptyTrashUseCase(tableInMemoryRepository, rowInMemoryRepository);
    vi.clearAllMocks();
  });

  it('deve esvaziar lixeira da tabela com sucesso', async () => {
    const table = await tableInMemoryRepository.create(TABLE_PAYLOAD);

    const row1 = await rowInMemoryRepository.create({
      table,
      data: { nome: 'Cliente 1' },
    });
    const row2 = await rowInMemoryRepository.create({
      table,
      data: { nome: 'Cliente 2' },
    });
    await rowInMemoryRepository.create({
      table,
      data: { nome: 'Cliente 3' },
    });

    await rowInMemoryRepository.update({ table, _id: row1._id, data: { trashed: true, trashedAt: new Date() } });
    await rowInMemoryRepository.update({ table, _id: row2._id, data: { trashed: true, trashedAt: new Date() } });

    const emptyTrashSpy = vi.spyOn(rowInMemoryRepository, 'emptyTrash');

    const result = await sut.execute({ slug: 'clientes' });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');

    expect(result.value.deleted).toBe(2);
    expect(emptyTrashSpy).toHaveBeenCalledTimes(1);
    expect(emptyTrashSpy).toHaveBeenCalledWith(table);
  });

  it('deve retornar TABLE_NOT_FOUND quando tabela nao existe', async () => {
    const findBySlugSpy = vi.spyOn(tableInMemoryRepository, 'findBySlug');

    const result = await sut.execute({ slug: 'non-existent' });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');

    expect(result.value.code).toBe(404);
    expect(result.value.cause).toBe('TABLE_NOT_FOUND');
    expect(findBySlugSpy).toHaveBeenCalledTimes(1);
  });

  it('deve retornar deleted: 0 quando lixeira vazia', async () => {
    const table = await tableInMemoryRepository.create(TABLE_PAYLOAD);

    await rowInMemoryRepository.create({
      table,
      data: { nome: 'Cliente 1' },
    });

    const result = await sut.execute({ slug: 'clientes' });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');

    expect(result.value.deleted).toBe(0);
  });

  it('deve retornar EMPTY_TRASH_ROW_ERROR quando repository falha', async () => {
    vi.spyOn(tableInMemoryRepository, 'findBySlug').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({ slug: 'clientes' });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');

    expect(result.value.code).toBe(500);
    expect(result.value.cause).toBe('EMPTY_TRASH_ROWS_ERROR');
  });
});
