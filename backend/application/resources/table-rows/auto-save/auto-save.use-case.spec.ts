import { beforeEach, describe, expect, it } from 'vitest';

import {
  E_FIELD_TYPE,
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
  type IField,
} from '@application/core/entity.core';
import RowInMemoryRepository from '@application/repositories/row/row-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';

import TableRowAutoSaveUseCase from './auto-save.use-case';

let tableRepo: TableInMemoryRepository;
let rowRepo: RowInMemoryRepository;
let sut: TableRowAutoSaveUseCase;

const buildField = (overrides: Partial<IField>): IField =>
  ({
    _id: overrides.slug ?? 'f',
    name: 'Field',
    slug: 'field',
    type: E_FIELD_TYPE.TEXT_SHORT,
    required: false,
    multiple: false,
    format: null,
    showInFilter: false,
    showInForm: true,
    showInDetail: true,
    showInList: true,
    widthInForm: null,
    widthInList: 10,
    widthInDetail: null,
    defaultValue: null,
    relationship: null,
    dropdown: [],
    category: [],
    group: null,
    native: false,
    locked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    trashed: false,
    trashedAt: null,
    ...overrides,
  }) as IField;

async function seedTable(fields: IField[]): Promise<void> {
  await tableRepo.create({
    name: 'Filmes',
    slug: 'filmes',
    _schema: {},
    fields: fields as unknown as string[],
    owner: 'owner-id',
    administrators: [],
    style: E_TABLE_STYLE.LIST,
    visibility: E_TABLE_VISIBILITY.RESTRICTED,
    collaboration: E_TABLE_COLLABORATION.RESTRICTED,
    fieldOrderList: [],
    fieldOrderForm: [],
  });
}

describe('Table Row Auto Save Use Case', () => {
  beforeEach(() => {
    tableRepo = new TableInMemoryRepository();
    rowRepo = new RowInMemoryRepository();
    sut = new TableRowAutoSaveUseCase(tableRepo, rowRepo);
  });

  it('deve salvar na lixeira quando obrigatorio e string vazia', async () => {
    await seedTable([
      buildField({ name: 'Titulo', slug: 'titulo', required: true }),
    ]);

    const result = await sut.execute({ slug: 'filmes', titulo: '' });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.trashed).toBe(true);
      expect(result.value.trashedAt).not.toBeNull();
    }
  });

  it('deve salvar na lixeira quando obrigatorio e null', async () => {
    await seedTable([
      buildField({ name: 'Titulo', slug: 'titulo', required: true }),
    ]);

    const result = await sut.execute({ slug: 'filmes', titulo: null });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.trashed).toBe(true);
    }
  });

  it('deve salvar com status normal quando obrigatorios tem valor', async () => {
    await seedTable([
      buildField({ name: 'Titulo', slug: 'titulo', required: true }),
    ]);

    const result = await sut.execute({ slug: 'filmes', titulo: 'Matrix' });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.trashed).toBe(false);
      expect(result.value.trashedAt).toBeNull();
    }
  });

  it('deve tirar da lixeira ao completar obrigatorios em um update', async () => {
    await seedTable([
      buildField({ name: 'Titulo', slug: 'titulo', required: true }),
    ]);

    const draft = await sut.execute({ slug: 'filmes', titulo: '' });
    expect(draft.isRight()).toBe(true);
    if (!draft.isRight()) return;
    expect(draft.value.trashed).toBe(true);

    const completed = await sut.execute({
      slug: 'filmes',
      _id: draft.value._id,
      titulo: 'Matrix',
    });

    expect(completed.isRight()).toBe(true);
    if (completed.isRight()) {
      expect(completed.value.trashed).toBe(false);
      expect(completed.value.trashedAt).toBeNull();
    }
  });

  it('deve retornar erro quando a tabela nao existe', async () => {
    const result = await sut.execute({ slug: 'inexistente' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.cause).toBe('TABLE_NOT_FOUND');
    }
  });
});
