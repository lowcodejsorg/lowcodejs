import { beforeEach, describe, expect, it } from 'vitest';

import { E_FIELD_FORMAT } from '@application/core/entity.core';
import RowInMemoryRepository from '@application/repositories/row/row-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';
import {
  makeDateField,
  makeTextShortWithFormat,
} from '@test/helpers/field-factory.helper';
import { makeTableWithGroup } from '@test/helpers/table-factory.helper';

import TableRowCreateUseCase from '../create.use-case';

let tableRepository: TableInMemoryRepository;
let rowRepository: RowInMemoryRepository;
let sut: TableRowCreateUseCase;

describe('Table Row Create - FIELD_GROUP', () => {
  beforeEach(() => {
    tableRepository = new TableInMemoryRepository();
    rowRepository = new RowInMemoryRepository();
    sut = new TableRowCreateUseCase(tableRepository, rowRepository);
  });

  it('deve criar row com array de objetos validos para o grupo', async () => {
    const nomeField = makeTextShortWithFormat(E_FIELD_FORMAT.ALPHA_NUMERIC, {
      slug: 'nome',
      name: 'Nome',
    });
    await makeTableWithGroup(tableRepository, 'itens', [nomeField], [], {
      slug: 'pedidos',
    });

    const result = await sut.execute({
      slug: 'pedidos',
      itens: [{ nome: 'Item 1' }, { nome: 'Item 2' }],
      creator: 'user-id',
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.itens).toHaveLength(2);
  });

  it('deve validar campos internos do grupo', async () => {
    const emailField = makeTextShortWithFormat(E_FIELD_FORMAT.EMAIL, {
      slug: 'email',
      name: 'Email',
      required: true,
    });
    await makeTableWithGroup(tableRepository, 'contatos', [emailField], [], {
      slug: 'empresa',
    });

    const result = await sut.execute({
      slug: 'empresa',
      contatos: [{ email: 'invalido' }],
      creator: 'user-id',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.cause).toBe('INVALID_PAYLOAD_FORMAT');
  });

  it('deve rejeitar campo required ausente no grupo', async () => {
    const nomeField = makeTextShortWithFormat(E_FIELD_FORMAT.ALPHA_NUMERIC, {
      slug: 'nome',
      name: 'Nome',
      required: true,
    });
    await makeTableWithGroup(tableRepository, 'itens', [nomeField], [], {
      slug: 'pedidos',
    });

    const result = await sut.execute({
      slug: 'pedidos',
      itens: [{}],
      creator: 'user-id',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.cause).toBe('INVALID_PAYLOAD_FORMAT');
  });

  it('deve rejeitar quando valor nao e array', async () => {
    const nomeField = makeTextShortWithFormat(E_FIELD_FORMAT.ALPHA_NUMERIC, {
      slug: 'nome',
    });
    await makeTableWithGroup(tableRepository, 'itens', [nomeField], [], {
      slug: 'pedidos',
    });

    const result = await sut.execute({
      slug: 'pedidos',
      itens: 'nao-e-array',
      creator: 'user-id',
    });

    expect(result.isLeft()).toBe(true);
  });

  it('deve rejeitar quando itens nao sao objetos', async () => {
    const nomeField = makeTextShortWithFormat(E_FIELD_FORMAT.ALPHA_NUMERIC, {
      slug: 'nome',
    });
    await makeTableWithGroup(tableRepository, 'itens', [nomeField], [], {
      slug: 'pedidos',
    });

    const result = await sut.execute({
      slug: 'pedidos',
      itens: ['nao-e-objeto', 123],
      creator: 'user-id',
    });

    expect(result.isLeft()).toBe(true);
  });

  it('deve validar multiplos tipos de campo dentro do grupo', async () => {
    const nomeField = makeTextShortWithFormat(E_FIELD_FORMAT.ALPHA_NUMERIC, {
      slug: 'nome',
      name: 'Nome',
    });
    const dataField = makeDateField({
      slug: 'data',
      name: 'Data',
    });
    await makeTableWithGroup(
      tableRepository,
      'historico',
      [nomeField, dataField],
      [],
      { slug: 'registro' },
    );

    const result = await sut.execute({
      slug: 'registro',
      historico: [
        { nome: 'Evento 1', data: '2024-01-15T10:00:00.000Z' },
        { nome: 'Evento 2', data: 'data-invalida' },
      ],
      creator: 'user-id',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.cause).toBe('INVALID_PAYLOAD_FORMAT');
  });

  it('deve aceitar grupo com itens validos mistos', async () => {
    const nomeField = makeTextShortWithFormat(E_FIELD_FORMAT.ALPHA_NUMERIC, {
      slug: 'nome',
      name: 'Nome',
    });
    const dataField = makeDateField({
      slug: 'data',
      name: 'Data',
    });
    await makeTableWithGroup(
      tableRepository,
      'historico',
      [nomeField, dataField],
      [],
      { slug: 'registro' },
    );

    const result = await sut.execute({
      slug: 'registro',
      historico: [
        { nome: 'Evento 1', data: '2024-01-15T10:00:00.000Z' },
        { nome: 'Evento 2', data: '2024-06-20T14:30:00.000Z' },
      ],
      creator: 'user-id',
    });

    expect(result.isRight()).toBe(true);
  });

  it('deve aceitar array vazio quando nao required', async () => {
    const nomeField = makeTextShortWithFormat(E_FIELD_FORMAT.ALPHA_NUMERIC, {
      slug: 'nome',
    });
    await makeTableWithGroup(tableRepository, 'itens', [nomeField], [], {
      slug: 'pedidos',
    });

    const result = await sut.execute({
      slug: 'pedidos',
      itens: [],
      creator: 'user-id',
    });

    expect(result.isRight()).toBe(true);
  });
});
