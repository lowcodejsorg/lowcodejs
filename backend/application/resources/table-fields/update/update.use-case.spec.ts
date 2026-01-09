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

import TableFieldUpdateUseCase from './update.use-case';

vi.mock('@application/core/util.core', () => ({
  buildTable: vi.fn().mockResolvedValue({
    updateMany: vi.fn().mockResolvedValue(undefined),
  }),
  buildSchema: vi.fn().mockReturnValue({}),
}));

let tableInMemoryRepository: TableInMemoryRepository;
let fieldInMemoryRepository: FieldInMemoryRepository;
let sut: TableFieldUpdateUseCase;

describe('Table Field Update Use Case', () => {
  beforeEach(() => {
    tableInMemoryRepository = new TableInMemoryRepository();
    fieldInMemoryRepository = new FieldInMemoryRepository();
    sut = new TableFieldUpdateUseCase(
      tableInMemoryRepository,
      fieldInMemoryRepository,
    );
  });

  it('deve atualizar campo com sucesso', async () => {
    const field = await fieldInMemoryRepository.create({
      name: 'Nome',
      slug: 'nome',
      type: E_FIELD_TYPE.TEXT_SHORT,
      configuration: {
        listing: true,
        filtering: true,
        required: true,
        category: [],
        dropdown: [],
        defaultValue: null,
        format: E_FIELD_FORMAT.ALPHA_NUMERIC,
        group: null,
        multiple: false,
        relationship: null,
      },
    });

    await tableInMemoryRepository.create({
      name: 'Clientes',
      slug: 'clientes',
      _schema: {},
      fields: [field._id],
      configuration: {
        owner: 'owner-id',
        administrators: [],
        style: E_TABLE_STYLE.LIST,
        visibility: E_TABLE_VISIBILITY.RESTRICTED,
        collaboration: E_TABLE_COLLABORATION.RESTRICTED,
        fields: { orderList: [], orderForm: [] },
      },
    });

    const result = await sut.execute({
      slug: 'clientes',
      _id: field._id,
      name: 'Nome Atualizado',
      type: E_FIELD_TYPE.TEXT_SHORT,
      configuration: {
        listing: true,
        filtering: true,
        required: false,
        dropdown: [],
        category: [],
        defaultValue: null,
        format: E_FIELD_FORMAT.ALPHA_NUMERIC,
        group: null,
        multiple: false,
        relationship: null,
      },
      trashed: false,
      trashedAt: null,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.name).toBe('Nome Atualizado');
      expect(result.value.configuration.required).toBe(false);
    }
  });

  it('deve retornar erro TABLE_NOT_FOUND quando tabela nao existir', async () => {
    const result = await sut.execute({
      slug: 'non-existent',
      _id: 'field-id',
      name: 'Nome',
      type: E_FIELD_TYPE.TEXT_SHORT,
      configuration: {
        listing: true,
        filtering: true,
        required: false,
        dropdown: [],
        category: [],
        defaultValue: null,
        format: E_FIELD_FORMAT.ALPHA_NUMERIC,
        group: null,
        multiple: false,
        relationship: null,
      },
      trashed: false,
      trashedAt: null,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('TABLE_NOT_FOUND');
    }
  });

  it('deve retornar erro FIELD_NOT_FOUND quando campo nao existir', async () => {
    await tableInMemoryRepository.create({
      name: 'Clientes',
      slug: 'clientes',
      _schema: {},
      fields: [],
      configuration: {
        owner: 'owner-id',
        administrators: [],
        style: E_TABLE_STYLE.LIST,
        visibility: E_TABLE_VISIBILITY.RESTRICTED,
        collaboration: E_TABLE_COLLABORATION.RESTRICTED,
        fields: { orderList: [], orderForm: [] },
      },
    });

    const result = await sut.execute({
      slug: 'clientes',
      _id: 'non-existent-field',
      name: 'Nome',
      type: E_FIELD_TYPE.TEXT_SHORT,
      configuration: {
        listing: true,
        filtering: true,
        required: false,
        dropdown: [],
        category: [],
        defaultValue: null,
        format: E_FIELD_FORMAT.ALPHA_NUMERIC,
        group: null,
        multiple: false,
        relationship: null,
      },
      trashed: false,
      trashedAt: null,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('FIELD_NOT_FOUND');
    }
  });

  it('deve retornar erro LAST_ACTIVE_FIELD quando tentar enviar unico campo para lixeira', async () => {
    const field = await fieldInMemoryRepository.create({
      name: 'Nome',
      slug: 'nome',
      type: E_FIELD_TYPE.TEXT_SHORT,
      configuration: {
        listing: true,
        filtering: true,
        required: false,
        dropdown: [],
        category: [],
        defaultValue: null,
        format: E_FIELD_FORMAT.ALPHA_NUMERIC,
        group: null,
        multiple: false,
        relationship: null,
      },
    });

    await tableInMemoryRepository.create({
      name: 'Clientes',
      slug: 'clientes',
      _schema: {},
      fields: [field._id],
      configuration: {
        owner: 'owner-id',
        administrators: [],
        style: E_TABLE_STYLE.LIST,
        visibility: E_TABLE_VISIBILITY.RESTRICTED,
        collaboration: E_TABLE_COLLABORATION.RESTRICTED,
        fields: { orderList: [], orderForm: [] },
      },
    });

    const result = await sut.execute({
      slug: 'clientes',
      _id: field._id,
      name: 'Nome',
      type: E_FIELD_TYPE.TEXT_SHORT,
      trashed: true,
      configuration: {
        listing: true,
        filtering: true,
        required: false,
        dropdown: [],
        category: [],
        defaultValue: null,
        format: E_FIELD_FORMAT.ALPHA_NUMERIC,
        group: null,
        multiple: false,
        relationship: null,
      },
      trashedAt: null,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(409);
      expect(result.value.cause).toBe('LAST_ACTIVE_FIELD');
    }
  });

  it('deve retornar erro UPDATE_FIELD_TABLE_ERROR quando houver falha', async () => {
    vi.spyOn(tableInMemoryRepository, 'findBy').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({
      slug: 'some-slug',
      _id: 'field-id',
      name: 'Nome',
      type: E_FIELD_TYPE.TEXT_SHORT,
      configuration: {
        listing: true,
        filtering: true,
        required: false,
        dropdown: [],
        category: [],
        defaultValue: null,
        format: E_FIELD_FORMAT.ALPHA_NUMERIC,
        group: null,
        multiple: false,
        relationship: null,
      },
      trashed: false,
      trashedAt: null,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('UPDATE_FIELD_TABLE_ERROR');
    }
  });
});
