import { beforeEach, describe, expect, it, vi } from 'vitest';

import { E_TABLE_STYLE } from '@application/core/entity.core';
import FieldInMemoryRepository from '@application/repositories/field/field-in-memory.repository';
import RowInMemoryRepository from '@application/repositories/row/row-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';
import TableSchemaInMemoryService from '@application/services/table-schema/table-schema-in-memory.service';

import ImportTableUseCase from './import-table.use-case';

vi.mock('slugify', () => ({
  default: vi.fn((name: string) => name.toLowerCase().replace(/\s+/g, '-')),
}));

let tableInMemoryRepository: TableInMemoryRepository;
let fieldInMemoryRepository: FieldInMemoryRepository;
let rowInMemoryRepository: RowInMemoryRepository;
let tableSchemaService: TableSchemaInMemoryService;
let sut: ImportTableUseCase;

const validFileContent = {
  header: {
    version: '1.0',
    platform: 'lowcodejs',
    tableName: 'Clientes',
    tableSlug: 'clientes',
    exportedBy: 'Admin',
    exportedAt: '2024-01-01T00:00:00.000Z',
    exportType: 'structure',
  },
  structure: {
    name: 'Clientes',
    slug: 'clientes',
    description: null,
    style: E_TABLE_STYLE.LIST,
    viewTable: 'NOBODY',
    fields: [
      {
        name: 'Nome',
        slug: 'nome',
        type: 'TEXT_SHORT',
        required: true,
        multiple: false,
        format: 'ALPHA_NUMERIC',
        visibilityList: 'HIDDEN',
        visibilityForm: 'HIDDEN',
        visibilityDetail: 'HIDDEN',
        widthInForm: null,
        widthInList: null,
        widthInDetail: null,
        defaultValue: null,
        relationship: null,
        dropdown: [],
        category: [],
        group: null,
      },
    ],
    groups: [],
    fieldOrderList: ['nome'],
    fieldOrderForm: ['nome'],
    fieldOrderFilter: [],
    fieldOrderDetail: [],
    layoutFields: {},
    methods: {
      onLoad: { code: null },
      beforeSave: { code: null },
      afterSave: { code: null },
    },
  },
};

describe('Import Table Use Case', () => {
  beforeEach(() => {
    tableInMemoryRepository = new TableInMemoryRepository();
    fieldInMemoryRepository = new FieldInMemoryRepository();
    rowInMemoryRepository = new RowInMemoryRepository();

    tableSchemaService = new TableSchemaInMemoryService();

    sut = new ImportTableUseCase(
      tableInMemoryRepository,
      fieldInMemoryRepository,
      rowInMemoryRepository,
      tableSchemaService,
    );
  });

  it('deve importar tabela com estrutura com sucesso', async () => {
    const result = await sut.execute({
      name: 'Clientes Importados',
      fileContent: validFileContent,
      ownerId: 'owner-id',
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.slug).toBe('clientes-importados');
    expect(result.value.importedFields).toBe(1);
    expect(result.value.importedRows).toBe(0);
    expect(result.value.tableId).toBeTruthy();
  });

  it('deve retornar erro OWNER_ID_REQUIRED quando ownerId nao fornecido', async () => {
    const result = await sut.execute({
      name: 'Clientes',
      fileContent: validFileContent,
      ownerId: '',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(400);
    expect(result.value.cause).toBe('OWNER_ID_REQUIRED');
  });

  it('deve retornar erro INVALID_PLATFORM quando plataforma nao e lowcodejs', async () => {
    const invalidContent = {
      header: {
        ...validFileContent.header,
        platform: 'other-platform',
      },
      structure: validFileContent.structure,
    };

    const result = await sut.execute({
      name: 'Clientes',
      fileContent: invalidContent,
      ownerId: 'owner-id',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(400);
    expect(result.value.cause).toBe('INVALID_PLATFORM');
  });

  it('deve retornar erro TABLE_SLUG_ALREADY_EXISTS quando slug ja existe', async () => {
    await tableInMemoryRepository.create({
      name: 'Clientes',
      slug: 'clientes',
      _schema: {},
      fields: [],
      owner: 'owner-id',
      style: E_TABLE_STYLE.LIST,
      viewTable: 'NOBODY',
      fieldOrderList: [],
      fieldOrderForm: [],
    });

    const result = await sut.execute({
      name: 'Clientes',
      fileContent: validFileContent,
      ownerId: 'owner-id',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(400);
    expect(result.value.cause).toBe('TABLE_SLUG_ALREADY_EXISTS');
  });

  it('deve retornar erro STRUCTURE_REQUIRED quando nao tem estrutura', async () => {
    const dataOnlyContent = {
      header: {
        ...validFileContent.header,
        exportType: 'data',
      },
    };

    const result = await sut.execute({
      name: 'Clientes Data',
      fileContent: dataOnlyContent,
      ownerId: 'owner-id',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(400);
    expect(result.value.cause).toBe('STRUCTURE_REQUIRED');
  });

  it('deve retornar erro INVALID_PLATFORM quando header ausente', async () => {
    const result = await sut.execute({
      name: 'Clientes',
      fileContent: {},
      ownerId: 'owner-id',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(400);
    expect(result.value.cause).toBe('INVALID_PLATFORM');
  });

  it('deve retornar erro IMPORT_TABLE_ERROR quando houver falha', async () => {
    tableInMemoryRepository.simulateError(
      'findBySlug',
      new Error('Database error'),
    );

    const result = await sut.execute({
      name: 'Clientes',
      fileContent: validFileContent,
      ownerId: 'owner-id',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(500);
    expect(result.value.cause).toBe('IMPORT_TABLE_ERROR');
  });
});
