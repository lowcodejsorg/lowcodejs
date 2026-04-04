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

describe('Table Field Create - USER', () => {
  beforeEach(async () => {
    tableRepository = new TableInMemoryRepository();
    fieldRepository = new FieldInMemoryRepository();
    sut = new TableFieldCreateUseCase(tableRepository, fieldRepository);

    await tableRepository.create({
      name: 'Tarefas',
      slug: 'tarefas',
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

  it('deve criar campo USER', async () => {
    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'tarefas',
      name: 'Responsavel',
      type: E_FIELD_TYPE.USER,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.type).toBe(E_FIELD_TYPE.USER);
  });

  it('deve criar campo USER multiple=true', async () => {
    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'tarefas',
      name: 'Participantes',
      type: E_FIELD_TYPE.USER,
      multiple: true,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.multiple).toBe(true);
  });

  it('deve criar campo USER required=true', async () => {
    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'tarefas',
      name: 'Dono',
      type: E_FIELD_TYPE.USER,
      required: true,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.required).toBe(true);
  });
});
