import { beforeEach, describe, expect, it } from 'vitest';

import {
  buildFieldPermissions,
  E_FIELD_TYPE,
  E_RELATIONSHIP_ON_DELETE,
  type IField,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import FieldInMemoryRepository from '@application/repositories/field/field-in-memory.repository';
import RelationshipDefinitionInMemoryRepository from '@application/repositories/relationship-definition/relationship-definition-in-memory.repository';
import RelationshipLinkInMemoryRepository from '@application/repositories/relationship-link/relationship-link-in-memory.repository';
import RelationshipService from '@application/services/relationship/relationship.service';

import type { RelationshipHydratableDoc } from './relationship-builder-contract.service';
import MongooseRelationshipBuilder from './relationship-builder.service';

const PEDIDO_TABLE = { _id: 'table-pedido', slug: 'pedidos' };
const PRODUTO_TABLE = { _id: 'table-produto', slug: 'produtos' };

const FIELD_BASE = {
  permissions: buildFieldPermissions(true, true, true),
  showInFilter: false,
  locked: false,
  native: false,
  allowCreateRelationshipRecords: false,
  required: false,
  category: [],
  dropdown: [],
  defaultValue: null,
  group: null,
  format: null,
  widthInForm: 50,
  widthInList: 10,
  widthInDetail: null,
};

// Doc minimo que captura as chamadas de set() para asserts de hydrate.
class FakeDoc implements RelationshipHydratableDoc {
  _id: { toString(): string };
  sets: Record<string, unknown> = {};

  constructor(id: string) {
    this._id = { toString: (): string => id };
  }

  set(path: string, value: unknown): void {
    this.sets[path] = value;
  }
}

let linkRepository: RelationshipLinkInMemoryRepository;
let definitionRepository: RelationshipDefinitionInMemoryRepository;
let fieldRepository: FieldInMemoryRepository;
let service: RelationshipService;
let sut: MongooseRelationshipBuilder;

// Campo do lado source (pedidos→produtos), gerido por links.
let sourceField: IField;

describe('MongooseRelationshipBuilder', () => {
  beforeEach(async () => {
    linkRepository = new RelationshipLinkInMemoryRepository();
    definitionRepository = new RelationshipDefinitionInMemoryRepository();
    fieldRepository = new FieldInMemoryRepository();
    service = new RelationshipService(linkRepository);
    sut = new MongooseRelationshipBuilder(
      service,
      definitionRepository,
      fieldRepository,
    );

    // 1:N — source (pedidos) aceita multiplos; target (produtos) nao.
    sourceField = await fieldRepository.create({
      ...FIELD_BASE,
      name: 'Produtos',
      slug: 'produtos',
      type: E_FIELD_TYPE.RELATIONSHIP,
      multiple: true,
      relationship: {
        table: PRODUTO_TABLE,
        field: { _id: 'field-mirror', slug: 'pedidos' },
        order: 'asc',
      },
    });

    const mirrorField = await fieldRepository.create({
      ...FIELD_BASE,
      name: 'Pedidos',
      slug: 'pedidos',
      type: E_FIELD_TYPE.RELATIONSHIP,
      multiple: false,
      relationship: {
        table: PEDIDO_TABLE,
        field: { _id: sourceField._id, slug: 'produtos' },
        order: 'asc',
      },
    });

    const definition = await definitionRepository.create({
      name: 'Pedidos ↔ Produtos',
      source: {
        table: PEDIDO_TABLE,
        field: { _id: sourceField._id, slug: 'produtos' },
        visible: true,
        label: 'Produtos',
      },
      target: {
        table: PRODUTO_TABLE,
        field: { _id: mirrorField._id, slug: 'pedidos' },
        visible: true,
        label: 'Pedidos',
      },
      onDelete: E_RELATIONSHIP_ON_DELETE.RESTRICT,
    });

    // Back-pointer do campo source para a definition (fonte de verdade).
    sourceField.relationship = {
      ...sourceField.relationship,
      table: PRODUTO_TABLE,
      field: { _id: mirrorField._id, slug: 'pedidos' },
      order: 'asc',
      relationshipId: definition._id,
    };
  });

  it('extract separa campos RELATIONSHIP geridos por links do payload', () => {
    const result = sut.extract([sourceField], {
      nome: 'Pedido 1',
      produtos: ['p1', 'p2'],
    });

    expect(result.data).toEqual({ nome: 'Pedido 1' });
    expect(result.pending).toHaveLength(1);
    expect(result.pending[0].ids).toEqual(['p1', 'p2']);
  });

  it('persist cria os links do conjunto desejado', async () => {
    await sut.persist([sourceField], 'ped1', [
      { field: sourceField, ids: ['p1', 'p2'] },
    ]);

    const links = await linkRepository.findBySource(
      sourceField.relationship!.relationshipId!,
      'ped1',
    );
    expect(links.map((l) => l.targetId)).toEqual(['p1', 'p2']);
  });

  it('persist reconcilia removendo ids que sairam do conjunto', async () => {
    const relationshipId = sourceField.relationship!.relationshipId!;

    await sut.persist([sourceField], 'ped1', [
      { field: sourceField, ids: ['p1', 'p2'] },
    ]);
    await sut.persist([sourceField], 'ped1', [
      { field: sourceField, ids: ['p1'] },
    ]);

    const links = await linkRepository.findBySource(relationshipId, 'ped1');
    expect(links.map((l) => l.targetId)).toEqual(['p1']);
  });

  it('persist lanca HTTPException ao violar limite do lado nao-multiplo', async () => {
    // produto p1 nao aceita multiplos pedidos (target multiple=false).
    await sut.persist([sourceField], 'ped1', [
      { field: sourceField, ids: ['p1'] },
    ]);

    await expect(
      sut.persist([sourceField], 'ped2', [{ field: sourceField, ids: ['p1'] }]),
    ).rejects.toBeInstanceOf(HTTPException);
  });

  it('hydrate projeta os ids dos links em doc[slug]', async () => {
    await sut.persist([sourceField], 'ped1', [
      { field: sourceField, ids: ['p1', 'p2'] },
    ]);

    const doc = new FakeDoc('ped1');
    await sut.hydrate([sourceField], [doc]);

    expect(doc.sets['produtos']).toEqual(['p1', 'p2']);
  });

  it('hydrate projeta vazio em campo gerido sem links (links sao a fonte de verdade)', async () => {
    const doc = new FakeDoc('ped1');
    await sut.hydrate([sourceField], [doc]);

    // Campo gerido: 0 links => [] (nao cai no embedded legado stale).
    expect(doc.sets['produtos']).toEqual([]);
  });

  it('hydrate zera campo RELATIONSHIP sem relationshipId (zero legado, nunca serve embedded)', async () => {
    const legacy: IField = {
      ...sourceField,
      relationship: {
        table: PRODUTO_TABLE,
        field: { _id: 'field-mirror', slug: 'pedidos' },
        order: 'asc',
        relationshipId: null,
      },
    };
    const doc = new FakeDoc('ped1');
    await sut.hydrate([legacy], [doc]);

    // Sem relationshipId: zera o path (não cai no array embedded legado).
    expect(doc.sets['produtos']).toEqual([]);
  });

  it('hasManagedRelationships é true para qualquer campo RELATIONSHIP (links são a única fonte)', () => {
    const legacy: IField = {
      ...sourceField,
      relationship: {
        table: PRODUTO_TABLE,
        field: { _id: 'field-mirror', slug: 'pedidos' },
        order: 'asc',
        relationshipId: null,
      },
    };
    expect(sut.hasManagedRelationships([legacy])).toBe(true);
    expect(sut.hasManagedRelationships([sourceField])).toBe(true);
  });
});
