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
  multiple: false,
  relationship: null,
  widthInForm: 50,
  widthInList: 10,
  widthInDetail: null,
};

describe('Group Field Create - REACTION', () => {
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

  it('deve criar campo REACTION basico no grupo', async () => {
    const result = await sut.execute({
      ...FIELD_PAYLOAD_BASE,
      slug: 'pedidos',
      groupSlug: 'itens',
      name: 'Curtida',
      type: E_FIELD_TYPE.REACTION,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.type).toBe(E_FIELD_TYPE.REACTION);
    expect(result.value.format).toBeNull();
    expect(result.value.slug).toBe('curtida');
  });

  it('deve criar campo REACTION sem formato no grupo', async () => {
    const result = await sut.execute({
      ...FIELD_PAYLOAD_BASE,
      slug: 'pedidos',
      groupSlug: 'itens',
      name: 'Aprovacao',
      type: E_FIELD_TYPE.REACTION,
      format: null,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.type).toBe(E_FIELD_TYPE.REACTION);
    expect(result.value.format).toBeNull();
  });
});
