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
  slug: 'categorias',
  type: E_FIELD_TYPE.CATEGORY,
  visibilityList: 'HIDDEN',
  visibilityForm: 'HIDDEN',
  visibilityDetail: 'HIDDEN',
  locked: false,
  native: false,
  required: false,
  dropdown: [],
  defaultValue: null,
  format: null,
  group: null,
  multiple: false,
  relationship: null,
  widthInForm: 50,
  widthInList: 10,
  widthInDetail: null,
  category: [
    { id: '1', label: 'Tecnologia', children: [] },
    { id: '2', label: 'Saude', children: [] },
  ],
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function createFieldAndTable(
  fieldRepo: FieldInMemoryRepository,
  tableRepo: TableInMemoryRepository,
  fieldOverrides: Partial<IField> = {},
) {
  const field = await fieldRepo.create({
    ...FIELD_DEFAULTS,
    name: 'Categorias',
    ...fieldOverrides,
  });

  const table = await tableRepo.create({
    name: 'Artigos',
    slug: 'artigos',
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
    slug: 'artigos',
    _id: field._id,
    name: field.name,
    type: field.type,
    format: field.format,
    required: field.required,
    multiple: field.multiple,
    defaultValue: field.defaultValue,
    relationship: field.relationship,
    dropdown: field.dropdown,
    category: field.category as {
      id: string;
      label: string;
      children: unknown[];
    }[],
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

describe('Table Field Update - CATEGORY', () => {
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

  it('deve mudar arvore de categorias adicionando e removendo nodes', async () => {
    const { field } = await createFieldAndTable(
      fieldInMemoryRepository,
      tableInMemoryRepository,
    );

    const result = await sut.execute(
      buildUpdatePayload(field, {
        category: [
          { id: '1', label: 'Tecnologia', children: [] },
          {
            id: '3',
            label: 'Educacao',
            children: [{ id: '3.1', label: 'Ensino Superior', children: [] }],
          },
        ],
      }),
    );

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.category).toHaveLength(2);
    expect(result.value.category[0].label).toBe('Tecnologia');
    expect(result.value.category[1].label).toBe('Educacao');
    expect(result.value.category[1].children).toHaveLength(1);
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
