import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  E_FIELD_TYPE,
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
} from '@application/core/entity.core';
import FieldInMemoryRepository from '@application/repositories/field/field-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';

import TableFieldCreateUseCase from '../create.use-case';

vi.mock('@application/core/util.core', () => ({
  buildTable: vi.fn().mockResolvedValue({}),
  buildSchema: vi.fn().mockReturnValue({}),
}));

let tableRepository: TableInMemoryRepository;
let fieldRepository: FieldInMemoryRepository;
let sut: TableFieldCreateUseCase;

const BASE_PAYLOAD = {
  showInList: true,
  showInForm: true,
  showInDetail: true,
  showInFilter: false,
  locked: false,
  required: false,
  category: [],
  dropdown: [],
  defaultValue: null,
  group: null,
  multiple: false,
  relationship: null,
  widthInForm: 50,
  widthInList: 10,
  widthInDetail: null,
  format: null,
};

describe('Table Field Create - REACTION', () => {
  beforeEach(async () => {
    tableRepository = new TableInMemoryRepository();
    fieldRepository = new FieldInMemoryRepository();
    sut = new TableFieldCreateUseCase(tableRepository, fieldRepository);

    await tableRepository.create({
      name: 'Posts',
      slug: 'posts',
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
  });

  it('deve criar campo REACTION', async () => {
    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'posts',
      name: 'Curtidas',
      type: E_FIELD_TYPE.REACTION,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.type).toBe(E_FIELD_TYPE.REACTION);
    expect(result.value.format).toBeNull();
  });
});
