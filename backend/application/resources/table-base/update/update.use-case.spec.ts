import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
} from '@application/core/entity.core';
import FieldInMemoryRepository from '@application/repositories/field/field-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';
import UserInMemoryRepository from '@application/repositories/user/user-in-memory.repository';

import TableUpdateUseCase from './update.use-case';

vi.mock('@application/core/util.core', () => ({
  buildTable: vi.fn().mockResolvedValue({}),
  buildSchema: vi.fn().mockReturnValue({}),
}));

let tableInMemoryRepository: TableInMemoryRepository;
let userInMemoryRepository: UserInMemoryRepository;
let fieldInMemoryRepository: FieldInMemoryRepository;
let sut: TableUpdateUseCase;

describe('Table Update Use Case', () => {
  beforeEach(() => {
    tableInMemoryRepository = new TableInMemoryRepository();
    userInMemoryRepository = new UserInMemoryRepository();
    fieldInMemoryRepository = new FieldInMemoryRepository();
    sut = new TableUpdateUseCase(
      tableInMemoryRepository,
      userInMemoryRepository,
      fieldInMemoryRepository,
    );
  });

  it('deve atualizar tabela com sucesso', async () => {
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
      configuration: {
        style: E_TABLE_STYLE.GALLERY,
        administrators: [],
        collaboration: E_TABLE_COLLABORATION.RESTRICTED,
        fields: {
          orderForm: [],
          orderList: [],
        },
        visibility: E_TABLE_VISIBILITY.RESTRICTED,
      },
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.name).toBe('Clientes Atualizado');
      expect(result.value.configuration.style).toBe(E_TABLE_STYLE.GALLERY);
    }
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
      configuration: {
        style: E_TABLE_STYLE.GALLERY,
        administrators: [],
        collaboration: E_TABLE_COLLABORATION.RESTRICTED,
        fields: {
          orderForm: [],
          orderList: [],
        },
        visibility: E_TABLE_VISIBILITY.RESTRICTED,
      },
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('TABLE_NOT_FOUND');
    }
  });

  it('deve retornar erro INACTIVE_ADMINISTRATORS quando admin estiver inativo', async () => {
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
      configuration: {
        style: E_TABLE_STYLE.GALLERY,
        administrators: ['non-existent-user'],
        collaboration: E_TABLE_COLLABORATION.RESTRICTED,
        fields: {
          orderForm: [],
          orderList: [],
        },
        visibility: E_TABLE_VISIBILITY.RESTRICTED,
      },
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(400);
      expect(result.value.cause).toBe('INACTIVE_ADMINISTRATORS');
    }
  });

  it('deve retornar erro UPDATE_TABLE_ERROR quando houver falha', async () => {
    vi.spyOn(tableInMemoryRepository, 'findBy').mockRejectedValueOnce(
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
      configuration: {
        style: E_TABLE_STYLE.GALLERY,
        administrators: ['non-existent-user'],
        collaboration: E_TABLE_COLLABORATION.RESTRICTED,
        fields: {
          orderForm: [],
          orderList: [],
        },
        visibility: E_TABLE_VISIBILITY.RESTRICTED,
      },
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('UPDATE_TABLE_ERROR');
    }
  });
});
