import { beforeEach, describe, expect, it } from 'vitest';

import {
  E_FIELD_FORMAT,
  E_FIELD_TYPE,
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
} from '@application/core/entity.core';
import FieldInMemoryRepository from '@application/repositories/field/field-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';
import TableSchemaInMemoryService from '@application/services/table-schema/table-schema-in-memory.service';

import TableFieldCreateUseCase from '../create.use-case';

let tableRepository: TableInMemoryRepository;
let fieldRepository: FieldInMemoryRepository;
let tableSchemaService: TableSchemaInMemoryService;
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
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function createTable(repo: TableInMemoryRepository, slug = 'clientes') {
  return repo.create({
    name: 'Clientes',
    slug,
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
}

describe('Table Field Create - TEXT_SHORT', () => {
  beforeEach(() => {
    tableRepository = new TableInMemoryRepository();
    fieldRepository = new FieldInMemoryRepository();
    tableSchemaService = new TableSchemaInMemoryService();

    sut = new TableFieldCreateUseCase(
      tableRepository,
      fieldRepository,
      tableSchemaService,
    );
  });

  // ─── FORMATOS ───

  it('deve criar campo com formato ALPHA_NUMERIC', async () => {
    await createTable(tableRepository);

    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'clientes',
      name: 'Nome',
      type: E_FIELD_TYPE.TEXT_SHORT,
      format: E_FIELD_FORMAT.ALPHA_NUMERIC,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.type).toBe(E_FIELD_TYPE.TEXT_SHORT);
    expect(result.value.format).toBe(E_FIELD_FORMAT.ALPHA_NUMERIC);
  });

  it('deve criar campo com formato INTEGER', async () => {
    await createTable(tableRepository);

    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'clientes',
      name: 'Idade',
      type: E_FIELD_TYPE.TEXT_SHORT,
      format: E_FIELD_FORMAT.INTEGER,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.format).toBe(E_FIELD_FORMAT.INTEGER);
  });

  it('deve criar campo com formato DECIMAL', async () => {
    await createTable(tableRepository);

    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'clientes',
      name: 'Salario',
      type: E_FIELD_TYPE.TEXT_SHORT,
      format: E_FIELD_FORMAT.DECIMAL,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.format).toBe(E_FIELD_FORMAT.DECIMAL);
  });

  it('deve criar campo com formato URL', async () => {
    await createTable(tableRepository);

    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'clientes',
      name: 'Website',
      type: E_FIELD_TYPE.TEXT_SHORT,
      format: E_FIELD_FORMAT.URL,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.format).toBe(E_FIELD_FORMAT.URL);
  });

  it('deve criar campo com formato EMAIL', async () => {
    await createTable(tableRepository);

    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'clientes',
      name: 'Email',
      type: E_FIELD_TYPE.TEXT_SHORT,
      format: E_FIELD_FORMAT.EMAIL,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.format).toBe(E_FIELD_FORMAT.EMAIL);
  });

  it('deve criar campo com formato PASSWORD', async () => {
    await createTable(tableRepository);

    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'clientes',
      name: 'Senha',
      type: E_FIELD_TYPE.TEXT_SHORT,
      format: E_FIELD_FORMAT.PASSWORD,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.format).toBe(E_FIELD_FORMAT.PASSWORD);
  });

  it('deve criar campo com formato PHONE', async () => {
    await createTable(tableRepository);

    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'clientes',
      name: 'Telefone',
      type: E_FIELD_TYPE.TEXT_SHORT,
      format: E_FIELD_FORMAT.PHONE,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.format).toBe(E_FIELD_FORMAT.PHONE);
  });

  it('deve criar campo com formato CNPJ', async () => {
    await createTable(tableRepository);

    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'clientes',
      name: 'CNPJ',
      type: E_FIELD_TYPE.TEXT_SHORT,
      format: E_FIELD_FORMAT.CNPJ,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.format).toBe(E_FIELD_FORMAT.CNPJ);
  });

  it('deve criar campo com formato CPF', async () => {
    await createTable(tableRepository);

    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'clientes',
      name: 'CPF',
      type: E_FIELD_TYPE.TEXT_SHORT,
      format: E_FIELD_FORMAT.CPF,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.format).toBe(E_FIELD_FORMAT.CPF);
  });

  // ─── PROPRIEDADES ───

  it('deve criar campo required=true', async () => {
    await createTable(tableRepository);

    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'clientes',
      name: 'Nome Obrigatorio',
      type: E_FIELD_TYPE.TEXT_SHORT,
      format: E_FIELD_FORMAT.ALPHA_NUMERIC,
      required: true,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.required).toBe(true);
  });

  it('deve criar campo com defaultValue', async () => {
    await createTable(tableRepository);

    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'clientes',
      name: 'Pais',
      type: E_FIELD_TYPE.TEXT_SHORT,
      format: E_FIELD_FORMAT.ALPHA_NUMERIC,
      defaultValue: 'Brasil',
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.defaultValue).toBe('Brasil');
  });

  it('deve criar campo com visibilidade personalizada', async () => {
    await createTable(tableRepository);

    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'clientes',
      name: 'Campo Interno',
      type: E_FIELD_TYPE.TEXT_SHORT,
      format: E_FIELD_FORMAT.ALPHA_NUMERIC,
      showInList: false,
      showInForm: true,
      showInDetail: false,
      showInFilter: true,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.showInList).toBe(false);
    expect(result.value.showInForm).toBe(true);
    expect(result.value.showInDetail).toBe(false);
    expect(result.value.showInFilter).toBe(true);
  });

  it('deve gerar slug automaticamente a partir do nome', async () => {
    await createTable(tableRepository);

    const result = await sut.execute({
      ...BASE_PAYLOAD,
      slug: 'clientes',
      name: 'Nome Completo',
      type: E_FIELD_TYPE.TEXT_SHORT,
      format: E_FIELD_FORMAT.ALPHA_NUMERIC,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.slug).toBe('nome-completo');
  });
});
