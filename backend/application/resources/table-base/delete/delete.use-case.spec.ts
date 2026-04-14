import { beforeEach, describe, expect, it } from 'vitest';

import {
  E_ROLE,
  E_TABLE_STYLE,
  E_USER_STATUS,
  type IGroup,
} from '@application/core/entity.core';
import FieldInMemoryRepository from '@application/repositories/field/field-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';
import UserInMemoryRepository from '@application/repositories/user/user-in-memory.repository';
import GroupResolutionService from '@application/services/group-resolution/group-resolution.service';

import TableDeleteUseCase from './delete.use-case';

let tableInMemoryRepository: TableInMemoryRepository;
let fieldInMemoryRepository: FieldInMemoryRepository;
let userInMemoryRepository: UserInMemoryRepository;
let groupResolutionService: GroupResolutionService;
let sut: TableDeleteUseCase;
let masterUserId: string;

const MASTER_GROUP: IGroup = {
  _id: 'master-group-id',
  name: 'Master',
  slug: E_ROLE.MASTER,
  description: '',
  permissions: [],
  encompasses: [],
  systemPermissions: {
    VIEW_TABLES: true,
    CREATE_TABLES: true,
    UPDATE_TABLES: true,
    REMOVE_TABLES: true,
    USERS: true,
    MENU: true,
    USER_GROUPS: true,
    SETTINGS: true,
    TOOLS: true,
    PLUGINS: true,
  },
  immutable: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  trashed: false,
  trashedAt: null,
};

describe('Table Delete Use Case', () => {
  beforeEach(async () => {
    tableInMemoryRepository = new TableInMemoryRepository();
    fieldInMemoryRepository = new FieldInMemoryRepository();
    userInMemoryRepository = new UserInMemoryRepository();
    groupResolutionService = new GroupResolutionService();

    const created = await userInMemoryRepository.create({
      name: 'Master',
      email: 'master@test.com',
      password: 'hash',
      groups: [MASTER_GROUP._id],
    });
    created.groups = [MASTER_GROUP];
    created.status = E_USER_STATUS.ACTIVE;
    masterUserId = created._id;

    sut = new TableDeleteUseCase(
      tableInMemoryRepository,
      fieldInMemoryRepository,
      userInMemoryRepository,
      groupResolutionService,
    );
  });

  it('deve deletar tabela com sucesso', async () => {
    const created = await tableInMemoryRepository.create({
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
      _currentUserId: masterUserId,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');

    expect(result.value).toBeNull();
    const found = await tableInMemoryRepository.findById(created._id);
    expect(found).toBeNull();
  });

  it('deve retornar erro TABLE_NOT_FOUND quando tabela nao existir', async () => {
    const result = await sut.execute({
      slug: 'non-existent',
      _currentUserId: masterUserId,
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');

    expect(result.value.code).toBe(404);
    expect(result.value.cause).toBe('TABLE_NOT_FOUND');
    expect(result.value.message).toBe('Tabela não encontrada');
  });

  it('deve retornar erro DELETE_TABLE_ERROR quando houver falha', async () => {
    tableInMemoryRepository.simulateError(
      'findBySlug',
      new Error('Database error'),
    );

    const result = await sut.execute({
      slug: 'some-slug',
      _currentUserId: masterUserId,
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');

    expect(result.value.code).toBe(500);
    expect(result.value.cause).toBe('DELETE_TABLE_ERROR');
    expect(result.value.message).toBe('Erro interno do servidor');
  });
});
