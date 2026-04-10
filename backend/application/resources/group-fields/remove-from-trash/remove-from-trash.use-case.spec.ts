import { beforeEach, describe, expect, it } from 'vitest';

import {
  E_FIELD_FORMAT,
  E_FIELD_TYPE,
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
} from '@application/core/entity.core';
import FieldInMemoryRepository from '@application/repositories/field/field-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';
import TableSchemaInMemoryService from '@application/services/table-schema/table-schema-in-memory.service';

import GroupFieldRemoveFromTrashUseCase from './remove-from-trash.use-case';

let tableRepository: TableInMemoryRepository;
let fieldRepository: FieldInMemoryRepository;
let tableSchemaService: TableSchemaInMemoryService;
let sut: GroupFieldRemoveFromTrashUseCase;

const TABLE_DEFAULTS = {
  _schema: {},
  fields: [],
  owner: 'owner-id',
  administrators: [],
  style: E_TABLE_STYLE.LIST,
  visibility: E_TABLE_VISIBILITY.RESTRICTED,
  collaboration: E_TABLE_COLLABORATION.RESTRICTED,
  fieldOrderList: [],
  fieldOrderForm: [],
};

const FIELD_CREATE_PAYLOAD = {
  name: 'Rua',
  slug: 'rua',
  type: E_FIELD_TYPE.TEXT_SHORT,
  showInList: true,
  showInForm: true,
  showInDetail: true,
  showInFilter: true,
  locked: false,
  native: false,
  required: false,
  category: [],
  dropdown: [],
  defaultValue: null,
  format: E_FIELD_FORMAT.ALPHA_NUMERIC,
  group: null,
  multiple: false,
  relationship: null,
  widthInForm: 50,
  widthInList: 10,
  widthInDetail: null,
};

describe('Group Field Remove From Trash Use Case', () => {
  beforeEach(() => {
    tableRepository = new TableInMemoryRepository();
    fieldRepository = new FieldInMemoryRepository();
    tableSchemaService = new TableSchemaInMemoryService();

    sut = new GroupFieldRemoveFromTrashUseCase(
      tableRepository,
      fieldRepository,
      tableSchemaService,
    );
  });

  it('deve restaurar campo da lixeira', async () => {
    const field = await fieldRepository.create(FIELD_CREATE_PAYLOAD);

    // Marca o campo como trashed
    await fieldRepository.update({
      _id: field._id,
      trashed: true,
      trashedAt: new Date(),
      showInList: false,
      showInForm: false,
      showInDetail: false,
      showInFilter: false,
      required: false,
    });

    await tableRepository.create({
      ...TABLE_DEFAULTS,
      name: 'Clientes',
      slug: 'clientes',
      groups: [
        {
          slug: 'endereco',
          name: 'Endereco',
          fields: [field],
          _schema: {},
        },
      ],
    });

    const result = await sut.execute({
      slug: 'clientes',
      groupSlug: 'endereco',
      fieldId: field._id,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.trashed).toBe(false);
    expect(result.value.trashedAt).toBeNull();
    expect(result.value.showInList).toBe(true);
    expect(result.value.showInForm).toBe(true);
    expect(result.value.showInDetail).toBe(true);
    expect(result.value.showInFilter).toBe(true);
    expect(result.value.required).toBe(false);
  });

  it('deve retornar TABLE_NOT_FOUND quando tabela nao existe', async () => {
    const result = await sut.execute({
      slug: 'inexistente',
      groupSlug: 'endereco',
      fieldId: 'field-id',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(404);
    expect(result.value.cause).toBe('TABLE_NOT_FOUND');
    expect(result.value.message).toBe('Tabela não encontrada');
  });

  it('deve retornar FIELD_NOT_FOUND quando campo nao existe', async () => {
    await tableRepository.create({
      ...TABLE_DEFAULTS,
      name: 'Clientes',
      slug: 'clientes',
      groups: [
        {
          slug: 'endereco',
          name: 'Endereco',
          fields: [],
          _schema: {},
        },
      ],
    });

    const result = await sut.execute({
      slug: 'clientes',
      groupSlug: 'endereco',
      fieldId: 'campo-inexistente',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(404);
    expect(result.value.cause).toBe('FIELD_NOT_FOUND');
    expect(result.value.message).toBe('Campo não encontrado');
  });

  it('deve retornar NOT_TRASHED quando campo nao esta na lixeira', async () => {
    const field = await fieldRepository.create(FIELD_CREATE_PAYLOAD);

    await tableRepository.create({
      ...TABLE_DEFAULTS,
      name: 'Clientes',
      slug: 'clientes',
      groups: [
        {
          slug: 'endereco',
          name: 'Endereco',
          fields: [field],
          _schema: {},
        },
      ],
    });

    const result = await sut.execute({
      slug: 'clientes',
      groupSlug: 'endereco',
      fieldId: field._id,
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(409);
    expect(result.value.cause).toBe('NOT_TRASHED');
    expect(result.value.message).toBe('Campo não está na lixeira');
  });
});
