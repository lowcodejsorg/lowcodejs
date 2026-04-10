import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  E_FIELD_FORMAT,
  E_FIELD_TYPE,
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
} from '@application/core/entity.core';
import FieldInMemoryRepository from '@application/repositories/field/field-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';

import EmptyTrashUseCase from './empty-trash.use-case';

let tableInMemoryRepository: TableInMemoryRepository;
let fieldInMemoryRepository: FieldInMemoryRepository;
let sut: EmptyTrashUseCase;

describe('Empty Trash Tables Use Case', () => {
  beforeEach(() => {
    tableInMemoryRepository = new TableInMemoryRepository();
    fieldInMemoryRepository = new FieldInMemoryRepository();
    sut = new EmptyTrashUseCase(
      tableInMemoryRepository,
      fieldInMemoryRepository,
    );
  });

  it('deve esvaziar a lixeira com sucesso deletando tabelas e campos', async () => {
    const field = await fieldInMemoryRepository.create({
      name: 'Nome',
      slug: 'nome',
      type: E_FIELD_TYPE.TEXT_SHORT,
      showInList: true,
      showInForm: true,
      showInDetail: true,
      showInFilter: true,
      required: true,
      dropdown: [],
      category: [],
      defaultValue: null,
      format: E_FIELD_FORMAT.ALPHA_NUMERIC,
      group: null,
      multiple: false,
      relationship: null,
      widthInForm: null,
      widthInList: null,
      widthInDetail: null,
    });

    const table = await tableInMemoryRepository.create({
      name: 'Clientes',
      slug: 'clientes',
      _schema: {},
      fields: [field._id],
      owner: 'owner-id',
      administrators: [],
      style: E_TABLE_STYLE.LIST,
      visibility: E_TABLE_VISIBILITY.RESTRICTED,
      collaboration: E_TABLE_COLLABORATION.RESTRICTED,
      fieldOrderList: [],
      fieldOrderForm: [],
    });

    await tableInMemoryRepository.update({
      _id: table._id,
      trashed: true,
      trashedAt: new Date(),
    });

    const deleteManyFieldsSpy = vi.spyOn(fieldInMemoryRepository, 'deleteMany');
    const dropCollectionSpy = vi.spyOn(
      tableInMemoryRepository,
      'dropCollection',
    );
    const deleteTableSpy = vi.spyOn(tableInMemoryRepository, 'delete');

    const result = await sut.execute();

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.deleted).toBe(1);
    expect(deleteManyFieldsSpy).toHaveBeenCalledTimes(1);
    expect(deleteManyFieldsSpy).toHaveBeenCalledWith([field._id]);
    expect(dropCollectionSpy).toHaveBeenCalledTimes(1);
    expect(dropCollectionSpy).toHaveBeenCalledWith('clientes');
    expect(deleteTableSpy).toHaveBeenCalledTimes(1);
    expect(deleteTableSpy).toHaveBeenCalledWith(table._id);
  });

  it('deve retornar 0 deletados quando lixeira esta vazia', async () => {
    const result = await sut.execute();

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.deleted).toBe(0);
  });

  it('deve ignorar tabelas nao-trashed', async () => {
    await tableInMemoryRepository.create({
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

    const result = await sut.execute();

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.deleted).toBe(0);
  });

  it('deve retornar erro EMPTY_TRASH_TABLES_ERROR quando houver falha', async () => {
    tableInMemoryRepository.simulateError(
      'findMany',
      new Error('Database error'),
    );

    const result = await sut.execute();

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(500);
    expect(result.value.cause).toBe('EMPTY_TRASH_TABLES_ERROR');
  });
});
