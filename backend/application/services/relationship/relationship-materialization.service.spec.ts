import { beforeEach, describe, expect, it } from 'vitest';

import {
  buildFieldPermissions,
  E_FIELD_TYPE,
  E_RELATIONSHIP_ON_DELETE,
  E_TABLE_STYLE,
  type IField,
  type ITable,
} from '@application/core/entity.core';
import FieldInMemoryRepository from '@application/repositories/field/field-in-memory.repository';
import RelationshipDefinitionInMemoryRepository from '@application/repositories/relationship-definition/relationship-definition-in-memory.repository';
import TableInMemoryRepository from '@application/repositories/table/table-in-memory.repository';
import InMemoryModelBuilder from '@application/services/table/in-memory-model-builder.service';
import InMemorySchemaBuilder from '@application/services/table/in-memory-schema-builder.service';

import RelationshipMaterializationService from './relationship-materialization.service';

const TABLE_DEFAULTS = {
  _schema: {},
  fields: [],
  owner: 'owner-id',
  style: E_TABLE_STYLE.LIST,
  fieldOrderList: [],
  fieldOrderForm: [],
};

let fieldRepository: FieldInMemoryRepository;
let tableRepository: TableInMemoryRepository;
let definitionRepository: RelationshipDefinitionInMemoryRepository;
let sut: RelationshipMaterializationService;

let pedidos: ITable;
let produtos: ITable;

async function createSourceField(multiple: boolean): Promise<IField> {
  return fieldRepository.create({
    name: 'Produtos',
    slug: 'produtos',
    type: E_FIELD_TYPE.RELATIONSHIP,
    required: false,
    multiple,
    format: null,
    showInFilter: false,
    permissions: buildFieldPermissions(true, true, true),
    widthInForm: 50,
    widthInList: 10,
    widthInDetail: null,
    tip: null,
    locked: false,
    native: false,
    defaultValue: null,
    relationship: {
      table: { _id: produtos._id, slug: produtos.slug },
      field: { _id: 'field-nome', slug: 'nome' },
      order: 'asc',
    },
    dropdown: [],
    allowCustomDropdownOptions: false,
    allowCreateRelationshipRecords: false,
    category: [],
    group: null,
  });
}

