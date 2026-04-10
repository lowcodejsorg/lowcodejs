import { beforeEach, describe, expect, it } from 'vitest';

import {
  E_FIELD_TYPE,
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
} from '@application/core/entity.core';
import FieldInMemoryRepository from '@application/repositories/field/field-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';
import TableSchemaInMemoryService from '@application/services/table-schema/table-schema-in-memory.service';

import TableFieldCreateUseCase from '../create.use-case';

let tableRepository: TableInMemoryRepository;
let fieldRepository: FieldInMemoryRepository;
let tableSchemaService: TableSchemaInMemoryService;
let sut: TableFieldCreateUseCase;

const BASE_PAYLOAD = {
  showInList: true,
  showInForm: true,
  showInDetail: true,
  showInFilter: false,
  locked: false,
  required: false,
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

describe('Table Field Create - CATEGORY', () => {
  beforeEach(async () => {
    tableRepository = new TableInMemoryRepository();
    fieldRepository = new FieldInMemoryRepository();
    tableSchemaService = new TableSchemaInMemoryService();

    sut = new TableFieldCreateUseCase(
      tableRepository,
      fieldRepository,
      tableSchemaService,
    );

    await tableRepository.create({
      name: 'Artigos',
      slug: 'artigos',
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

  it('deve criar campo CATEGORY com arvore de categorias', async () => {
    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'artigos',
      name: 'Categorias',
      type: E_FIELD_TYPE.CATEGORY,
      category: [
        { id: '1', label: 'Tecnologia', children: [] },
        {
          id: '2',
          label: 'Saude',
          children: [{ id: '2.1', label: 'Medicina', children: [] }],
        },
      ],
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.type).toBe(E_FIELD_TYPE.CATEGORY);
    expect(result.value.category).toHaveLength(2);
    expect(result.value.category[0].label).toBe('Tecnologia');
  });

  it('deve criar campo CATEGORY required=true', async () => {
    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'artigos',
      name: 'Tipo',
      type: E_FIELD_TYPE.CATEGORY,
      category: [{ id: '1', label: 'Geral', children: [] }],
      required: true,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.required).toBe(true);
  });
});
