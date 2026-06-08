import { describe, expect, it } from 'vitest';

import { E_FIELD_TYPE } from './constant';
import type {
  IField,
  IFieldConfigurationRelationship,
  IRow,
} from './interfaces';
import {
  resolveRelationshipLabel,
  resolveRelationshipValue,
} from './relationship-label';

const UUID = '924925cd-5f4f-468a-a297-90486a8d13e8';
const OBJECT_ID = '507f1f77bcf86cd799439011';

// Campos da tabela relacionada "cidades": um texto (nome) e um dropdown (uf)
// cujas opções têm id (UUID) + label. Apenas as propriedades usadas pelo
// resolver são preenchidas.
const CIDADE_FIELDS = [
  { slug: 'nome', type: E_FIELD_TYPE.TEXT_SHORT },
  {
    slug: 'uf',
    type: E_FIELD_TYPE.DROPDOWN,
    dropdown: [
      { id: UUID, label: 'GO', color: null },
      { id: 'b2', label: 'SP', color: null },
    ],
  },
] as unknown as Array<IField>;

function makeRelConfig(
  overrides: Partial<IFieldConfigurationRelationship>,
): IFieldConfigurationRelationship {
  return {
    table: { _id: 't1', slug: 'cidades' },
    field: { _id: 'f1', slug: 'nome' },
    order: 'asc',
    ...overrides,
  };
}

describe('resolveRelationshipValue', () => {
  it('resolve campo escalar direto', () => {
    expect(resolveRelationshipValue({ nome: 'Uruana' }, 'nome')).toBe('Uruana');
  });

  it('navega caminho aninhado em relacionamento populado (array de objetos)', () => {
    const row = { nome: 'Uruana', uf: [{ sigla: 'GO', _id: UUID }] };
    expect(resolveRelationshipValue(row, 'uf.sigla')).toBe('GO');
  });

  it('resolve o título quando o caminho aponta para um relacionamento populado', () => {
    const row = { nome: 'Uruana', uf: [{ _id: UUID, nome: 'Goiás' }] };
    // Antes do fix isto retornava '' (objeto) ou o ID cru.
    expect(resolveRelationshipValue(row, 'uf')).toBe('Goiás');
  });

  it('NÃO expõe UUID cru quando o relacionamento não está populado', () => {
    const row = { nome: 'Uruana', uf: [UUID] };
    expect(resolveRelationshipValue(row, 'uf')).toBe('');
  });

  it('NÃO expõe ObjectId cru quando o relacionamento não está populado', () => {
    const row = { nome: 'Uruana', uf: [OBJECT_ID] };
    expect(resolveRelationshipValue(row, 'uf')).toBe('');
  });

  it('mantém valores de dropdown múltiplo (escalares) juntados por vírgula', () => {
    const row = { tags: ['A', 'B', 'C'] };
    expect(resolveRelationshipValue(row, 'tags')).toBe('A, B, C');
  });

  it('junta títulos de relacionamento múltiplo populado', () => {
    const row = {
      autores: [{ nome: 'Ana' }, { nome: 'Bruno' }],
    };
    expect(resolveRelationshipValue(row, 'autores')).toBe('Ana, Bruno');
  });

  it('retorna vazio para caminho inexistente', () => {
    expect(resolveRelationshipValue({ nome: 'Uruana' }, 'inexistente')).toBe(
      '',
    );
  });

  it('mapeia id de opção DROPDOWN para o label quando fields é fornecido', () => {
    const row = { nome: 'Uruana', uf: [UUID] };
    expect(resolveRelationshipValue(row, 'uf', CIDADE_FIELDS)).toBe('GO');
  });

  it('mapeia múltiplas opções DROPDOWN', () => {
    const row = { uf: [UUID, 'b2'] };
    expect(resolveRelationshipValue(row, 'uf', CIDADE_FIELDS)).toBe('GO, SP');
  });

  it('omite id de opção DROPDOWN inexistente em vez de exibi-lo', () => {
    const row = { uf: ['id-desconhecido'] };
    expect(resolveRelationshipValue(row, 'uf', CIDADE_FIELDS)).toBe('');
  });

  it('sem fields, o valor cru do DROPDOWN (UUID) é suprimido', () => {
    const row = { uf: [UUID] };
    expect(resolveRelationshipValue(row, 'uf')).toBe('');
  });
});

describe('resolveRelationshipLabel', () => {
  it('compõe label customizado com partes válidas', () => {
    const row = {
      _id: UUID,
      nome: 'Uruana',
      uf: [{ sigla: 'GO' }],
    } as unknown as IRow;
    const relConfig = makeRelConfig({
      customLabel: true,
      labelParts: [{ path: 'nome' }, { path: 'uf.sigla' }],
      labelSeparator: ' - ',
    });
    expect(resolveRelationshipLabel(row, relConfig)).toBe('Uruana - GO');
  });

  it('não exibe "nome - <uuid>" quando uma parte é relacionamento não populado', () => {
    const row = {
      _id: UUID,
      nome: 'Uruana',
      uf: [UUID],
    } as unknown as IRow;
    const relConfig = makeRelConfig({
      customLabel: true,
      labelParts: [{ path: 'nome' }, { path: 'uf' }],
      labelSeparator: ' - ',
    });
    // A parte "uf" (ID cru) é suprimida; sobra apenas o nome.
    expect(resolveRelationshipLabel(row, relConfig)).toBe('Uruana');
  });

  it('resolve o título de uma parte que aponta para relacionamento populado', () => {
    const row = {
      _id: UUID,
      nome: 'Uruana',
      uf: [{ _id: OBJECT_ID, nome: 'Goiás' }],
    } as unknown as IRow;
    const relConfig = makeRelConfig({
      customLabel: true,
      labelParts: [{ path: 'nome' }, { path: 'uf' }],
      labelSeparator: ' - ',
    });
    expect(resolveRelationshipLabel(row, relConfig)).toBe('Uruana - Goiás');
  });

  it('compõe label com DROPDOWN traduzido (cenário do bug reportado)', () => {
    const row = {
      _id: UUID,
      nome: 'Uruana',
      uf: [UUID],
    } as unknown as IRow;
    const relConfig = makeRelConfig({
      customLabel: true,
      labelParts: [{ path: 'nome' }, { path: 'uf' }],
      labelSeparator: ' - ',
    });
    // Antes: "Uruana - 924925cd-...". Agora: "Uruana - GO".
    expect(resolveRelationshipLabel(row, relConfig, CIDADE_FIELDS)).toBe(
      'Uruana - GO',
    );
  });

  it('usa fallback de campo legado quando customLabel está desativado', () => {
    const row = { _id: UUID, nome: 'Uruana' } as unknown as IRow;
    const relConfig = makeRelConfig({ field: { _id: 'f1', slug: 'nome' } });
    expect(resolveRelationshipLabel(row, relConfig)).toBe('Uruana');
  });

  it('cai para _id apenas quando nada mais resolve', () => {
    const row = { _id: UUID } as unknown as IRow;
    const relConfig = makeRelConfig({ field: { _id: 'f1', slug: 'nome' } });
    expect(resolveRelationshipLabel(row, relConfig)).toBe(UUID);
  });
});
