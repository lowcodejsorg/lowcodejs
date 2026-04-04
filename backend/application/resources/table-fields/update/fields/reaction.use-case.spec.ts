import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  E_FIELD_TYPE,
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
} from '@application/core/entity.core';
import FieldInMemoryRepository from '@application/repositories/field/field-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';

import TableFieldUpdateUseCase from '../update.use-case';

vi.mock('@application/core/util.core', () => ({
  buildTable: vi.fn().mockResolvedValue({
    updateMany: vi.fn().mockResolvedValue(undefined),
  }),
  buildSchema: vi.fn().mockReturnValue({}),
}));

let tableInMemoryRepository: TableInMemoryRepository;
let fieldInMemoryRepository: FieldInMemoryRepository;
let sut: TableFieldUpdateUseCase;

const FIELD_DEFAULTS = {
  slug: 'curtidas',
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

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function createFieldAndTable(
  fieldRepo: FieldInMemoryRepository,
  tableRepo: TableInMemoryRepository,
  fieldOverrides: Record<string, unknown> = {},
) {
  const field = await fieldRepo.create({
    ...FIELD_DEFAULTS,
    name: 'Curtidas',
    ...fieldOverrides,
  });

  const table = await tableRepo.create({
    name: 'Posts',
    slug: 'posts',
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

  table.fields = [field];

  return { field, table };
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function buildUpdatePayload(
  field: Record<string, unknown>,
  overrides: Record<string, unknown> = {},
) {
  return {
    slug: 'posts',
    _id: field._id as string,
    name: field.name as string,
    type: field.type as string,
    format: field.format as string | null,
    required: field.required as boolean,
    multiple: field.multiple as boolean,
    defaultValue: field.defaultValue as string | string[] | null,
    relationship: field.relationship as null,
    dropdown: field.dropdown as [],
    category: field.category as [],
    group: field.group as null,
    trashed: false,
    trashedAt: null,
    locked: false,
    showInList: field.showInList as boolean,
    showInForm: field.showInForm as boolean,
    showInDetail: field.showInDetail as boolean,
    showInFilter: field.showInFilter as boolean,
    widthInForm: field.widthInForm as number | null,
    widthInList: field.widthInList as number | null,
    widthInDetail: field.widthInDetail as number | null,
    ...overrides,
  };
}

describe('Table Field Update - REACTION', () => {
  beforeEach(() => {
    tableInMemoryRepository = new TableInMemoryRepository();
    fieldInMemoryRepository = new FieldInMemoryRepository();
    sut = new TableFieldUpdateUseCase(
      tableInMemoryRepository,
      fieldInMemoryRepository,
    );
  });

  it('deve mudar visibilidade showInList e showInForm', async () => {
    const { field } = await createFieldAndTable(
      fieldInMemoryRepository,
      tableInMemoryRepository,
    );

    const result = await sut.execute(
      buildUpdatePayload(field, {
        showInList: false,
        showInForm: false,
        showInDetail: true,
      }),
    );

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.showInList).toBe(false);
    expect(result.value.showInForm).toBe(false);
    expect(result.value.showInDetail).toBe(true);
  });
});
