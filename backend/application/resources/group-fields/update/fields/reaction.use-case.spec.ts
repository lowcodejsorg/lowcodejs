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
  name: 'Curtida',
  slug: 'curtida',
  type: E_FIELD_TYPE.REACTION,
  showInList: true,
  showInForm: true,
  showInDetail: true,
  showInFilter: false,
  locked: false,
  native: false,
  required: false,
  category: [],
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
  category: [],
  dropdown: [],
  defaultValue: null,
  group: null,
  multiple: false,
  relationship: null,
  format: null,
};

describe('Group Field Update - REACTION', () => {
  beforeEach(async () => {
    tableInMemoryRepository = new TableInMemoryRepository();
    fieldInMemoryRepository = new FieldInMemoryRepository();
    sut = new GroupFieldUpdateUseCase(
      tableInMemoryRepository,
      fieldInMemoryRepository,
    );
  });

  it('deve mudar visibilidade showInList de true para false', async () => {
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
      name: 'Curtida',
      type: E_FIELD_TYPE.REACTION,
      required: false,
      showInList: false,
      showInForm: false,
      showInDetail: true,
      showInFilter: false,
      widthInForm: 50,
      widthInList: 10,
      widthInDetail: null,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.showInList).toBe(false);
    expect(result.value.showInForm).toBe(false);
    expect(result.value.type).toBe(E_FIELD_TYPE.REACTION);
  });
});
