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
  relationship: null,
  widthInForm: 50,
  widthInList: 10,
  widthInDetail: null,
  format: null,
};

describe('Table Field Create - FIELD_GROUP', () => {
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

  it('deve criar campo FIELD_GROUP e gerar grupo com campos nativos', async () => {
    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'pedidos',
      name: 'Itens',
      type: E_FIELD_TYPE.FIELD_GROUP,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.type).toBe(E_FIELD_TYPE.FIELD_GROUP);
    expect(result.value.group).not.toBeNull();
    expect(result.value.group!.slug).toBe('itens');
  });

  it('deve adicionar grupo em table.groups', async () => {
    await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'pedidos',
      name: 'Produtos',
      type: E_FIELD_TYPE.FIELD_GROUP,
    });

    const updatedTable = await tableRepository.findBySlug('pedidos');
    expect(updatedTable?.groups).toBeDefined();
    expect(updatedTable?.groups).toHaveLength(1);
    expect(updatedTable!.groups![0].slug).toBe('produtos');
    expect(updatedTable!.groups![0].name).toBe('Produtos');
    expect(updatedTable!.groups![0].fields).toBeDefined();
    expect(updatedTable!.groups![0].fields.length).toBeGreaterThanOrEqual(5);
  });

  it('deve atualizar o campo com group.slug apos criacao', async () => {
    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'pedidos',
      name: 'Enderecos',
      type: E_FIELD_TYPE.FIELD_GROUP,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    const created = await fieldRepository.findById(result.value._id);
    expect(created?.group).toEqual({ slug: 'enderecos' });
  });

  it('deve reconstruir tabela via syncModel', async () => {
    await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'pedidos',
      name: 'Contatos',
      type: E_FIELD_TYPE.FIELD_GROUP,
    });

    expect(tableSchemaService.syncModelCallCount).toBeGreaterThanOrEqual(1);
  });
});
