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
  defaultValue: null,
  group: null,
  multiple: false,
  relationship: null,
  widthInForm: 50,
  widthInList: 10,
  widthInDetail: null,
  format: null,
};

describe('Table Field Create - DROPDOWN', () => {
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
      name: 'Tarefas',
      slug: 'tarefas',
      _schema: {},
      fields: [],
      owner: 'owner-id',
      style: E_TABLE_STYLE.LIST,
      viewTable: 'NOBODY',
      fieldOrderList: [],
      fieldOrderForm: [],
    });
  });

  it('deve criar campo DROPDOWN com opcoes', async () => {
    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'tarefas',
      name: 'Status',
      type: E_FIELD_TYPE.DROPDOWN,
      dropdown: [
        { id: '1', label: 'Ativo' },
        { id: '2', label: 'Inativo' },
      ],
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.type).toBe(E_FIELD_TYPE.DROPDOWN);
    expect(result.value.dropdown).toHaveLength(2);
    expect(result.value.dropdown[0].label).toBe('Ativo');
  });

  it('deve criar campo DROPDOWN com cores nas opcoes', async () => {
    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'tarefas',
      name: 'Prioridade',
      type: E_FIELD_TYPE.DROPDOWN,
      dropdown: [
        { id: '1', label: 'Alta', color: '#ff0000' },
        { id: '2', label: 'Media', color: '#ffaa00' },
        { id: '3', label: 'Baixa', color: '#00ff00' },
      ],
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.dropdown[0].color).toBe('#ff0000');
    expect(result.value.dropdown[2].color).toBe('#00ff00');
  });

  it('deve criar campo DROPDOWN required=true', async () => {
    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'tarefas',
      name: 'Tipo',
      type: E_FIELD_TYPE.DROPDOWN,
      dropdown: [{ id: '1', label: 'Bug' }],
      required: true,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.required).toBe(true);
  });
});
