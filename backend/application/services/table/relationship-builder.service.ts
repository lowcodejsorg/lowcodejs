/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type {
  IField,
  IRelationshipDefinition,
} from '@application/core/entity.core';
import { E_FIELD_TYPE } from '@application/core/entity.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import { RelationshipDefinitionContractRepository } from '@application/repositories/relationship-definition/relationship-definition-contract.repository';
import type { RelationshipLinkSide } from '@application/repositories/relationship-link/relationship-link-contract.repository';
import { RelationshipContractService } from '@application/services/relationship/relationship-contract.service';

import type {
  PendingRelationship,
  RelationshipBuilderContractService,
  RelationshipExtractResult,
  RelationshipHydratableDoc,
} from './relationship-builder-contract.service';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

@Service()
export default class MongooseRelationshipBuilder implements RelationshipBuilderContractService {
  constructor(
    private readonly relationship: RelationshipContractService,
    private readonly definitionRepository: RelationshipDefinitionContractRepository,
    private readonly fieldRepository: FieldContractRepository,
  ) {}

  hasManagedRelationships(fields: IField[]): boolean {
    return this.managedFields(fields).length > 0;
  }

  async hydrate(
    fields: IField[],
    docs: RelationshipHydratableDoc[],
  ): Promise<void> {
    const managed = this.managedFields(fields);
    if (managed.length === 0 || docs.length === 0) return;

    for (const field of managed) {
      const relationshipId = field.relationship?.relationshipId;
      if (!relationshipId) continue;

      const definition =
        await this.definitionRepository.findById(relationshipId);
      if (!definition) continue;

      const side = this.sideOf(definition, field);

      for (const doc of docs) {
        const recordId = doc._id.toString();
        const ids = await this.relationship.resolveLinkedIds(
          definition,
          recordId,
          side,
        );
        // Sem links: preserva o valor atual (fallback embedded legado).
        if (ids.length === 0) continue;
        doc.set(field.slug, ids);
      }
    }
  }

  extract(
    fields: IField[],
    data: Record<string, unknown>,
  ): RelationshipExtractResult {
    const managed = this.managedFields(fields);
    const pending: PendingRelationship[] = [];
    const cleaned: Record<string, unknown> = { ...data };

    for (const field of managed) {
      if (!(field.slug in cleaned)) continue;
      const ids = this.toIds(cleaned[field.slug]);
      delete cleaned[field.slug];
      pending.push({ field, ids });
    }

    return { data: cleaned, pending };
  }

  async persist(
    fields: IField[],
    recordId: string,
    pending: PendingRelationship[],
  ): Promise<void> {
    for (const item of pending) {
      const relationshipId = item.field.relationship?.relationshipId;
      if (!relationshipId) continue;

      const definition =
        await this.definitionRepository.findById(relationshipId);
      if (!definition) continue;

      const side = this.sideOf(definition, item.field);
      const { sourceField, targetField } = await this.endpointFields(
        definition,
        item.field,
        side,
      );

      const result = await this.relationship.replaceLinks({
        definition,
        recordId,
        side,
        desiredIds: item.ids,
        sourceField,
        targetField,
      });

      if (result.isLeft()) throw result.value;
    }
  }

  // ── helpers ───────────────────────────────────────────────

  private managedFields(fields: IField[]): IField[] {
    return fields.filter(
      (field) =>
        field.type === E_FIELD_TYPE.RELATIONSHIP &&
        Boolean(field.relationship?.relationshipId),
    );
  }

  private sideOf(
    definition: IRelationshipDefinition,
    field: Pick<IField, '_id'>,
  ): RelationshipLinkSide {
    if (definition.source.field._id === field._id) return 'source';
    return 'target';
  }

  // Resolve os campos dos dois endpoints (this + espelho) para derivar a
  // cardinalidade (`multiple`) em canLink.
  private async endpointFields(
    definition: IRelationshipDefinition,
    field: Pick<IField, 'multiple'>,
    side: RelationshipLinkSide,
  ): Promise<{
    sourceField: Pick<IField, 'multiple'>;
    targetField: Pick<IField, 'multiple'>;
  }> {
    let mirrorFieldId = definition.source.field._id;
    if (side === 'source') mirrorFieldId = definition.target.field._id;

    const mirror = await this.fieldRepository.findById(mirrorFieldId);
    const mirrorField: Pick<IField, 'multiple'> = {
      multiple: Boolean(mirror?.multiple),
    };

    if (side === 'source') {
      return { sourceField: field, targetField: mirrorField };
    }
    return { sourceField: mirrorField, targetField: field };
  }

  private toIds(value: unknown): string[] {
    if (value === null || value === undefined) return [];

    let items: unknown[] = [value];
    if (Array.isArray(value)) items = value;

    const ids: string[] = [];
    for (const item of items) {
      if (typeof item === 'string' && item.length > 0) {
        ids.push(item);
        continue;
      }
      if (isRecord(item) && typeof item['_id'] === 'string') {
        ids.push(item['_id']);
      }
    }
    return ids;
  }
}
