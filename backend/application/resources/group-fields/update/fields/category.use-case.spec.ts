import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  E_FIELD_TYPE,
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
} from '@application/core/entity.core';
import FieldInMemoryRepository from '@application/repositories/field/field-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';

import GroupFieldUpdateUseCase from '../update.use-case';

vi.mock('@application/core/util.core', () => ({
  buildTable: vi.fn().mockResolvedValue(undefined),
  buildSchema: vi.fn().mockReturnValue({}),
}));

let tableInMemoryRepository: TableInMemoryRepository;
let fieldInMemoryRepository: FieldInMemoryRepository;
let sut: GroupFieldUpdateUseCase;

const TABLE_DEFAULTS = {
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

const FIELD_CREATE_PAYLOAD = {
  name: 'Categoria Item',
  slug: 'categoria-item',
  type: E_FIELD_TYPE.CATEGORY,
  showInList: true,
  showInForm: true,
  showInDetail: true,
  showInFilter: false,
  locked: false,
  native: false,
  required: false,
  category: [
    {
      id: 'cat-1',
      label: 'Eletronicos',
      children: [{ id: 'cat-1-1', label: 'Celulares', children: [] }],
    },
    {
      id: 'cat-2',
      label: 'Roupas',
      children: [],
    },
  ],
  dropdown: [],
  defaultValue: null,
  format: null,
  group: null,
  multiple: false,
  relationship: null,
  widthInForm: 50,
  widthInList: 10,
  widthInDetail: null,
};

const UPDATE_PAYLOAD_BASE = {
  slug: 'pedidos',
  groupSlug: 'itens',
  trashed: false,
  trashedAt: null,
  locked: false,
  dropdown: [],
  defaultValue: null,
  group: null,
  multiple: false,
  relationship: null,
  format: null,
};

describe('Group Field Update - CATEGORY', () => {
  beforeEach(async () => {
    tableInMemoryRepository = new TableInMemoryRepository();
    fieldInMemoryRepository = new FieldInMemoryRepository();
    sut = new GroupFieldUpdateUseCase(
      tableInMemoryRepository,
      fieldInMemoryRepository,
    );
  });

  it('deve mudar arvore de categorias', async () => {
    const field = await fieldInMemoryRepository.create(FIELD_CREATE_PAYLOAD);

    await tableInMemoryRepository.create({
      ...TABLE_DEFAULTS,
      name: 'Pedidos',
      slug: 'pedidos',
      groups: [
        {
          slug: 'itens',
          name: 'Itens',
          fields: [field],
          _schema: {},
        },
      ],
    });

    const result = await sut.execute({
      ...UPDATE_PAYLOAD_BASE,
      fieldId: field._id,
      name: 'Categoria Item',
      type: E_FIELD_TYPE.CATEGORY,
      required: false,
      showInList: true,
      showInForm: true,
      showInDetail: true,
      showInFilter: false,
      widthInForm: 50,
      widthInList: 10,
      widthInDetail: null,
      category: [
        {
          id: 'cat-1',
          label: 'Alimentos',
          children: [
            { id: 'cat-1-1', label: 'Frutas', children: [] },
            { id: 'cat-1-2', label: 'Verduras', children: [] },
          ],
        },
        {
          id: 'cat-2',
          label: 'Bebidas',
          children: [],
        },
        {
          id: 'cat-3',
          label: 'Limpeza',
          children: [],
        },
      ],
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.category).toHaveLength(3);
    expect(result.value.category[0].label).toBe('Alimentos');
    expect(result.value.category[0].children).toHaveLength(2);
    expect(result.value.category[2].label).toBe('Limpeza');
  });

  it('deve mudar required de false para true', async () => {
    const field = await fieldInMemoryRepository.create(FIELD_CREATE_PAYLOAD);

    await tableInMemoryRepository.create({
      ...TABLE_DEFAULTS,
      name: 'Pedidos',
      slug: 'pedidos',
      groups: [
        {
          slug: 'itens',
          name: 'Itens',
          fields: [field],
          _schema: {},
        },
      ],
    });

    const result = await sut.execute({
      ...UPDATE_PAYLOAD_BASE,
      fieldId: field._id,
      name: 'Categoria Item',
      type: E_FIELD_TYPE.CATEGORY,
      required: true,
      showInList: true,
      showInForm: true,
      showInDetail: true,
      showInFilter: false,
      widthInForm: 50,
      widthInList: 10,
      widthInDetail: null,
      category: [
        {
          id: 'cat-1',
          label: 'Eletronicos',
          children: [{ id: 'cat-1-1', label: 'Celulares', children: [] }],
        },
        {
          id: 'cat-2',
          label: 'Roupas',
          children: [],
        },
      ],
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.required).toBe(true);
    expect(result.value.type).toBe(E_FIELD_TYPE.CATEGORY);
  });
});
