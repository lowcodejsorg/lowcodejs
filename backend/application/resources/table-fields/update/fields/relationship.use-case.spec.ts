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
  slug: 'produtos',
  type: E_FIELD_TYPE.RELATIONSHIP,
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
  relationship: {
    table: { _id: '507f1f77bcf86cd799439099', slug: 'produtos' },
    field: { _id: '507f1f77bcf86cd799439088', slug: 'nome' },
    order: 'asc',
  },
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
    name: 'Produtos',
    ...fieldOverrides,
  });

  const table = await tableRepo.create({
    name: 'Pedidos',
    slug: 'pedidos',
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
    slug: 'pedidos',
    _id: field._id as string,
    name: field.name as string,
    type: field.type as string,
    format: field.format as string | null,
    required: field.required as boolean,
    multiple: field.multiple as boolean,
    defaultValue: field.defaultValue as string | string[] | null,
    relationship: field.relationship as {
      table: { _id: string; slug: string };
      field: { _id: string; slug: string };
      order: string;
    } | null,
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

describe('Table Field Update - RELATIONSHIP', () => {
  beforeEach(() => {
    tableInMemoryRepository = new TableInMemoryRepository();
    fieldInMemoryRepository = new FieldInMemoryRepository();
    sut = new TableFieldUpdateUseCase(
      tableInMemoryRepository,
      fieldInMemoryRepository,
    );
  });

  it('deve mudar tabela destino do relacionamento', async () => {
    const { field } = await createFieldAndTable(
      fieldInMemoryRepository,
      tableInMemoryRepository,
    );

    const result = await sut.execute(
      buildUpdatePayload(field, {
        relationship: {
          table: { _id: '607f1f77bcf86cd799439011', slug: 'clientes' },
          field: { _id: '607f1f77bcf86cd799439022', slug: 'nome' },
          order: 'asc',
        },
      }),
    );

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.relationship).not.toBeNull();
    expect(result.value.relationship!.table.slug).toBe('clientes');
  });

  it('deve mudar order de asc para desc', async () => {
    const { field } = await createFieldAndTable(
      fieldInMemoryRepository,
      tableInMemoryRepository,
    );

    const result = await sut.execute(
      buildUpdatePayload(field, {
        relationship: {
          table: { _id: '507f1f77bcf86cd799439099', slug: 'produtos' },
          field: { _id: '507f1f77bcf86cd799439088', slug: 'nome' },
          order: 'desc',
        },
      }),
    );

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.relationship!.order).toBe('desc');
  });

  it('deve mudar multiple false para true', async () => {
    const { field } = await createFieldAndTable(
      fieldInMemoryRepository,
      tableInMemoryRepository,
    );

    const result = await sut.execute(
      buildUpdatePayload(field, { multiple: true }),
    );

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.multiple).toBe(true);
  });
});
