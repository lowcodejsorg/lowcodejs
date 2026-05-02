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

import GroupFieldCreateUseCase from '../create.use-case';

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
  showInList: true,
  showInForm: true,
  showInDetail: true,
  showInFilter: false,
  locked: false,
  required: false,
  category: [],
  defaultValue: null,
  group: null,
  multiple: false,
  relationship: null,
  format: null,
  widthInForm: 50,
  widthInList: 10,
  widthInDetail: null,
};

describe('Group Field Create - DROPDOWN', () => {
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

  it('deve criar campo DROPDOWN com opcoes no grupo', async () => {
    const result = await sut.execute({
      ...FIELD_PAYLOAD_BASE,
      slug: 'pedidos',
      groupSlug: 'itens',
      name: 'Status',
      type: E_FIELD_TYPE.DROPDOWN,
      dropdown: [
        { id: '1', label: 'Pendente', color: '#FFA500' },
        { id: '2', label: 'Aprovado', color: '#00FF00' },
        { id: '3', label: 'Rejeitado', color: '#FF0000' },
      ],
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.type).toBe(E_FIELD_TYPE.DROPDOWN);
    expect(result.value.dropdown).toHaveLength(3);
    expect(result.value.dropdown[0].label).toBe('Pendente');
    expect(result.value.dropdown[0].color).toBe('#FFA500');
  });

  it('deve criar campo DROPDOWN com opcoes sem cor no grupo', async () => {
    const result = await sut.execute({
      ...FIELD_PAYLOAD_BASE,
      slug: 'pedidos',
      groupSlug: 'itens',
      name: 'Prioridade',
      type: E_FIELD_TYPE.DROPDOWN,
      dropdown: [
        { id: '1', label: 'Baixa' },
        { id: '2', label: 'Media' },
        { id: '3', label: 'Alta' },
      ],
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.type).toBe(E_FIELD_TYPE.DROPDOWN);
    expect(result.value.dropdown).toHaveLength(3);
    expect(result.value.dropdown[1].label).toBe('Media');
  });

  it('deve criar campo DROPDOWN required no grupo', async () => {
    const result = await sut.execute({
      ...FIELD_PAYLOAD_BASE,
      slug: 'pedidos',
      groupSlug: 'itens',
      name: 'Tipo Item',
      type: E_FIELD_TYPE.DROPDOWN,
      dropdown: [
        { id: '1', label: 'Produto', color: '#0000FF' },
        { id: '2', label: 'Servico', color: '#FF00FF' },
      ],
      required: true,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.required).toBe(true);
    expect(result.value.type).toBe(E_FIELD_TYPE.DROPDOWN);
  });

  it('deve rejeitar campo DROPDOWN com opcoes duplicadas por nome no grupo', async () => {
    const result = await sut.execute({
      ...FIELD_PAYLOAD_BASE,
      slug: 'pedidos',
      groupSlug: 'itens',
      name: 'Status duplicado',
      type: E_FIELD_TYPE.DROPDOWN,
      dropdown: [
        { id: '1', label: 'Pendente' },
        { id: '2', label: ' pendente ' },
      ],
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.cause).toBe('DROPDOWN_OPTION_ALREADY_EXISTS');
  });
});
