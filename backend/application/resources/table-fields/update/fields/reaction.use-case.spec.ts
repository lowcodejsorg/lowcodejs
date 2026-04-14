import { beforeEach, describe, expect, it } from 'vitest';

import {
  E_FIELD_TYPE,
  E_TABLE_STYLE,
  type IField,
} from '@application/core/entity.core';
import FieldInMemoryRepository from '@application/repositories/field/field-in-memory.repository';
import RowInMemoryRepository from '@application/repositories/row/row-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';
import TableSchemaInMemoryService from '@application/services/table-schema/table-schema-in-memory.service';

import TableFieldUpdateUseCase from '../update.use-case';

let tableInMemoryRepository: TableInMemoryRepository;
let fieldInMemoryRepository: FieldInMemoryRepository;
let rowInMemoryRepository: RowInMemoryRepository;
let tableSchemaService: TableSchemaInMemoryService;
let sut: TableFieldUpdateUseCase;

const FIELD_DEFAULTS = {
  slug: 'curtidas',
  type: E_FIELD_TYPE.REACTION,
  visibilityList: 'HIDDEN',
  visibilityForm: 'HIDDEN',
  visibilityDetail: 'HIDDEN',
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
  fieldOverrides: Partial<IField> = {},
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
    style: E_TABLE_STYLE.LIST,
    viewTable: 'NOBODY',
    fieldOrderList: [],
    fieldOrderForm: [],
  });

  table.fields = [field];

  return { field, table };
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function buildUpdatePayload(
  field: IField,
  overrides: Record<string, unknown> = {},
) {
  return {
    slug: 'posts',
    _id: field._id,
    name: field.name,
    type: field.type,
    format: field.format,
    required: field.required,
    multiple: field.multiple,
    defaultValue: field.defaultValue,
    relationship: field.relationship,
    dropdown: field.dropdown,
    category: field.category,
    group: field.group,
    trashed: false,
    trashedAt: null,
    locked: false,
    visibilityList: field.visibilityList,
    visibilityForm: field.visibilityForm,
    visibilityDetail: field.visibilityDetail,
    widthInForm: field.widthInForm,
    widthInList: field.widthInList,
    widthInDetail: field.widthInDetail,
    ...overrides,
  };
}

describe('Table Field Update - REACTION', () => {
  beforeEach(() => {
    tableInMemoryRepository = new TableInMemoryRepository();
    fieldInMemoryRepository = new FieldInMemoryRepository();
    rowInMemoryRepository = new RowInMemoryRepository();

    tableSchemaService = new TableSchemaInMemoryService();

    sut = new TableFieldUpdateUseCase(
      tableInMemoryRepository,
      fieldInMemoryRepository,
      rowInMemoryRepository,
      tableSchemaService,
    );
  });

  it('deve mudar visibilidade visibilityList e visibilityForm', async () => {
    const { field } = await createFieldAndTable(
      fieldInMemoryRepository,
      tableInMemoryRepository,
    );

    const result = await sut.execute(
      buildUpdatePayload(field, {
        visibilityList: 'HIDDEN',
        visibilityForm: 'HIDDEN',
        visibilityDetail: 'HIDDEN',
      }),
    );

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.visibilityList).toBe('HIDDEN');
    expect(result.value.visibilityForm).toBe('HIDDEN');
    expect(result.value.visibilityDetail).toBe('HIDDEN');
  });
});
