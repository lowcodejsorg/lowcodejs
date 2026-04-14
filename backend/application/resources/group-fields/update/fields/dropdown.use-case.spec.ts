import { beforeEach, describe, expect, it } from 'vitest';

import { E_FIELD_TYPE, E_TABLE_STYLE } from '@application/core/entity.core';
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
  style: E_TABLE_STYLE.LIST,
  viewTable: 'NOBODY',
  fieldOrderList: [],
  fieldOrderForm: [],
};

const FIELD_CREATE_PAYLOAD = {
  name: 'Status',
  slug: 'status',
  type: E_FIELD_TYPE.DROPDOWN,
  visibilityList: 'HIDDEN',
  visibilityForm: 'HIDDEN',
  visibilityDetail: 'HIDDEN',
  locked: false,
  native: false,
  required: false,
  category: [],
  dropdown: [
    { id: '1', label: 'Pendente', color: '#FFA500' },
    { id: '2', label: 'Aprovado', color: '#00FF00' },
  ],
  defaultValue: null,
  format: null,
  group: null,
  multiple: false,
  relationship: null,
  widthInForm: 50,
  widthInList: 10,
  widthInDetail: null,
};

const UPDATE_PAYLOAD_BASE = {
  slug: 'pedidos',
  groupSlug: 'itens',
  trashed: false,
  trashedAt: null,
  locked: false,
  category: [],
  defaultValue: null,
  group: null,
  multiple: false,
  relationship: null,
  format: null,
};

describe('Group Field Update - DROPDOWN', () => {
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

  it('deve adicionar nova opcao ao dropdown', async () => {
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
      name: 'Status',
      type: E_FIELD_TYPE.DROPDOWN,
      required: false,
      visibilityList: 'HIDDEN',
      visibilityForm: 'HIDDEN',
      visibilityDetail: 'HIDDEN',
      widthInForm: 50,
      widthInList: 10,
      widthInDetail: null,
      dropdown: [
        { id: '1', label: 'Pendente', color: '#FFA500' },
        { id: '2', label: 'Aprovado', color: '#00FF00' },
        { id: '3', label: 'Rejeitado', color: '#FF0000' },
      ],
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.dropdown).toHaveLength(3);
    expect(result.value.dropdown[2].label).toBe('Rejeitado');
    expect(result.value.dropdown[2].color).toBe('#FF0000');
  });

  it('deve mudar required de false para true', async () => {
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
      name: 'Status',
      type: E_FIELD_TYPE.DROPDOWN,
      required: true,
      visibilityList: 'HIDDEN',
      visibilityForm: 'HIDDEN',
      visibilityDetail: 'HIDDEN',
      widthInForm: 50,
      widthInList: 10,
      widthInDetail: null,
      dropdown: [
        { id: '1', label: 'Pendente', color: '#FFA500' },
        { id: '2', label: 'Aprovado', color: '#00FF00' },
      ],
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.required).toBe(true);
    expect(result.value.type).toBe(E_FIELD_TYPE.DROPDOWN);
  });
});
