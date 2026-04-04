import { beforeEach, describe, expect, it } from 'vitest';

import RowInMemoryRepository from '@application/repositories/row/row-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';
import { makeDropdownField } from '@test/helpers/field-factory.helper';
import { makeTable } from '@test/helpers/table-factory.helper';

import TableRowUpdateUseCase from '../update.use-case';

const DROPDOWN_OPTIONS = [
  { id: '1', label: 'Ativo', color: '#00ff00' },
  { id: '2', label: 'Inativo', color: '#ff0000' },
  { id: '3', label: 'Pendente', color: '#ffaa00' },
];

let tableRepository: TableInMemoryRepository;
let rowRepository: RowInMemoryRepository;
let sut: TableRowUpdateUseCase;

describe('Table Row Update - DROPDOWN', () => {
  beforeEach(() => {
    tableRepository = new TableInMemoryRepository();
    rowRepository = new RowInMemoryRepository();
    sut = new TableRowUpdateUseCase(tableRepository, rowRepository);
  });

  it('deve atualizar row com array de strings valido', async () => {
    const field = makeDropdownField(DROPDOWN_OPTIONS, { slug: 'status' });
    const table = await makeTable(tableRepository, [field], {
      slug: 'tarefas',
    });

    const row = await rowRepository.create({
      table,
      data: { status: ['Ativo'] },
    });

    const result = await sut.execute({
      slug: 'tarefas',
      _id: row._id,
      status: ['Inativo'],
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.status).toEqual(['Inativo']);
  });

  it('deve rejeitar quando valor nao e array', async () => {
    const field = makeDropdownField(DROPDOWN_OPTIONS, { slug: 'status' });
    const table = await makeTable(tableRepository, [field], {
      slug: 'tarefas',
    });

    const row = await rowRepository.create({
      table,
      data: { status: ['Ativo'] },
    });

    const result = await sut.execute({
      slug: 'tarefas',
      _id: row._id,
      status: 'Inativo',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.cause).toBe('INVALID_PAYLOAD_FORMAT');
  });

  it('deve pular validacao de campo omitido (skipMissing)', async () => {
    const field = makeDropdownField(DROPDOWN_OPTIONS, {
      slug: 'status',
      required: true,
    });
    const table = await makeTable(tableRepository, [field], {
      slug: 'tarefas',
    });

    const row = await rowRepository.create({
      table,
      data: { status: ['Ativo'] },
    });

    const result = await sut.execute({
      slug: 'tarefas',
      _id: row._id,
    });

    expect(result.isRight()).toBe(true);
  });
});
