import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  E_FIELD_TYPE,
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
  FIELD_GROUP_NATIVE_LIST,
} from '@application/core/entity.core';
import FieldInMemoryRepository from '@application/repositories/field/field-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';

import TableFieldCreateUseCase from '../create.use-case';

vi.mock('@application/core/util.core', () => ({
  buildTable: vi.fn().mockResolvedValue({}),
  buildSchema: vi.fn().mockReturnValue({}),
}));

let tableRepository: TableInMemoryRepository;
let fieldRepository: FieldInMemoryRepository;
let sut: TableFieldCreateUseCase;

const BASE_PAYLOAD = {
  showInList: true,
  showInForm: true,
  showInDetail: true,
  showInFilter: false,
  locked: false,
  required: false,
  category: [],
  dropdown: [],
  defaultValue: null,
  group: null,
  multiple: false,
  relationship: null,
  widthInForm: 50,
  widthInList: 10,
  widthInDetail: null,
  format: null,
};

describe('Table Field Create - FIELD_GROUP', () => {
  beforeEach(async () => {
    tableRepository = new TableInMemoryRepository();
    fieldRepository = new FieldInMemoryRepository();
    sut = new TableFieldCreateUseCase(tableRepository, fieldRepository);

    await tableRepository.create({
      name: 'Pedidos',
      slug: 'pedidos',
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
  });

  it('deve criar campo FIELD_GROUP e gerar grupo com campos nativos', async () => {
    const createManySpy = vi.spyOn(fieldRepository, 'createMany');

    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'pedidos',
      name: 'Itens',
      type: E_FIELD_TYPE.FIELD_GROUP,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.type).toBe(E_FIELD_TYPE.FIELD_GROUP);
    expect(result.value.group).not.toBeNull();
    expect(result.value.group!.slug).toBe('itens');

    // Deve ter chamado createMany com os campos nativos do grupo
    expect(createManySpy).toHaveBeenCalledOnce();
    expect(createManySpy).toHaveBeenCalledWith(FIELD_GROUP_NATIVE_LIST);
  });

  it('deve adicionar grupo em table.groups', async () => {
    const updateSpy = vi.spyOn(tableRepository, 'update');

    await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'pedidos',
      name: 'Produtos',
      type: E_FIELD_TYPE.FIELD_GROUP,
    });

    expect(updateSpy).toHaveBeenCalledOnce();
    const updatePayload = updateSpy.mock.calls[0][0];

    // Verifica que groups foi passado no update
    expect(updatePayload.groups).toBeDefined();
    expect(updatePayload.groups).toHaveLength(1);
    expect(updatePayload.groups![0].slug).toBe('produtos');
    expect(updatePayload.groups![0].name).toBe('Produtos');
    expect(updatePayload.groups![0].fields).toBeDefined();
    expect(updatePayload.groups![0].fields.length).toBeGreaterThanOrEqual(5);
  });

  it('deve atualizar o campo com group.slug apos criacao', async () => {
    const fieldUpdateSpy = vi.spyOn(fieldRepository, 'update');

    await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'pedidos',
      name: 'Enderecos',
      type: E_FIELD_TYPE.FIELD_GROUP,
    });

    // O use-case faz fieldRepository.update({ _id, group: { slug } })
    expect(fieldUpdateSpy).toHaveBeenCalledOnce();
    const updatePayload = fieldUpdateSpy.mock.calls[0][0];
    expect(updatePayload.group).toEqual({ slug: 'enderecos' });
  });

  it('deve reconstruir tabela via buildTable', async () => {
    const { buildTable } = await import('@application/core/util.core');

    await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'pedidos',
      name: 'Contatos',
      type: E_FIELD_TYPE.FIELD_GROUP,
    });

    expect(buildTable).toHaveBeenCalled();
  });
});
