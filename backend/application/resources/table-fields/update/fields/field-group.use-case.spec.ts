import { beforeEach, describe, expect, it } from 'vitest';

import {
  E_FIELD_TYPE,
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
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
  slug: 'itens',
  type: E_FIELD_TYPE.FIELD_GROUP,
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
  group: { slug: 'itens' },
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
) {
  const field = await fieldRepo.create({
    ...FIELD_DEFAULTS,
    name: 'Itens',
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
    groups: [
      {
        slug: 'itens',
        name: 'Itens',
        fields: [],
        _schema: {},
      },
    ],
  });

  table.fields = [field];

  return { field, table };
}

describe('Table Field Update - FIELD_GROUP', () => {
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

  it('deve renomear nome do campo e atualizar slug do grupo', async () => {
    const { field } = await createFieldAndTable(
      fieldInMemoryRepository,
      tableInMemoryRepository,
    );

    const result = await sut.execute({
      slug: 'pedidos',
      _id: field._id,
      name: 'Produtos',
      type: E_FIELD_TYPE.FIELD_GROUP,
      format: null,
      required: false,
      multiple: false,
      defaultValue: null,
      relationship: null,
      dropdown: [],
      category: [],
      group: { slug: 'itens' },
      trashed: false,
      trashedAt: null,
      locked: false,
      showInList: true,
      showInForm: true,
      showInDetail: true,
      showInFilter: false,
      widthInForm: 50,
      widthInList: 10,
      widthInDetail: null,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.name).toBe('Produtos');
    expect(result.value.slug).toBe('produtos');
    expect(result.value.group).not.toBeNull();
    expect(result.value.group!.slug).toBe('produtos');
  });

  it('deve chamar syncModel quando slug muda', async () => {
    const { field } = await createFieldAndTable(
      fieldInMemoryRepository,
      tableInMemoryRepository,
    );

    await sut.execute({
      slug: 'pedidos',
      _id: field._id,
      name: 'Componentes',
      type: E_FIELD_TYPE.FIELD_GROUP,
      format: null,
      required: false,
      multiple: false,
      defaultValue: null,
      relationship: null,
      dropdown: [],
      category: [],
      group: { slug: 'itens' },
      trashed: false,
      trashedAt: null,
      locked: false,
      showInList: true,
      showInForm: true,
      showInDetail: true,
      showInFilter: false,
      widthInForm: 50,
      widthInList: 10,
      widthInDetail: null,
    });

    expect(tableSchemaService.syncModelCallCount).toBeGreaterThanOrEqual(1);
  });

  it('deve atualizar slug do grupo na tabela', async () => {
    const { field } = await createFieldAndTable(
      fieldInMemoryRepository,
      tableInMemoryRepository,
    );

    await sut.execute({
      slug: 'pedidos',
      _id: field._id,
      name: 'Materiais',
      type: E_FIELD_TYPE.FIELD_GROUP,
      format: null,
      required: false,
      multiple: false,
      defaultValue: null,
      relationship: null,
      dropdown: [],
      category: [],
      group: { slug: 'itens' },
      trashed: false,
      trashedAt: null,
      locked: false,
      showInList: true,
      showInForm: true,
      showInDetail: true,
      showInFilter: false,
      widthInForm: 50,
      widthInList: 10,
      widthInDetail: null,
    });

    const updatedTable = await tableInMemoryRepository.findBySlug('pedidos');
    expect(updatedTable?.groups).toBeDefined();

    const updatedGroup = updatedTable!.groups!.find(
      (g: { slug: string }) => g.slug === 'materiais',
    );
    expect(updatedGroup).toBeDefined();
    expect(updatedGroup!.name).toBe('Materiais');
  });
});
