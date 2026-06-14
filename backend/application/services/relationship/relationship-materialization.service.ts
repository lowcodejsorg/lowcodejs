/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import {
  buildFieldPermissions,
  E_FIELD_TYPE,
  type IField,
  type ITable,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { FieldSlug } from '@application/core/field-slug.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import { RelationshipDefinitionContractRepository } from '@application/repositories/relationship-definition/relationship-definition-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';
import { ModelBuilderContractService } from '@application/services/table/model-builder-contract.service';
import { SchemaBuilderContractService } from '@application/services/table/schema-builder-contract.service';

import type {
  RelationshipMaterializationContractService,
  RelationshipMaterializeParams,
  RelationshipMaterializeResult,
} from './relationship-materialization-contract.service';

@Service()
export default class RelationshipMaterializationService implements RelationshipMaterializationContractService {
  constructor(
    private readonly fieldRepository: FieldContractRepository,
    private readonly tableRepository: TableContractRepository,
    private readonly definitionRepository: RelationshipDefinitionContractRepository,
    private readonly schemaBuilder: SchemaBuilderContractService,
    private readonly modelBuilder: ModelBuilderContractService,
  ) {}

  async materialize(
    params: RelationshipMaterializeParams,
  ): Promise<Either<HTTPException, RelationshipMaterializeResult>> {
    const {
      sourceField,
      sourceTable,
      onDelete,
      mirrorMultiple,
      mirrorVisible,
    } = params;

    const ref = sourceField.relationship?.table;
    if (!ref) {
      return left(
        HTTPException.BadRequest(
          'Configuração de relacionamento ausente',
          'RELATIONSHIP_CONFIG_MISSING',
        ),
      );
    }

    const targetTable = await this.loadTargetTable(ref._id, ref.slug);
    if (!targetTable) {
      return left(
        HTTPException.NotFound(
          'Tabela alvo do relacionamento não encontrada',
          'RELATIONSHIP_TARGET_NOT_FOUND',
        ),
      );
    }

    const mirrorSlug = this.resolveMirrorSlug(
      sourceTable,
      sourceField,
      targetTable,
    );

    // 1. Campo-espelho no target (lado oposto).
    const mirror = await this.fieldRepository.create({
      name: sourceTable.name,
      slug: mirrorSlug,
      type: E_FIELD_TYPE.RELATIONSHIP,
      required: false,
      multiple: mirrorMultiple,
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
        table: { _id: sourceTable._id, slug: sourceTable.slug },
        field: { _id: sourceField._id, slug: sourceField.slug },
        order: 'asc',
        visible: mirrorVisible,
        relationshipId: null,
      },
      dropdown: [],
      allowCustomDropdownOptions: false,
      allowCreateRelationshipRecords: false,
      category: [],
      group: null,
    });

    // 2. RelationshipDefinition (fonte de verdade do vínculo).
    const definition = await this.definitionRepository.create({
      name: `${sourceTable.name} ↔ ${targetTable.name}`,
      source: {
        table: { _id: sourceTable._id, slug: sourceTable.slug },
        field: { _id: sourceField._id, slug: sourceField.slug },
        visible: true,
        label: sourceField.name,
      },
      target: {
        table: { _id: targetTable._id, slug: targetTable.slug },
        field: { _id: mirror._id, slug: mirror.slug },
        visible: mirrorVisible,
        label: sourceTable.name,
      },
      onDelete,
    });

    // 3. Liga os dois lados à definition.
    await this.fieldRepository.update({
      _id: sourceField._id,
      relationship: {
        ...sourceField.relationship,
        table: ref,
        field: sourceField.relationship?.field ?? {
          _id: mirror._id,
          slug: mirror.slug,
        },
        order: sourceField.relationship?.order ?? 'asc',
        visible: true,
        relationshipId: definition._id,
      },
    });
    await this.fieldRepository.update({
      _id: mirror._id,
      relationship: {
        table: { _id: sourceTable._id, slug: sourceTable.slug },
        field: { _id: sourceField._id, slug: sourceField.slug },
        order: 'asc',
        visible: mirrorVisible,
        relationshipId: definition._id,
      },
    });

    // 4. Injeta o espelho no target (fields + ordens + _schema + model).
    await this.attachMirrorToTarget(targetTable, mirror);

    return right({
      definitionId: definition._id,
      mirrorFieldId: mirror._id,
    });
  }

  private async loadTargetTable(
    _id: string | undefined,
    slug: string | undefined,
  ): Promise<ITable | null> {
    if (_id) {
      const byId = await this.tableRepository.findById(_id);
      if (byId) return byId;
    }
    if (slug) return this.tableRepository.findBySlug(slug);
    return null;
  }

  private resolveMirrorSlug(
    sourceTable: ITable,
    sourceField: IField,
    targetTable: ITable,
  ): string {
    const base = FieldSlug.resolve({
      name: `${sourceTable.name} ${sourceField.name}`,
    });
    let slug = base.slug;
    const used = new Set((targetTable.fields ?? []).map((f) => f.slug));
    let suffix = 1;
    while (used.has(slug)) {
      slug = `${base.slug}-${suffix}`;
      suffix++;
    }
    return slug;
  }

  private async attachMirrorToTarget(
    targetTable: ITable,
    mirror: IField,
  ): Promise<void> {
    const fields = [...(targetTable.fields ?? []), mirror];
    const groups = targetTable.groups ?? [];
    const schema = this.schemaBuilder.build(fields, groups);

    await this.tableRepository.update({
      _id: targetTable._id,
      _schema: { ...targetTable._schema, ...schema },
      fields: fields.flatMap((f) => f._id),
      groups,
      owner: targetTable.owner._id,
      fieldOrderList: [...(targetTable.fieldOrderList ?? []), mirror._id],
      fieldOrderForm: [...(targetTable.fieldOrderForm ?? []), mirror._id],
      fieldOrderFilter: [...(targetTable.fieldOrderFilter ?? []), mirror._id],
      fieldOrderDetail: [...(targetTable.fieldOrderDetail ?? []), mirror._id],
    });

    await this.modelBuilder.build({
      ...targetTable,
      _id: targetTable._id,
      _schema: { ...targetTable._schema, ...schema },
      groups,
    });
  }
}
