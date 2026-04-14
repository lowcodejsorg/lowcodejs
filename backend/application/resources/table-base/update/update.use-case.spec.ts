import { beforeEach, describe, expect, it } from 'vitest';

import { E_TABLE_STYLE } from '@application/core/entity.core';
import FieldInMemoryRepository from '@application/repositories/field/field-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';
import UserInMemoryRepository from '@application/repositories/user/user-in-memory.repository';
import TableSchemaInMemoryService from '@application/services/table-schema/table-schema-in-memory.service';

import TableUpdateUseCase from './update.use-case';

let tableInMemoryRepository: TableInMemoryRepository;
let userInMemoryRepository: UserInMemoryRepository;
let fieldInMemoryRepository: FieldInMemoryRepository;
let tableSchemaService: TableSchemaInMemoryService;
let sut: TableUpdateUseCase;

describe('Table Update Use Case', () => {
  beforeEach(() => {
    tableInMemoryRepository = new TableInMemoryRepository();
    userInMemoryRepository = new UserInMemoryRepository();
    fieldInMemoryRepository = new FieldInMemoryRepository();
    tableSchemaService = new TableSchemaInMemoryService();

    sut = new TableUpdateUseCase(
      tableInMemoryRepository,
      userInMemoryRepository,
      fieldInMemoryRepository,
      tableSchemaService,
    );
  });

  it('deve atualizar tabela com sucesso', async () => {
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
      fieldOrderFilter: [],
      fieldOrderDetail: [],
    });

    const result = await sut.execute({
      slug: 'clientes',
      name: 'Clientes Atualizado',
      description: 'Tabela de clientes',
      logo: 'logo-url',
      methods: {
        afterSave: {
          code: null,
        },
        beforeSave: {
          code: null,
        },
        onLoad: {
          code: null,
        },
      },
      style: E_TABLE_STYLE.GALLERY,
      viewTable: 'NOBODY',
      fieldOrderForm: [],
      fieldOrderList: [],
      fieldOrderFilter: [],
      fieldOrderDetail: [],
      order: null,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');

    expect(result.value.name).toBe('Clientes Atualizado');
    expect(result.value.style).toBe(E_TABLE_STYLE.GALLERY);
  });

  it('deve retornar erro TABLE_NOT_FOUND quando tabela nao existir', async () => {
    const result = await sut.execute({
      slug: 'non-existent',
      name: 'Test',
      description: 'Tabela de clientes',
      logo: 'logo-url',
      methods: {
        afterSave: {
          code: null,
        },
        beforeSave: {
          code: null,
        },
        onLoad: {
          code: null,
        },
      },
      style: E_TABLE_STYLE.GALLERY,
      viewTable: 'NOBODY',
      fieldOrderForm: [],
      fieldOrderList: [],
      fieldOrderFilter: [],
      fieldOrderDetail: [],
      order: null,
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');

    expect(result.value.code).toBe(404);
    expect(result.value.cause).toBe('TABLE_NOT_FOUND');
    expect(result.value.message).toBe('Tabela não encontrada');
  });

  it('deve retornar erro INACTIVE_COLLABORATORS quando colaborador estiver inativo', async () => {
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
      fieldOrderFilter: [],
      fieldOrderDetail: [],
    });

    const result = await sut.execute({
      slug: 'clientes',
      name: 'Test',
      description: 'Tabela de clientes',
      logo: 'logo-url',
      methods: {
        afterSave: {
          code: null,
        },
        beforeSave: {
          code: null,
        },
        onLoad: {
          code: null,
        },
      },
      style: E_TABLE_STYLE.GALLERY,
      collaborators: [{ user: 'inactive-user-id', profile: 'ADMIN' }],
      fieldOrderForm: [],
      fieldOrderList: [],
      fieldOrderFilter: [],
      fieldOrderDetail: [],
      order: null,
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');

    expect(result.value.code).toBe(400);
    expect(result.value.cause).toBe('INACTIVE_COLLABORATORS');
    expect(result.value.message).toBe(
      'Todos os colaboradores devem ser usuários ativos',
    );
  });

  it('deve retornar erro UPDATE_TABLE_ERROR quando houver falha', async () => {
    tableInMemoryRepository.simulateError(
      'findBySlug',
      new Error('Database error'),
    );

    const result = await sut.execute({
      slug: 'some-slug',
      name: 'Test',
      description: 'Tabela de clientes',
      logo: 'logo-url',
      methods: {
        afterSave: {
          code: null,
        },
        beforeSave: {
          code: null,
        },
        onLoad: {
          code: null,
        },
      },
      style: E_TABLE_STYLE.GALLERY,
      fieldOrderForm: [],
      fieldOrderList: [],
      fieldOrderFilter: [],
      fieldOrderDetail: [],
      order: null,
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');

    expect(result.value.code).toBe(500);
    expect(result.value.cause).toBe('UPDATE_TABLE_ERROR');
    expect(result.value.message).toBe('Erro interno do servidor');
  });
});
