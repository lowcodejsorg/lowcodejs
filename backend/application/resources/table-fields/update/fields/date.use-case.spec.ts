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
  slug: 'data-evento',
  type: E_FIELD_TYPE.DATE,
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
  format: E_FIELD_FORMAT.DD_MM_YYYY,
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
    name: 'Data Evento',
    ...fieldOverrides,
  });

  const table = await tableRepo.create({
    name: 'Eventos',
    slug: 'eventos',
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
    slug: 'eventos',
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

describe('Table Field Update - DATE', () => {
  beforeEach(() => {
    tableInMemoryRepository = new TableInMemoryRepository();
    fieldInMemoryRepository = new FieldInMemoryRepository();
    sut = new TableFieldUpdateUseCase(
      tableInMemoryRepository,
      fieldInMemoryRepository,
    );
  });

  it('deve mudar formato DD_MM_YYYY para YYYY_MM_DD_HH_MM_SS', async () => {
    const { field } = await createFieldAndTable(
      fieldInMemoryRepository,
      tableInMemoryRepository,
    );

    const result = await sut.execute(
      buildUpdatePayload(field, { format: E_FIELD_FORMAT.YYYY_MM_DD_HH_MM_SS }),
    );

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.format).toBe(E_FIELD_FORMAT.YYYY_MM_DD_HH_MM_SS);
  });

  it('deve mudar formato para DD_MM_YYYY_DASH', async () => {
    const { field } = await createFieldAndTable(
      fieldInMemoryRepository,
      tableInMemoryRepository,
    );

    const result = await sut.execute(
      buildUpdatePayload(field, { format: E_FIELD_FORMAT.DD_MM_YYYY_DASH }),
    );

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.format).toBe(E_FIELD_FORMAT.DD_MM_YYYY_DASH);
  });

  it('deve mudar formato para YYYY_MM_DD_HH_MM_SS_DASH', async () => {
    const { field } = await createFieldAndTable(
      fieldInMemoryRepository,
      tableInMemoryRepository,
    );

    const result = await sut.execute(
      buildUpdatePayload(field, {
        format: E_FIELD_FORMAT.YYYY_MM_DD_HH_MM_SS_DASH,
      }),
    );

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.format).toBe(E_FIELD_FORMAT.YYYY_MM_DD_HH_MM_SS_DASH);
  });

  it('deve mudar required false para true', async () => {
    const { field } = await createFieldAndTable(
      fieldInMemoryRepository,
      tableInMemoryRepository,
    );

    const result = await sut.execute(
      buildUpdatePayload(field, { required: true }),
    );

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.required).toBe(true);
  });
});
