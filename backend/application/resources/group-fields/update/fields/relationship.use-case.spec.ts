import { beforeEach, describe, expect, it } from 'vitest';

import {
  E_FIELD_TYPE,
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
} from '@application/core/entity.core';
import type { FieldCreatePayload } from '@application/repositories/field/field-contract.repository';
import FieldInMemoryRepository from '@application/repositories/field/field-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';
import TableSchemaInMemoryService from '@application/services/table-schema/table-schema-in-memory.service';

import GroupFieldUpdateUseCase from '../update.use-case';

let tableInMemoryRepository: TableInMemoryRepository;
let fieldInMemoryRepository: FieldInMemoryRepository;
let tableSchemaService: TableSchemaInMemoryService;
let sut: GroupFieldUpdateUseCase;

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
  name: 'Produto',
  slug: 'produto',
  type: E_FIELD_TYPE.RELATIONSHIP,
  showInList: true,
  showInForm: true,
  showInDetail: true,
  showInFilter: false,
  locked: false,
  native: false,
  required: false,
  category: [],
  dropdown: [],
  defaultValue: null,
  format: null,
  group: null,
  multiple: false,
  relationship: {
    table: { _id: 'table-produtos-id', slug: 'produtos' },
    field: { _id: 'field-nome-id', slug: 'nome' },
    order: 'asc',
  },
  widthInForm: 50,
  widthInList: 10,
  widthInDetail: null,
} satisfies FieldCreatePayload;

const UPDATE_PAYLOAD_BASE = {
  slug: 'pedidos',
  groupSlug: 'itens',
  trashed: false,
  trashedAt: null,
  locked: false,
  category: [],
  dropdown: [],
  defaultValue: null,
  group: null,
  format: null,
};

describe('Group Field Update - RELATIONSHIP', () => {
  beforeEach(async () => {
    tableInMemoryRepository = new TableInMemoryRepository();
    fieldInMemoryRepository = new FieldInMemoryRepository();
    tableSchemaService = new TableSchemaInMemoryService();

    sut = new GroupFieldUpdateUseCase(
      tableInMemoryRepository,
      fieldInMemoryRepository,
      tableSchemaService,
    );
  });

  it('deve mudar tabela destino do relacionamento', async () => {
    const field = await fieldInMemoryRepository.create(FIELD_CREATE_PAYLOAD);

    await tableInMemoryRepository.create({
      ...TABLE_DEFAULTS,
      name: 'Pedidos',
      slug: 'pedidos',
      groups: [
        {
          slug: 'itens',
          name: 'Itens',
          fields: [field],
          _schema: {},
        },
      ],
    });

    const result = await sut.execute({
      ...UPDATE_PAYLOAD_BASE,
      fieldId: field._id,
      name: 'Produto',
      type: E_FIELD_TYPE.RELATIONSHIP,
      required: false,
      multiple: false,
      showInList: true,
      showInForm: true,
      showInDetail: true,
      showInFilter: false,
      widthInForm: 50,
      widthInList: 10,
      widthInDetail: null,
      relationship: {
        table: { _id: 'table-servicos-id', slug: 'servicos' },
        field: { _id: 'field-titulo-id', slug: 'titulo' },
        order: 'asc',
      },
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.relationship).not.toBeNull();
    expect(result.value.relationship!.table.slug).toBe('servicos');
    expect(result.value.relationship!.field.slug).toBe('titulo');
  });

  it('deve mudar multiple de false para true', async () => {
    const field = await fieldInMemoryRepository.create(FIELD_CREATE_PAYLOAD);

    await tableInMemoryRepository.create({
      ...TABLE_DEFAULTS,
      name: 'Pedidos',
      slug: 'pedidos',
      groups: [
        {
          slug: 'itens',
          name: 'Itens',
          fields: [field],
          _schema: {},
        },
      ],
    });

    const result = await sut.execute({
      ...UPDATE_PAYLOAD_BASE,
      fieldId: field._id,
      name: 'Produto',
      type: E_FIELD_TYPE.RELATIONSHIP,
      required: false,
      multiple: true,
      showInList: true,
      showInForm: true,
      showInDetail: true,
      showInFilter: false,
      widthInForm: 50,
      widthInList: 10,
      widthInDetail: null,
      relationship: {
        table: { _id: 'table-produtos-id', slug: 'produtos' },
        field: { _id: 'field-nome-id', slug: 'nome' },
        order: 'asc',
      },
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.multiple).toBe(true);
    expect(result.value.type).toBe(E_FIELD_TYPE.RELATIONSHIP);
  });
});
