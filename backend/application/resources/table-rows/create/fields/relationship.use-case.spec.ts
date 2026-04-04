import { beforeEach, describe, expect, it } from 'vitest';

import RowInMemoryRepository from '@application/repositories/row/row-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';
import { makeRelationshipField } from '@test/helpers/field-factory.helper';
import { makeTable } from '@test/helpers/table-factory.helper';

import TableRowCreateUseCase from '../create.use-case';

const VALID_OBJECT_ID = '507f1f77bcf86cd799439011';
const VALID_OBJECT_ID_2 = '507f1f77bcf86cd799439022';

const RELATIONSHIP_CONFIG = {
  table: { _id: '507f1f77bcf86cd799439099', slug: 'produtos' },
  field: { _id: '507f1f77bcf86cd799439088', slug: 'nome' },
  order: 'asc' as const,
};

let tableRepository: TableInMemoryRepository;
let rowRepository: RowInMemoryRepository;
let sut: TableRowCreateUseCase;

describe('Table Row Create - RELATIONSHIP', () => {
  beforeEach(() => {
    tableRepository = new TableInMemoryRepository();
    rowRepository = new RowInMemoryRepository();
    sut = new TableRowCreateUseCase(tableRepository, rowRepository);
  });

  it('deve criar row com array de ObjectIds validos', async () => {
    const field = makeRelationshipField(RELATIONSHIP_CONFIG, {
      slug: 'produtos',
    });
    await makeTable(tableRepository, [field], { slug: 'pedidos' });

    const result = await sut.execute({
      slug: 'pedidos',
      produtos: [VALID_OBJECT_ID],
      creator: 'user-id',
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.produtos).toEqual([VALID_OBJECT_ID]);
  });

  it('deve criar row com multiplos ObjectIds', async () => {
    const field = makeRelationshipField(RELATIONSHIP_CONFIG, {
      slug: 'produtos',
      multiple: true,
    });
    await makeTable(tableRepository, [field], { slug: 'pedidos' });

    const result = await sut.execute({
      slug: 'pedidos',
      produtos: [VALID_OBJECT_ID, VALID_OBJECT_ID_2],
      creator: 'user-id',
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.produtos).toHaveLength(2);
  });

  it('deve rejeitar quando valor nao e array', async () => {
    const field = makeRelationshipField(RELATIONSHIP_CONFIG, {
      slug: 'produtos',
    });
    await makeTable(tableRepository, [field], { slug: 'pedidos' });

    const result = await sut.execute({
      slug: 'pedidos',
      produtos: VALID_OBJECT_ID,
      creator: 'user-id',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.cause).toBe('INVALID_PAYLOAD_FORMAT');
  });

  it('deve rejeitar quando itens nao sao ObjectIds validos', async () => {
    const field = makeRelationshipField(RELATIONSHIP_CONFIG, {
      slug: 'produtos',
    });
    await makeTable(tableRepository, [field], { slug: 'pedidos' });

    const result = await sut.execute({
      slug: 'pedidos',
      produtos: ['not-a-valid-id', 'also-invalid'],
      creator: 'user-id',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.cause).toBe('INVALID_PAYLOAD_FORMAT');
  });

  it('deve rejeitar quando required e valor ausente', async () => {
    const field = makeRelationshipField(RELATIONSHIP_CONFIG, {
      slug: 'produtos',
      required: true,
    });
    await makeTable(tableRepository, [field], { slug: 'pedidos' });

    const result = await sut.execute({
      slug: 'pedidos',
      creator: 'user-id',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.cause).toBe('INVALID_PAYLOAD_FORMAT');
    expect(result.value.errors).toHaveProperty('produtos');
  });

  it('deve aceitar array vazio quando nao required', async () => {
    const field = makeRelationshipField(RELATIONSHIP_CONFIG, {
      slug: 'produtos',
      required: false,
    });
    await makeTable(tableRepository, [field], { slug: 'pedidos' });

    const result = await sut.execute({
      slug: 'pedidos',
      produtos: [],
      creator: 'user-id',
    });

    expect(result.isRight()).toBe(true);
  });
});
