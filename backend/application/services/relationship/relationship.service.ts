/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type {
  IField,
  IRelationshipDefinition,
  IRelationshipLink,
  ValueOf,
} from '@application/core/entity.core';
import { E_RELATIONSHIP_CARDINALITY } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import {
  RelationshipLinkContractRepository,
  type RelationshipLinkSide,
} from '@application/repositories/relationship-link/relationship-link-contract.repository';

import type {
  RelationshipCanLinkParams,
  RelationshipContractService,
  RelationshipLinkParams,
  RelationshipReplaceParams,
} from './relationship-contract.service';

// Cardinalidade derivada dos dois `field.multiple` (nao persistida, §5.2).
export class RelationshipCardinality {
  static of(
    sourceField: Pick<IField, 'multiple'>,
    targetField: Pick<IField, 'multiple'>,
  ): ValueOf<typeof E_RELATIONSHIP_CARDINALITY> {
    const a = sourceField.multiple;
    const b = targetField.multiple;
    if (!a && !b) return E_RELATIONSHIP_CARDINALITY.ONE_TO_ONE;
    if (a && b) return E_RELATIONSHIP_CARDINALITY.MANY_TO_MANY;
    return E_RELATIONSHIP_CARDINALITY.ONE_TO_MANY;
  }
}

@Service()
export default class RelationshipService implements RelationshipContractService {
  constructor(
    private readonly linkRepository: RelationshipLinkContractRepository,
  ) {}

  cardinalityOf(
    sourceField: Pick<IField, 'multiple'>,
    targetField: Pick<IField, 'multiple'>,
  ): ValueOf<typeof E_RELATIONSHIP_CARDINALITY> {
    return RelationshipCardinality.of(sourceField, targetField);
  }

  async canLink(
    params: RelationshipCanLinkParams,
  ): Promise<Either<HTTPException, true>> {
    const { definition, sourceField, targetField, sourceId, targetId } = params;

    // Auto-relacionamento (§4.5): bloquear vinculo trivial consigo mesmo.
    if (sourceId === targetId) {
      return left(
        HTTPException.BadRequest(
          'Um registro nao pode se vincular a si mesmo',
          'RELATIONSHIP_SELF_LINK',
        ),
      );
    }

    const duplicate = await this.linkRepository.exists({
      relationshipId: definition._id,
      sourceId,
      targetId,
    });
    if (duplicate) {
      return left(
        HTTPException.Conflict(
          'Vinculo ja existe',
          'RELATIONSHIP_LINK_DUPLICATE',
        ),
      );
    }

    if (!sourceField.multiple) {
      const used = await this.linkRepository.count(definition._id, {
        sourceId,
      });
      if (used > 0) {
        return left(
          HTTPException.Conflict(
            'Este lado nao aceita multiplos vinculos',
            'RELATIONSHIP_SOURCE_LIMIT',
          ),
        );
      }
    }

    if (!targetField.multiple) {
      const used = await this.linkRepository.count(definition._id, {
        targetId,
      });
      if (used > 0) {
        return left(
          HTTPException.Conflict(
            'Este lado nao aceita multiplos vinculos',
            'RELATIONSHIP_TARGET_LIMIT',
          ),
        );
      }
    }

    return right(true);
  }

  async link(
    params: RelationshipLinkParams,
  ): Promise<Either<HTTPException, IRelationshipLink>> {
    const allowed = await this.canLink(params);
    if (allowed.isLeft()) return left(allowed.value);

    const order = await this.linkRepository.count(params.definition._id, {
      sourceId: params.sourceId,
    });

    const created = await this.linkRepository.create({
      relationshipId: params.definition._id,
      sourceId: params.sourceId,
      targetId: params.targetId,
      order,
      metadata: params.metadata ?? null,
    });

    return right(created);
  }

  async unlink(linkId: string): Promise<Either<HTTPException, true>> {
    const link = await this.linkRepository.findById(linkId);
    if (!link) {
      return left(
        HTTPException.NotFound(
          'Vinculo nao encontrado',
          'RELATIONSHIP_LINK_NOT_FOUND',
        ),
      );
    }

    await this.linkRepository.delete(linkId);
    return right(true);
  }

  async resolveLinkedIds(
    definition: IRelationshipDefinition,
    recordId: string,
    side: RelationshipLinkSide,
  ): Promise<string[]> {
    if (side === 'source') {
      const found = await this.linkRepository.findBySource(
        definition._id,
        recordId,
      );
      return found.map((link) => link.targetId);
    }

    const found = await this.linkRepository.findByTarget(
      definition._id,
      recordId,
    );
    return found.map((link) => link.sourceId);
  }

  async replaceLinks(
    params: RelationshipReplaceParams,
  ): Promise<Either<HTTPException, true>> {
    const { definition, recordId, side, desiredIds, sourceField, targetField } =
      params;

    // Conjunto desejado deduplicado, preservando a ordem de entrada.
    const desired: string[] = [];
    for (const id of desiredIds) {
      if (id && !desired.includes(id)) desired.push(id);
    }

    const existing = await this.resolveLinkedIds(definition, recordId, side);
    const existingSet = new Set(existing);
    const desiredSet = new Set(desired);

    // Remove os vinculos que sairam do conjunto desejado.
    const links = await this.linksOnSide(definition._id, recordId, side);
    for (const link of links) {
      let otherId = link.sourceId;
      if (side === 'source') otherId = link.targetId;
      if (!desiredSet.has(otherId)) {
        await this.linkRepository.delete(link._id);
      }
    }

    // Adiciona os vinculos novos (na ordem desejada), aplicando canLink.
    for (const otherId of desired) {
      if (existingSet.has(otherId)) continue;

      let sourceId = otherId;
      let targetId = recordId;
      if (side === 'source') {
        sourceId = recordId;
        targetId = otherId;
      }

      const linked = await this.link({
        definition,
        sourceField,
        targetField,
        sourceId,
        targetId,
      });
      if (linked.isLeft()) return left(linked.value);
    }

    return right(true);
  }

  private async linksOnSide(
    relationshipId: string,
    recordId: string,
    side: RelationshipLinkSide,
  ): Promise<IRelationshipLink[]> {
    if (side === 'source') {
      return this.linkRepository.findBySource(relationshipId, recordId);
    }
    return this.linkRepository.findByTarget(relationshipId, recordId);
  }
}
