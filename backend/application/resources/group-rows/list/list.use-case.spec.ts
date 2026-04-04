import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  E_FIELD_FORMAT,
  E_FIELD_TYPE,
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
} from '@application/core/entity.core';
import type { ITable } from '@application/core/entity.core';
import RowInMemoryRepository from '@application/repositories/row/row-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';

import GroupRowListUseCase from './list.use-case';

vi.mock('@application/core/row-password-helper.core', () => ({
  hashPasswordFields: vi.fn().mockResolvedValue(undefined),
  maskPasswordFields: vi.fn(),
  stripMaskedPasswordFields: vi.fn(),
}));

let tableRepository: TableInMemoryRepository;
let rowRepository: RowInMemoryRepository;
let sut: GroupRowListUseCase;

const TABLE_DEFAULTS = {
  _schema: {},
  owner: 'owner-id',
  administrators: [],
  style: E_TABLE_STYLE.LIST,
  visibility: E_TABLE_VISIBILITY.RESTRICTED,
  collaboration: E_TABLE_COLLABORATION.RESTRICTED,
  fieldOrderList: [],
  fieldOrderForm: [],
};

const GROUP_FIELD = {
  _id: 'field-group-1',
  name: 'Items',
  slug: 'items',
  type: E_FIELD_TYPE.FIELD_GROUP,
  required: false,
  multiple: false,
  format: E_FIELD_FORMAT.ALPHA_NUMERIC,
  showInFilter: false,
  showInForm: true,
  showInDetail: true,
  showInList: false,
  widthInForm: 100,
  widthInList: null,
  widthInDetail: null,
  defaultValue: null,
  locked: false,
  native: false,
  relationship: null,
  dropdown: [],
  category: [],
  group: { slug: 'items' },
  createdAt: new Date(),
  updatedAt: new Date(),
  trashed: false,
  trashedAt: null,
};

const GROUP_CONFIG = {
  slug: 'items',
  name: 'Items',
  fields: [
    {
      _id: 'gf-1',
      name: 'Descricao',
      slug: 'descricao',
      type: E_FIELD_TYPE.TEXT_SHORT,
      required: false,
      multiple: false,
      format: E_FIELD_FORMAT.ALPHA_NUMERIC,
      showInFilter: false,
      showInForm: true,
      showInDetail: true,
      showInList: true,
      widthInForm: 50,
      widthInList: 10,
      widthInDetail: null,
      defaultValue: null,
      locked: false,
      native: false,
      relationship: null,
      dropdown: [],
      category: [],
      group: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      trashed: false,
      trashedAt: null,
    },
  ],
  _schema: {},
};

async function createTableWithGroup(): Promise<ITable> {
  return tableRepository.create({
    ...TABLE_DEFAULTS,
    name: 'Pedidos',
    slug: 'pedidos',
    fields: [GROUP_FIELD],
    groups: [GROUP_CONFIG],
  });
}

async function createRowWithItems(
  table: ITable,
  items: Record<string, unknown>[] = [
    { _id: 'item-1', descricao: 'Item A' },
    { _id: 'item-2', descricao: 'Item B' },
  ],
): Promise<string> {
  const row = await rowRepository.create({
    table,
    data: { items },
  });
  return row._id;
}

describe('Group Row List Use Case', () => {
  beforeEach(() => {
    tableRepository = new TableInMemoryRepository();
    rowRepository = new RowInMemoryRepository();
    sut = new GroupRowListUseCase(tableRepository, rowRepository);
  });

  it('deve listar itens do grupo', async () => {
    const table = await createTableWithGroup();
    const rowId = await createRowWithItems(table);

    const findOneSpy = vi.spyOn(rowRepository, 'findOne');

    const result = await sut.execute({
      slug: 'pedidos',
      rowId,
      groupSlug: 'items',
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');

    const items = result.value;
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveProperty('descricao', 'Item A');
    expect(items[1]).toHaveProperty('descricao', 'Item B');

    expect(findOneSpy).toHaveBeenCalledTimes(1);
    expect(findOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        query: { _id: rowId },
      }),
    );
  });

  it('deve retornar array vazio quando grupo nao tem itens', async () => {
    const table = await createTableWithGroup();
    const rowId = await createRowWithItems(table, []);

    const result = await sut.execute({
      slug: 'pedidos',
      rowId,
      groupSlug: 'items',
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value).toHaveLength(0);
  });

  it('deve retornar TABLE_NOT_FOUND quando tabela nao existe', async () => {
    const findBySlugSpy = vi.spyOn(tableRepository, 'findBySlug');

    const result = await sut.execute({
      slug: 'inexistente',
      rowId: 'row-1',
      groupSlug: 'items',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(404);
    expect(result.value.cause).toBe('TABLE_NOT_FOUND');
    expect(result.value.message).toBe('Tabela não encontrada');

    expect(findBySlugSpy).toHaveBeenCalledTimes(1);
    expect(findBySlugSpy).toHaveBeenCalledWith('inexistente');
  });

  it('deve retornar GROUP_NOT_FOUND quando grupo nao existe', async () => {
    await tableRepository.create({
      ...TABLE_DEFAULTS,
      name: 'Pedidos',
      slug: 'pedidos',
      fields: [],
      groups: [],
    });

    const result = await sut.execute({
      slug: 'pedidos',
      rowId: 'row-1',
      groupSlug: 'inexistente',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(404);
    expect(result.value.cause).toBe('GROUP_NOT_FOUND');
    expect(result.value.message).toBe('Grupo não encontrado');
  });

  it('deve retornar ROW_NOT_FOUND quando row nao existe', async () => {
    await createTableWithGroup();

    const findOneSpy = vi.spyOn(rowRepository, 'findOne');

    const result = await sut.execute({
      slug: 'pedidos',
      rowId: 'row-inexistente',
      groupSlug: 'items',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(404);
    expect(result.value.cause).toBe('ROW_NOT_FOUND');
    expect(result.value.message).toBe('Registro não encontrado');

    expect(findOneSpy).toHaveBeenCalledTimes(1);
  });
});
