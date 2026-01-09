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

import TableFieldCreateUseCase from './create.use-case';

vi.mock('@application/core/util.core', () => ({
  buildTable: vi.fn().mockResolvedValue({}),
  buildSchema: vi.fn().mockReturnValue({}),
}));

let tableInMemoryRepository: TableInMemoryRepository;
let fieldInMemoryRepository: FieldInMemoryRepository;
let sut: TableFieldCreateUseCase;

describe('Table Field Create Use Case', () => {
  beforeEach(() => {
    tableInMemoryRepository = new TableInMemoryRepository();
    fieldInMemoryRepository = new FieldInMemoryRepository();
    sut = new TableFieldCreateUseCase(
      tableInMemoryRepository,
      fieldInMemoryRepository,
    );
  });

  it('deve criar campo com sucesso', async () => {
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
      name: 'Nome',
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

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.name).toBe('Nome');
      expect(result.value.slug).toBe('nome');
      expect(result.value.type).toBe(E_FIELD_TYPE.TEXT_SHORT);
    }
  });

  it('deve retornar erro TABLE_NOT_FOUND quando tabela nao existir', async () => {
    const result = await sut.execute({
      slug: 'non-existent',
      name: 'Nome',
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

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('TABLE_NOT_FOUND');
    }
  });

  it('deve retornar erro FIELD_ALREADY_EXIST quando campo ja existir', async () => {
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
      fields: [field] as any,
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
      name: 'Nome',
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

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(409);
      expect(result.value.cause).toBe('FIELD_ALREADY_EXIST');
    }
  });

  it('deve retornar erro CREATE_FIELD_ERROR quando houver falha', async () => {
    vi.spyOn(tableInMemoryRepository, 'findBy').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({
      slug: 'some-slug',
      name: 'Nome',
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

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('CREATE_FIELD_ERROR');
    }
  });
});
