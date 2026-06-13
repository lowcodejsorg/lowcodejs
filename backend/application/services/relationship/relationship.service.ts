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
}
