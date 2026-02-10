import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  E_FIELD_TYPE,
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
} from '@application/core/entity.core';
import FieldInMemoryRepository from '@application/repositories/field/field-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';

import TableCreateUseCase from './create.use-case';

let fieldInMemoryRepository: FieldInMemoryRepository;
let tableInMemoryRepository: TableInMemoryRepository;
let sut: TableCreateUseCase;

describe('Table Create Use Case', () => {
  beforeEach(() => {
    tableInMemoryRepository = new TableInMemoryRepository();
    fieldInMemoryRepository = new FieldInMemoryRepository();
    sut = new TableCreateUseCase(
      tableInMemoryRepository,
      fieldInMemoryRepository,
    );
  });

  it('deve criar tabela com sucesso', async () => {
    const result = await sut.execute({
      name: 'Clientes',
      owner: 'owner-id',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.name).toBe('Clientes');
      expect(result.value.slug).toBe('clientes');

      // Deve criar 5 campos nativos com tipos corretos
      const fields = result.value.fields;
      expect(fields).toHaveLength(5);

      const idField = fields.find((f) => f.slug === '_id');
      expect(idField).toBeDefined();
      expect(idField!.type).toBe(E_FIELD_TYPE.IDENTIFIER);
      expect(idField!.native).toBe(true);
      expect(idField!.locked).toBe(true);

      const creatorField = fields.find((f) => f.slug === 'creator');
      expect(creatorField).toBeDefined();
      expect(creatorField!.type).toBe(E_FIELD_TYPE.CREATOR);
      expect(creatorField!.native).toBe(true);
      expect(creatorField!.locked).toBe(true);

      const createdAtField = fields.find((f) => f.slug === 'createdAt');
      expect(createdAtField).toBeDefined();
      expect(createdAtField!.type).toBe(E_FIELD_TYPE.CREATED_AT);
      expect(createdAtField!.native).toBe(true);
      expect(createdAtField!.locked).toBe(true);

      const trashedField = fields.find((f) => f.slug === 'trashed');
      expect(trashedField).toBeDefined();
      expect(trashedField!.type).toBe(E_FIELD_TYPE.TRASHED);
      expect(trashedField!.native).toBe(true);
      expect(trashedField!.locked).toBe(true);

      const trashedAtField = fields.find((f) => f.slug === 'trashedAt');
      expect(trashedAtField).toBeDefined();
      expect(trashedAtField!.type).toBe(E_FIELD_TYPE.TRASHED_AT);
      expect(trashedAtField!.native).toBe(true);
      expect(trashedAtField!.locked).toBe(true);

    }
  });

  it('deve retornar erro OWNER_REQUIRED quando owner nao for informado', async () => {
    const result = await sut.execute({
      name: 'Clientes',
      owner: '',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(400);
      expect(result.value.cause).toBe('OWNER_REQUIRED');
    }
  });

  it('deve retornar erro TABLE_ALREADY_EXISTS quando tabela ja existir', async () => {
    await tableInMemoryRepository.create({
      name: 'Clientes',
      slug: 'clientes',
      _schema: {},
      fields: [],
      owner: 'owner-id',
      administrators: [],
      style: E_TABLE_STYLE.LIST,
      visibility: E_TABLE_VISIBILITY.RESTRICTED,
      collaboration: E_TABLE_COLLABORATION.RESTRICTED,
      fieldOrderList: [],
      fieldOrderForm: [],
    });

    const result = await sut.execute({
      name: 'Clientes',
      owner: 'owner-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(409);
      expect(result.value.cause).toBe('TABLE_ALREADY_EXISTS');
    }
  });

  it('deve retornar erro CREATE_TABLE_ERROR quando houver falha', async () => {
    vi.spyOn(tableInMemoryRepository, 'findBy').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({
      name: 'Clientes',
      owner: 'owner-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('CREATE_TABLE_ERROR');
    }
  });
});
