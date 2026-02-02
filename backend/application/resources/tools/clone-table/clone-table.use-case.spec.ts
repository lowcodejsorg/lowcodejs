import { beforeEach, describe, expect, it, vi } from 'vitest';

import FieldInMemoryRepository from '@application/repositories/field/field-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';

import CloneTableUseCase from './clone-table.use-case';

let tableInMemoryRepository: TableInMemoryRepository;
let fieldInMemoryRepository: FieldInMemoryRepository;
let sut: CloneTableUseCase;

describe('Clone Table Use Case', () => {
  beforeEach(() => {
    tableInMemoryRepository = new TableInMemoryRepository();
    fieldInMemoryRepository = new FieldInMemoryRepository();
    sut = new CloneTableUseCase(
      tableInMemoryRepository,
      fieldInMemoryRepository,
    );
  });

  it('deve clonar uma tabela com sucesso', async () => {
    const baseTable = await tableInMemoryRepository.create({
      name: 'Tabela Original',
      slug: 'tabela-original',
      type: 'TABLE',
      configuration: {
        owner: 'owner-id',
        visibility: 'RESTRICTED',
        collaboration: 'RESTRICTED',
        style: 'LIST',
        fields: {
          orderList: [],
          orderForm: [],
        },
      },
    });

    const result = await sut.execute({
      baseTableId: baseTable._id,
      name: 'Tabela Clonada',
      ownerId: 'new-owner-id',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.table.name).toBe('Tabela Clonada');
      expect(result.value.table.slug).toBe('tabela-clonada');
      expect(result.value.table._id).not.toBe(baseTable._id);
    }
  });

  it('deve retornar erro TABLE_NOT_FOUND quando tabela base nao existe', async () => {
    const result = await sut.execute({
      baseTableId: 'non-existent-id',
      name: 'Nova Tabela',
      ownerId: 'owner-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('TABLE_NOT_FOUND');
    }
  });

  it('deve retornar erro CLONE_TABLE_ERROR quando houver falha', async () => {
    vi.spyOn(tableInMemoryRepository, 'findBy').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({
      baseTableId: 'some-id',
      name: 'Nova Tabela',
      ownerId: 'owner-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('CLONE_TABLE_ERROR');
    }
  });

  it('deve gerar novo owner na tabela clonada', async () => {
    const baseTable = await tableInMemoryRepository.create({
      name: 'Tabela Original',
      slug: 'tabela-original',
      type: 'TABLE',
      configuration: {
        owner: 'old-owner-id',
        visibility: 'RESTRICTED',
        collaboration: 'RESTRICTED',
        style: 'LIST',
        fields: {
          orderList: [],
          orderForm: [],
        },
      },
    });

    const result = await sut.execute({
      baseTableId: baseTable._id,
      name: 'Tabela Clonada',
      ownerId: 'new-owner-id',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.table.configuration.owner).toEqual({
        _id: 'new-owner-id',
      });
    }
  });
});
