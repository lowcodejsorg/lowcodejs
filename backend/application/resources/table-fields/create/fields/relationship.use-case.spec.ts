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
  category: [],
  dropdown: [],
  defaultValue: null,
  group: null,
  multiple: false,
  widthInForm: 50,
  widthInList: 10,
  widthInDetail: null,
  format: null,
};

describe('Table Field Create - RELATIONSHIP', () => {
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
      name: 'Pedidos',
      slug: 'pedidos',
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

  it('deve criar campo RELATIONSHIP com configuracao', async () => {
    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'pedidos',
      name: 'Produtos',
      type: E_FIELD_TYPE.RELATIONSHIP,
      relationship: {
        table: { _id: '507f1f77bcf86cd799439099', slug: 'produtos' },
        field: { _id: '507f1f77bcf86cd799439088', slug: 'nome' },
        order: 'asc',
      },
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.type).toBe(E_FIELD_TYPE.RELATIONSHIP);
    expect(result.value.relationship).not.toBeNull();
    expect(result.value.relationship!.table.slug).toBe('produtos');
    expect(result.value.relationship!.field.slug).toBe('nome');
    expect(result.value.relationship!.order).toBe('asc');
  });

  it('deve criar campo RELATIONSHIP multiple=true', async () => {
    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'pedidos',
      name: 'Clientes',
      type: E_FIELD_TYPE.RELATIONSHIP,
      multiple: true,
      relationship: {
        table: { _id: '507f1f77bcf86cd799439099', slug: 'clientes' },
        field: { _id: '507f1f77bcf86cd799439088', slug: 'nome' },
        order: 'desc',
      },
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.multiple).toBe(true);
    expect(result.value.relationship!.order).toBe('desc');
  });

  it('deve criar campo RELATIONSHIP required=true', async () => {
    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'pedidos',
      name: 'Fornecedor',
      type: E_FIELD_TYPE.RELATIONSHIP,
      required: true,
      relationship: {
        table: { _id: '507f1f77bcf86cd799439099', slug: 'fornecedores' },
        field: { _id: '507f1f77bcf86cd799439088', slug: 'razao-social' },
        order: 'asc',
      },
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.required).toBe(true);
  });
});
