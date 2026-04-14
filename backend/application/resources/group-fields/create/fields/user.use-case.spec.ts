import { beforeEach, describe, expect, it } from 'vitest';

import { E_FIELD_TYPE, E_TABLE_STYLE } from '@application/core/entity.core';
import FieldInMemoryRepository from '@application/repositories/field/field-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';
import TableSchemaInMemoryService from '@application/services/table-schema/table-schema-in-memory.service';

import GroupFieldCreateUseCase from '../create.use-case';

let tableRepository: TableInMemoryRepository;
let fieldRepository: FieldInMemoryRepository;
let tableSchemaService: TableSchemaInMemoryService;
let sut: GroupFieldCreateUseCase;

const TABLE_DEFAULTS = {
  _schema: {},
  fields: [],
  owner: 'owner-id',
  style: E_TABLE_STYLE.LIST,
  viewTable: 'NOBODY',
  fieldOrderList: [],
  fieldOrderForm: [],
};

const FIELD_PAYLOAD_BASE = {
  visibilityList: 'HIDDEN',
  visibilityForm: 'HIDDEN',
  visibilityDetail: 'HIDDEN',
  locked: false,
  required: false,
  category: [],
  dropdown: [],
  defaultValue: null,
  group: null,
  format: null,
  relationship: null,
  widthInForm: 50,
  widthInList: 10,
  widthInDetail: null,
};

describe('Group Field Create - USER', () => {
  beforeEach(async () => {
    tableRepository = new TableInMemoryRepository();
    fieldRepository = new FieldInMemoryRepository();
    tableSchemaService = new TableSchemaInMemoryService();

    sut = new GroupFieldCreateUseCase(
      tableRepository,
      fieldRepository,
      tableSchemaService,
    );

    await tableRepository.create({
      ...TABLE_DEFAULTS,
      name: 'Pedidos',
      slug: 'pedidos',
      groups: [
        {
          slug: 'itens',
          name: 'Itens',
          fields: [],
          _schema: {},
        },
      ],
    });
  });

  it('deve criar campo USER basico no grupo', async () => {
    const result = await sut.execute({
      ...FIELD_PAYLOAD_BASE,
      slug: 'pedidos',
      groupSlug: 'itens',
      name: 'Responsavel',
      type: E_FIELD_TYPE.USER,
      multiple: false,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.type).toBe(E_FIELD_TYPE.USER);
    expect(result.value.multiple).toBe(false);
    expect(result.value.slug).toBe('responsavel');
  });

  it('deve criar campo USER multiple no grupo', async () => {
    const result = await sut.execute({
      ...FIELD_PAYLOAD_BASE,
      slug: 'pedidos',
      groupSlug: 'itens',
      name: 'Participantes',
      type: E_FIELD_TYPE.USER,
      multiple: true,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.type).toBe(E_FIELD_TYPE.USER);
    expect(result.value.multiple).toBe(true);
  });

  it('deve criar campo USER required no grupo', async () => {
    const result = await sut.execute({
      ...FIELD_PAYLOAD_BASE,
      slug: 'pedidos',
      groupSlug: 'itens',
      name: 'Aprovador',
      type: E_FIELD_TYPE.USER,
      multiple: false,
      required: true,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.required).toBe(true);
    expect(result.value.type).toBe(E_FIELD_TYPE.USER);
  });
});
