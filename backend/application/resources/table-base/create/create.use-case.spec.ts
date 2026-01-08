import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
} from '@application/core/entity.core';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';

import TableCreateUseCase from './create.use-case';

let tableInMemoryRepository: TableInMemoryRepository;
let sut: TableCreateUseCase;

describe('Table Create Use Case', () => {
  beforeEach(() => {
    tableInMemoryRepository = new TableInMemoryRepository();
    sut = new TableCreateUseCase(tableInMemoryRepository);
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
