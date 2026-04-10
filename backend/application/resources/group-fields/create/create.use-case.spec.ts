import { beforeEach, describe, expect, it, vi } from 'vitest';

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

import GroupFieldCreateUseCase from './create.use-case';

let tableRepository: TableInMemoryRepository;
let fieldRepository: FieldInMemoryRepository;
let tableSchemaService: TableSchemaInMemoryService;
let sut: GroupFieldCreateUseCase;

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

const FIELD_PAYLOAD_BASE = {
  type: E_FIELD_TYPE.TEXT_SHORT,
  showInList: true,
  showInForm: true,
  showInDetail: true,
  showInFilter: true,
  locked: false,
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

describe('Group Field Create Use Case', () => {
  beforeEach(() => {
    tableRepository = new TableInMemoryRepository();
    fieldRepository = new FieldInMemoryRepository();
    tableSchemaService = new TableSchemaInMemoryService();

    sut = new GroupFieldCreateUseCase(
      tableRepository,
      fieldRepository,
      tableSchemaService,
    );
  });

  it('deve criar campo no grupo com sucesso', async () => {
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

    const createSpy = vi.spyOn(fieldRepository, 'create');
    const updateSpy = vi.spyOn(tableRepository, 'update');

    const result = await sut.execute({
      slug: 'clientes',
      groupSlug: 'endereco',
      name: 'Rua',
      ...FIELD_PAYLOAD_BASE,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.name).toBe('Rua');
    expect(result.value.slug).toBe('rua');
    expect(result.value.type).toBe(E_FIELD_TYPE.TEXT_SHORT);

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledTimes(1);
  });

  it('deve retornar TABLE_NOT_FOUND quando tabela nao existe', async () => {
    const findBySlugSpy = vi.spyOn(tableRepository, 'findBySlug');

    const result = await sut.execute({
      slug: 'inexistente',
      groupSlug: 'endereco',
      name: 'Rua',
      ...FIELD_PAYLOAD_BASE,
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(404);
    expect(result.value.cause).toBe('TABLE_NOT_FOUND');
    expect(result.value.message).toBe('Tabela não encontrada');

    expect(findBySlugSpy).toHaveBeenCalledTimes(1);
    expect(findBySlugSpy).toHaveBeenCalledWith('inexistente');
  });

  it('deve retornar GROUP_NOT_FOUND quando grupo nao existe', async () => {
    await tableRepository.create({
      ...TABLE_DEFAULTS,
      name: 'Clientes',
      slug: 'clientes',
      groups: [],
    });

    const result = await sut.execute({
      slug: 'clientes',
      groupSlug: 'inexistente',
      name: 'Rua',
      ...FIELD_PAYLOAD_BASE,
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(404);
    expect(result.value.cause).toBe('GROUP_NOT_FOUND');
    expect(result.value.message).toBe('Grupo não encontrado');
  });

  it('deve retornar FIELD_ALREADY_EXIST quando slug duplicado', async () => {
    const existingField = await fieldRepository.create({
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
    });

    await tableRepository.create({
      ...TABLE_DEFAULTS,
      name: 'Clientes',
      slug: 'clientes',
      groups: [
        {
          slug: 'endereco',
          name: 'Endereco',
          fields: [existingField],
          _schema: {},
        },
      ],
    });

    const result = await sut.execute({
      slug: 'clientes',
      groupSlug: 'endereco',
      name: 'Rua',
      ...FIELD_PAYLOAD_BASE,
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(409);
    expect(result.value.cause).toBe('FIELD_ALREADY_EXIST');
    expect(result.value.message).toBe('Campo já existe no grupo');
  });

  it('deve retornar CREATE_GROUP_FIELD_ERROR quando repository falha', async () => {
    tableRepository.simulateError('findBySlug', new Error('Database error'));

    const result = await sut.execute({
      slug: 'clientes',
      groupSlug: 'endereco',
      name: 'Rua',
      ...FIELD_PAYLOAD_BASE,
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(500);
    expect(result.value.cause).toBe('CREATE_GROUP_FIELD_ERROR');
    expect(result.value.message).toBe('Erro interno do servidor');
  });
});
