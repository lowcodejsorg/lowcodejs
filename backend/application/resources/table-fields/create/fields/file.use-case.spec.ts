import { beforeEach, describe, expect, it } from 'vitest';

import { E_FIELD_TYPE, E_TABLE_STYLE } from '@application/core/entity.core';
import FieldInMemoryRepository from '@application/repositories/field/field-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';
import TableSchemaInMemoryService from '@application/services/table-schema/table-schema-in-memory.service';

import TableFieldCreateUseCase from '../create.use-case';

let tableRepository: TableInMemoryRepository;
let fieldRepository: FieldInMemoryRepository;
let tableSchemaService: TableSchemaInMemoryService;
let sut: TableFieldCreateUseCase;

const BASE_PAYLOAD = {
  visibilityList: 'HIDDEN',
  visibilityForm: 'HIDDEN',
  visibilityDetail: 'HIDDEN',
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

describe('Table Field Create - FILE', () => {
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
      name: 'Documentos',
      slug: 'documentos',
      _schema: {},
      fields: [],
      owner: 'owner-id',
      style: E_TABLE_STYLE.LIST,
      viewTable: 'NOBODY',
      fieldOrderList: [],
      fieldOrderForm: [],
    });
  });

  it('deve criar campo FILE', async () => {
    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'documentos',
      name: 'Anexo',
      type: E_FIELD_TYPE.FILE,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.type).toBe(E_FIELD_TYPE.FILE);
  });

  it('deve criar campo FILE multiple=true', async () => {
    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'documentos',
      name: 'Arquivos',
      type: E_FIELD_TYPE.FILE,
      multiple: true,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.multiple).toBe(true);
  });

  it('deve criar campo FILE required=true', async () => {
    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'documentos',
      name: 'Comprovante',
      type: E_FIELD_TYPE.FILE,
      required: true,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.required).toBe(true);
  });
});
