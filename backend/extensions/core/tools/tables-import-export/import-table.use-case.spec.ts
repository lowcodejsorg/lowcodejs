import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
} from '@application/core/entity.core';
import FieldInMemoryRepository from '@application/repositories/field/field-in-memory.repository';
import MenuInMemoryRepository from '@application/repositories/menu/menu-in-memory.repository';
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
let menuInMemoryRepository: MenuInMemoryRepository;
let tableSchemaService: TableSchemaInMemoryService;
let sut: ImportTableUseCase;

const baseStructure = {
  name: 'Clientes',
  slug: 'clientes',
  description: null,
  style: E_TABLE_STYLE.LIST,
  visibility: E_TABLE_VISIBILITY.RESTRICTED,
  collaboration: E_TABLE_COLLABORATION.RESTRICTED,
  fields: [
    {
      name: 'Nome',
      slug: 'nome',
      type: 'TEXT_SHORT',
      required: true,
      multiple: false,
      format: 'ALPHA_NUMERIC',
      showInFilter: true,
      showInForm: true,
      showInDetail: true,
      showInList: true,
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
};

const v1FileContent = {
  header: {
    version: '1.0',
    platform: 'lowcodejs',
    tableName: 'Clientes',
    tableSlug: 'clientes',
    exportedBy: 'Admin',
    exportedAt: '2024-01-01T00:00:00.000Z',
    exportType: 'structure',
  },
  structure: baseStructure,
};

const v2FileContent = {
  header: {
    version: '2.0',
    platform: 'lowcodejs',
    tableName: 'Clientes',
    tableSlug: 'clientes',
    exportedBy: 'Admin',
    exportedAt: '2024-01-01T00:00:00.000Z',
    exportType: 'structure',
    tablesCount: 1,
    menusCount: 0,
  },
  tables: [{ structure: baseStructure }],
  menus: [],
};

describe('Import Table Use Case', () => {
  beforeEach(() => {
    tableInMemoryRepository = new TableInMemoryRepository();
    fieldInMemoryRepository = new FieldInMemoryRepository();
    rowInMemoryRepository = new RowInMemoryRepository();
    menuInMemoryRepository = new MenuInMemoryRepository();
    tableSchemaService = new TableSchemaInMemoryService();

    sut = new ImportTableUseCase(
      tableInMemoryRepository,
      fieldInMemoryRepository,
      rowInMemoryRepository,
      menuInMemoryRepository,
      tableSchemaService,
    );
  });

  it('deve importar tabela v1 (legacy) com sucesso', async () => {
    const result = await sut.execute({
      name: 'Clientes Importados',
      fileContent: v1FileContent,
      ownerId: 'owner-id',
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.slug).toBe('clientes-importados');
    expect(result.value.importedFields).toBe(1);
    expect(result.value.importedRows).toBe(0);
    expect(result.value.tableId).toBeTruthy();
    expect(result.value.tables).toHaveLength(1);
    expect(result.value.importedMenus).toBe(0);
  });

  it('deve importar pacote v2 mantendo slug original quando name nao for enviado', async () => {
    const result = await sut.execute({
      name: null,
      fileContent: v2FileContent,
      ownerId: 'owner-id',
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.slug).toBe('clientes');
  });

  it('deve retornar erro OWNER_ID_REQUIRED quando ownerId nao fornecido', async () => {
    const result = await sut.execute({
      name: 'Clientes',
      fileContent: v1FileContent,
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
        ...v1FileContent.header,
        platform: 'other-platform',
      },
      structure: v1FileContent.structure,
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

  it('deve retornar erro TABLE_SLUG_ALREADY_EXISTS quando slug ja existe (single-table)', async () => {
    await tableInMemoryRepository.create({
      name: 'Clientes',
      slug: 'clientes',
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

    const result = await sut.execute({
      name: 'Clientes',
      fileContent: v1FileContent,
      ownerId: 'owner-id',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(400);
    expect(result.value.cause).toBe('TABLE_SLUG_ALREADY_EXISTS');
  });

  it('deve retornar IMPORT_CONFLICTS listando tabelas e menus conflitantes', async () => {
    await tableInMemoryRepository.create({
      name: 'Clientes',
      slug: 'clientes',
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
    await menuInMemoryRepository.create({
      name: 'Existente',
      slug: 'cadastros',
      type: 'SEPARATOR' as never,
    });

    const fileWithMenu = {
      ...v2FileContent,
      menus: [
        {
          _originalId: 'm1',
          name: 'Cadastros',
          slug: 'cadastros',
          type: 'SEPARATOR',
          parent: null,
          url: null,
          html: null,
          order: 0,
          isInitial: false,
          tableSlug: null,
          extension: null,
        },
      ],
    };

    const result = await sut.execute({
      name: null,
      fileContent: fileWithMenu,
      ownerId: 'owner-id',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.cause).toBe('IMPORT_CONFLICTS');
    expect(result.value.errors?.tables).toBe('clientes');
    expect(result.value.errors?.menus).toBe('cadastros');
  });

  it('deve retornar erro STRUCTURE_REQUIRED quando nao tem estrutura', async () => {
    const dataOnlyContent = {
      header: {
        ...v1FileContent.header,
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
      fileContent: v1FileContent,
      ownerId: 'owner-id',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(500);
    expect(result.value.cause).toBe('IMPORT_TABLE_ERROR');
  });
});