describe('RelationshipMaterializationService', () => {
  beforeEach(async () => {
    fieldRepository = new FieldInMemoryRepository();
    tableRepository = new TableInMemoryRepository();
    definitionRepository = new RelationshipDefinitionInMemoryRepository();
    sut = new RelationshipMaterializationService(
      fieldRepository,
      tableRepository,
      definitionRepository,
      new InMemorySchemaBuilder(),
      new InMemoryModelBuilder(),
    );

    pedidos = await tableRepository.create({
      ...TABLE_DEFAULTS,
      name: 'Pedidos',
      slug: 'pedidos',
    });
    produtos = await tableRepository.create({
      ...TABLE_DEFAULTS,
      name: 'Produtos',
      slug: 'produtos',
    });
  });

  it('cria definition + espelho e liga os dois lados', async () => {
    const source = await createSourceField(true);

    const result = await sut.materialize({
      sourceField: source,
      sourceTable: pedidos,
      onDelete: E_RELATIONSHIP_ON_DELETE.SET_NULL,
      mirrorMultiple: false,
      mirrorVisible: false,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');

    // Definition criada com os dois endpoints e onDelete.
    expect(definitionRepository.items).toHaveLength(1);
    const definition = definitionRepository.items[0];
    expect(definition.source.field._id).toBe(source._id);
    expect(definition.onDelete).toBe(E_RELATIONSHIP_ON_DELETE.SET_NULL);
    expect(result.value.definitionId).toBe(definition._id);

    // Source ligado à definition.
    const updatedSource = await fieldRepository.findById(source._id);
    expect(updatedSource!.relationship!.relationshipId).toBe(definition._id);
    expect(updatedSource!.relationship!.visible).toBe(true);

    // Espelho criado no target, ligado e visible:false.
    const mirror = await fieldRepository.findById(result.value.mirrorFieldId);
    expect(mirror).not.toBeNull();
    expect(mirror!.relationship!.relationshipId).toBe(definition._id);
    expect(mirror!.relationship!.visible).toBe(false);
    expect(mirror!.relationship!.table.slug).toBe('pedidos');
    expect(mirror!.multiple).toBe(false);
  });

  it('falha quando a tabela alvo não existe', async () => {
    const source = await fieldRepository.create({
      name: 'Inexistente',
      slug: 'inexistente',
      type: E_FIELD_TYPE.RELATIONSHIP,
      required: false,
      multiple: false,
      format: null,
      showInFilter: false,
      permissions: buildFieldPermissions(true, true, true),
      widthInForm: 50,
      widthInList: 10,
      widthInDetail: null,
      tip: null,
      locked: false,
      native: false,
      defaultValue: null,
      relationship: {
        table: { _id: 'missing-id', slug: 'missing-slug' },
        field: { _id: 'x', slug: 'x' },
        order: 'asc',
      },
      dropdown: [],
      allowCustomDropdownOptions: false,
      allowCreateRelationshipRecords: false,
      category: [],
      group: null,
    });

    const result = await sut.materialize({
      sourceField: source,
      sourceTable: pedidos,
      onDelete: E_RELATIONSHIP_ON_DELETE.SET_NULL,
      mirrorMultiple: false,
      mirrorVisible: false,
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.cause).toBe('RELATIONSHIP_TARGET_NOT_FOUND');
  });

  it('syncConfig atualiza onDelete e cardinalidade do espelho', async () => {
    const source = await createSourceField(true);
    const materialized = await sut.materialize({
      sourceField: source,
      sourceTable: pedidos,
      onDelete: E_RELATIONSHIP_ON_DELETE.SET_NULL,
      mirrorMultiple: false,
      mirrorVisible: false,
    });
    if (!materialized.isRight()) throw new Error('Expected right');

    // Recarrega o source já com relationshipId.
    const linked = await fieldRepository.findById(source._id);

    const synced = await sut.syncConfig({
      sourceField: linked!,
      onDelete: E_RELATIONSHIP_ON_DELETE.CASCADE,
      sourceVisible: true,
      sourceLabel: 'Produtos',
      mirrorMultiple: true,
      mirrorVisible: true,
    });

    expect(synced.isRight()).toBe(true);
    const definition = definitionRepository.items[0];
    expect(definition.onDelete).toBe(E_RELATIONSHIP_ON_DELETE.CASCADE);
    expect(definition.target.visible).toBe(true);

    const mirror = await fieldRepository.findById(
      materialized.value.mirrorFieldId,
    );
    expect(mirror!.multiple).toBe(true);
    expect(mirror!.relationship!.visible).toBe(true);
  });

  it('auto-relacionamento: target == source materializa na mesma tabela', async () => {
    const selfField = await fieldRepository.create({
      name: 'Pai',
      slug: 'pai',
      type: E_FIELD_TYPE.RELATIONSHIP,
      required: false,
      multiple: false,
      format: null,
      showInFilter: false,
      permissions: buildFieldPermissions(true, true, true),
      widthInForm: 50,
      widthInList: 10,
      widthInDetail: null,
      tip: null,
      locked: false,
      native: false,
      defaultValue: null,
      relationship: {
        table: { _id: pedidos._id, slug: pedidos.slug },
        field: { _id: 'x', slug: 'x' },
        order: 'asc',
      },
      dropdown: [],
      allowCustomDropdownOptions: false,
      allowCreateRelationshipRecords: false,
      category: [],
      group: null,
    });

    const result = await sut.materialize({
      sourceField: selfField,
      sourceTable: pedidos,
      onDelete: E_RELATIONSHIP_ON_DELETE.CASCADE,
      mirrorMultiple: true,
      mirrorVisible: false,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    const definition = definitionRepository.items[0];
    expect(definition.source.table.slug).toBe('pedidos');
    expect(definition.target.table.slug).toBe('pedidos');
  });
});
