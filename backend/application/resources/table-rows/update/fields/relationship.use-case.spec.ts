import { beforeEach, describe, expect, it } from 'vitest';

import RowInMemoryRepository from '@application/repositories/row/row-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';
import { makeRelationshipField } from '@test/helpers/field-factory.helper';
import { makeTable } from '@test/helpers/table-factory.helper';

import TableRowUpdateUseCase from '../update.use-case';

const VALID_OBJECT_ID = '507f1f77bcf86cd799439011';
const VALID_OBJECT_ID_2 = '507f1f77bcf86cd799439022';

const RELATIONSHIP_CONFIG = {
  table: { _id: '507f1f77bcf86cd799439099', slug: 'produtos' },
  field: { _id: '507f1f77bcf86cd799439088', slug: 'nome' },
  order: 'asc' as const,
};

let tableRepository: TableInMemoryRepository;
let rowRepository: RowInMemoryRepository;
let sut: TableRowUpdateUseCase;

describe('Table Row Update - RELATIONSHIP', () => {
  beforeEach(() => {
    tableRepository = new TableInMemoryRepository();
    rowRepository = new RowInMemoryRepository();
    sut = new TableRowUpdateUseCase(tableRepository, rowRepository);
  });

  it('deve atualizar row com array de ObjectIds validos', async () => {
    const field = makeRelationshipField(RELATIONSHIP_CONFIG, {
      slug: 'produtos',
    });
    const table = await makeTable(tableRepository, [field], {
      slug: 'pedidos',
    });

    const row = await rowRepository.create({
      table,
      data: { produtos: [VALID_OBJECT_ID] },
    });

    const result = await sut.execute({
      slug: 'pedidos',
      _id: row._id,
      produtos: [VALID_OBJECT_ID_2],
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.produtos).toEqual([VALID_OBJECT_ID_2]);
  });

  it('deve rejeitar quando itens nao sao ObjectIds validos', async () => {
    const field = makeRelationshipField(RELATIONSHIP_CONFIG, {
      slug: 'produtos',
    });
    const table = await makeTable(tableRepository, [field], {
      slug: 'pedidos',
    });

    const row = await rowRepository.create({
      table,
      data: { produtos: [VALID_OBJECT_ID] },
    });

    const result = await sut.execute({
      slug: 'pedidos',
      _id: row._id,
      produtos: ['not-a-valid-id', 'also-invalid'],
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.cause).toBe('INVALID_PAYLOAD_FORMAT');
  });

  it('deve pular validacao de campo omitido (skipMissing)', async () => {
    const field = makeRelationshipField(RELATIONSHIP_CONFIG, {
      slug: 'produtos',
      required: true,
    });
    const table = await makeTable(tableRepository, [field], {
      slug: 'pedidos',
    });

    const row = await rowRepository.create({
      table,
      data: { produtos: [VALID_OBJECT_ID] },
    });

    const result = await sut.execute({
      slug: 'pedidos',
      _id: row._id,
    });

    expect(result.isRight()).toBe(true);
  });
});
