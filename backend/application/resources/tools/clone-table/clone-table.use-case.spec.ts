import { beforeEach, describe, expect, it } from 'vitest';

import FieldInMemoryRepository from '@application/repositories/field/field-in-memory.repository';
import RowInMemoryRepository from '@application/repositories/row/row-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';
import TableSchemaInMemoryService from '@application/services/table-schema/table-schema-in-memory.service';

import CloneTableUseCase from './clone-table.use-case';

let tableInMemoryRepository: TableInMemoryRepository;
let fieldInMemoryRepository: FieldInMemoryRepository;
let rowInMemoryRepository: RowInMemoryRepository;
let tableSchemaService: TableSchemaInMemoryService;
let sut: CloneTableUseCase;

describe('Clone Table Use Case', () => {
  beforeEach(() => {
    tableInMemoryRepository = new TableInMemoryRepository();
    fieldInMemoryRepository = new FieldInMemoryRepository();
    rowInMemoryRepository = new RowInMemoryRepository();

    tableSchemaService = new TableSchemaInMemoryService();

    sut = new CloneTableUseCase(
      tableInMemoryRepository,
      fieldInMemoryRepository,
      rowInMemoryRepository,
      tableSchemaService,
    );
  });

  it('deve clonar uma tabela com sucesso', async () => {
    const baseTable = await tableInMemoryRepository.create({
      name: 'Tabela Original',
      slug: 'tabela-original',
      type: 'TABLE',
      owner: 'owner-id',
      viewTable: 'NOBODY',
      style: 'LIST',
      fieldOrderList: [],
      fieldOrderForm: [],
    });

    const result = await sut.execute({
      baseTableId: baseTable._id,
      name: 'Tabela Clonada',
      ownerId: 'new-owner-id',
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');

    expect(result.value.table.name).toBe('Tabela Clonada');
    expect(result.value.table.slug).toBe('tabela-clonada');
    expect(result.value.table._id).not.toBe(baseTable._id);
  });

  it('deve retornar erro TABLE_NOT_FOUND quando tabela base nao existe', async () => {
    const result = await sut.execute({
      baseTableId: 'non-existent-id',
      name: 'Nova Tabela',
      ownerId: 'owner-id',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');

    expect(result.value.code).toBe(404);
    expect(result.value.cause).toBe('TABLE_NOT_FOUND');
    expect(result.value.message).toBe('Tabela base não encontrada');
  });

  it('deve retornar erro CLONE_TABLE_ERROR quando houver falha', async () => {
    tableInMemoryRepository.simulateError(
      'findById',
      new Error('Database error'),
    );

    const result = await sut.execute({
      baseTableId: 'some-id',
      name: 'Nova Tabela',
      ownerId: 'owner-id',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');

    expect(result.value.code).toBe(500);
    expect(result.value.cause).toBe('CLONE_TABLE_ERROR');
    expect(result.value.message).toBe('Erro ao clonar tabela');
  });

  it('deve gerar novo owner na tabela clonada', async () => {
    const baseTable = await tableInMemoryRepository.create({
      name: 'Tabela Original',
      slug: 'tabela-original',
      type: 'TABLE',
      owner: 'old-owner-id',
      viewTable: 'NOBODY',
      style: 'LIST',
      fieldOrderList: [],
      fieldOrderForm: [],
    });

    const result = await sut.execute({
      baseTableId: baseTable._id,
      name: 'Tabela Clonada',
      ownerId: 'new-owner-id',
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');

    expect(result.value.table.owner).toEqual({
      _id: 'new-owner-id',
    });
  });

  it('deve retornar erro OWNER_ID_REQUIRED quando ownerId nao for informado', async () => {
    const result = await sut.execute({
      baseTableId: 'some-id',
      name: 'Nova Tabela',
      ownerId: '',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');

    expect(result.value.code).toBe(400);
    expect(result.value.cause).toBe('OWNER_ID_REQUIRED');
    expect(result.value.message).toBe('Owner ID é obrigatório');
  });
});
