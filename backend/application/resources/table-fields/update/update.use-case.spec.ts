import { beforeEach, describe, expect, it } from 'vitest';

import {
  E_FIELD_FORMAT,
  E_FIELD_TYPE,
  E_TABLE_STYLE,
} from '@application/core/entity.core';
import FieldInMemoryRepository from '@application/repositories/field/field-in-memory.repository';
import RowInMemoryRepository from '@application/repositories/row/row-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';
import TableSchemaInMemoryService from '@application/services/table-schema/table-schema-in-memory.service';

import TableFieldUpdateUseCase from './update.use-case';

let tableInMemoryRepository: TableInMemoryRepository;
let fieldInMemoryRepository: FieldInMemoryRepository;
let rowInMemoryRepository: RowInMemoryRepository;
let tableSchemaService: TableSchemaInMemoryService;
let sut: TableFieldUpdateUseCase;

describe('Table Field Update Use Case', () => {
  beforeEach(() => {
    tableInMemoryRepository = new TableInMemoryRepository();
    fieldInMemoryRepository = new FieldInMemoryRepository();
    rowInMemoryRepository = new RowInMemoryRepository();

    tableSchemaService = new TableSchemaInMemoryService();

    sut = new TableFieldUpdateUseCase(
      tableInMemoryRepository,
      fieldInMemoryRepository,
      rowInMemoryRepository,
      tableSchemaService,
    );
  });

  it('deve atualizar campo com sucesso', async () => {
    const field = await fieldInMemoryRepository.create({
      name: 'Nome',
      slug: 'nome',
      type: E_FIELD_TYPE.TEXT_SHORT,
      visibilityList: 'HIDDEN',
      visibilityForm: 'HIDDEN',
      visibilityDetail: 'HIDDEN',
      locked: false,
      native: false,
      required: true,
      category: [],
      dropdown: [],
      defaultValue: null,
      format: E_FIELD_FORMAT.ALPHA_NUMERIC,
      group: null,
      multiple: false,
      relationship: null,
      widthInForm: null,
      widthInList: null,
      widthInDetail: null,
    });

    await tableInMemoryRepository.create({
      name: 'Clientes',
      slug: 'clientes',
      _schema: {},
      fields: [field._id],
      owner: 'owner-id',
      style: E_TABLE_STYLE.LIST,
      viewTable: 'NOBODY',
      fieldOrderList: [],
      fieldOrderForm: [],
    });

    const result = await sut.execute({
      slug: 'clientes',
      _id: field._id,
      name: 'Nome Atualizado',
      type: E_FIELD_TYPE.TEXT_SHORT,
      visibilityList: 'HIDDEN',
      visibilityForm: 'HIDDEN',
      visibilityDetail: 'HIDDEN',
      locked: false,
      required: false,
      dropdown: [],
      category: [],
      defaultValue: null,
      format: E_FIELD_FORMAT.ALPHA_NUMERIC,
      group: null,
      multiple: false,
      relationship: null,
      trashed: false,
      trashedAt: null,
      widthInForm: 75,
      widthInList: 30,
      widthInDetail: null,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');

    expect(result.value.name).toBe('Nome Atualizado');
    expect(result.value.required).toBe(false);
    expect(result.value.widthInForm).toBe(75);
  });

  it('deve retornar erro TABLE_NOT_FOUND quando tabela nao existir', async () => {
    const result = await sut.execute({
      slug: 'non-existent',
      _id: 'field-id',
      name: 'Nome',
      type: E_FIELD_TYPE.TEXT_SHORT,
      visibilityList: 'HIDDEN',
      visibilityForm: 'HIDDEN',
      visibilityDetail: 'HIDDEN',
      locked: false,
      required: false,
      dropdown: [],
      category: [],
      defaultValue: null,
      format: E_FIELD_FORMAT.ALPHA_NUMERIC,
      group: null,
      multiple: false,
      relationship: null,
      trashed: false,
      trashedAt: null,
      widthInForm: null,
      widthInList: null,
      widthInDetail: null,
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');

    expect(result.value.code).toBe(404);
    expect(result.value.cause).toBe('TABLE_NOT_FOUND');
    expect(result.value.message).toBe('Tabela não encontrada');
  });

  it('deve retornar erro FIELD_NOT_FOUND quando campo nao existir', async () => {
    await tableInMemoryRepository.create({
      name: 'Clientes',
      slug: 'clientes',
      _schema: {},
      fields: [],
      owner: 'owner-id',
      style: E_TABLE_STYLE.LIST,
      viewTable: 'NOBODY',
      fieldOrderList: [],
      fieldOrderForm: [],
    });

    const result = await sut.execute({
      slug: 'clientes',
      _id: 'non-existent-field',
      name: 'Nome',
      type: E_FIELD_TYPE.TEXT_SHORT,
      visibilityList: 'HIDDEN',
      visibilityForm: 'HIDDEN',
      visibilityDetail: 'HIDDEN',
      locked: false,
      required: false,
      dropdown: [],
      category: [],
      defaultValue: null,
      format: E_FIELD_FORMAT.ALPHA_NUMERIC,
      group: null,
      multiple: false,
      relationship: null,
      trashed: false,
      trashedAt: null,
      widthInForm: null,
      widthInList: null,
      widthInDetail: null,
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');

    expect(result.value.code).toBe(404);
    expect(result.value.cause).toBe('FIELD_NOT_FOUND');
    expect(result.value.message).toBe('Campo não encontrado');
  });

  it('deve retornar erro LAST_ACTIVE_FIELD quando tentar enviar unico campo para lixeira', async () => {
    const field = await fieldInMemoryRepository.create({
      name: 'Nome',
      slug: 'nome',
      type: E_FIELD_TYPE.TEXT_SHORT,
      visibilityList: 'HIDDEN',
      visibilityForm: 'HIDDEN',
      visibilityDetail: 'HIDDEN',
      locked: false,
      native: false,
      required: false,
      dropdown: [],
      category: [],
      defaultValue: null,
      format: E_FIELD_FORMAT.ALPHA_NUMERIC,
      group: null,
      multiple: false,
      relationship: null,
      widthInForm: null,
      widthInList: null,
      widthInDetail: null,
    });

    await tableInMemoryRepository.create({
      name: 'Clientes',
      slug: 'clientes',
      _schema: {},
      fields: [field._id],
      owner: 'owner-id',
      style: E_TABLE_STYLE.LIST,
      viewTable: 'NOBODY',
      fieldOrderList: [],
      fieldOrderForm: [],
    });

    const result = await sut.execute({
      slug: 'clientes',
      _id: field._id,
      name: 'Nome',
      type: E_FIELD_TYPE.TEXT_SHORT,
      trashed: true,
      visibilityList: 'HIDDEN',
      visibilityForm: 'HIDDEN',
      visibilityDetail: 'HIDDEN',
      locked: false,
      required: false,
      dropdown: [],
      category: [],
      defaultValue: null,
      format: E_FIELD_FORMAT.ALPHA_NUMERIC,
      group: null,
      multiple: false,
      relationship: null,
      trashedAt: null,
      widthInForm: null,
      widthInList: null,
      widthInDetail: null,
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');

    expect(result.value.code).toBe(409);
    expect(result.value.cause).toBe('LAST_ACTIVE_FIELD');
    expect(result.value.message).toBe(
      'Último campo ativo, não pode ser enviado para a lixeira',
    );
  });

  it('deve retornar erro UPDATE_FIELD_TABLE_ERROR quando houver falha', async () => {
    tableInMemoryRepository.simulateError(
      'findBySlug',
      new Error('Database error'),
    );

    const result = await sut.execute({
      slug: 'some-slug',
      _id: 'field-id',
      name: 'Nome',
      type: E_FIELD_TYPE.TEXT_SHORT,
      visibilityList: 'HIDDEN',
      visibilityForm: 'HIDDEN',
      visibilityDetail: 'HIDDEN',
      locked: false,
      required: false,
      dropdown: [],
      category: [],
      defaultValue: null,
      format: E_FIELD_FORMAT.ALPHA_NUMERIC,
      group: null,
      multiple: false,
      relationship: null,
      trashed: false,
      trashedAt: null,
      widthInForm: null,
      widthInList: null,
      widthInDetail: null,
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');

    expect(result.value.code).toBe(500);
    expect(result.value.cause).toBe('UPDATE_FIELD_TABLE_ERROR');
    expect(result.value.message).toBe('Erro interno do servidor');
  });
});
