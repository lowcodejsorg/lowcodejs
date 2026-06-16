/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IRelationshipLink } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import { RelationshipDefinitionContractRepository } from '@application/repositories/relationship-definition/relationship-definition-contract.repository';
import { RelationshipContractService } from '@application/services/relationship/relationship-contract.service';

import type { RelationshipLinkRequestPayload } from './link.validator';

type Response = Either<HTTPException, IRelationshipLink>;

@Service()
export default class RelationshipLinkUseCase {
  constructor(
    private readonly definitions: RelationshipDefinitionContractRepository,
    private readonly fields: FieldContractRepository,
    private readonly relationship: RelationshipContractService,
  ) {}

  async execute(payload: RelationshipLinkRequestPayload): Promise<Response> {
    try {
      const definition = await this.definitions.findById(payload.id);
      if (!definition) {
        return left(
          HTTPException.NotFound(
            'Relacionamento não encontrado',
            'RELATIONSHIP_NOT_FOUND',
          ),
        );
      }

      const sourceField = await this.fields.findById(
        definition.source.field._id,
      );
      const targetField = await this.fields.findById(
        definition.target.field._id,
      );
      if (!sourceField || !targetField) {
        return left(
          HTTPException.NotFound(
            'Campo do relacionamento não encontrado',
            'RELATIONSHIP_FIELD_NOT_FOUND',
          ),
        );
      }

      // Vínculos só existem em N:N (pivô). 1:1/1:N gerem a FK via atualização do
      // registro — bloquear aqui evita criar links órfãos que nada lê.
      const isPivot = await this.relationship.isPivot(definition);
      if (!isPivot) {
        return left(
          HTTPException.BadRequest(
            'Relacionamentos 1:1 e 1:N são geridos pela atualização do registro, não por vínculos',
            'RELATIONSHIP_NOT_PIVOT',
          ),
        );
      }

      // Vincular pelos dois lados (§5.4): de source fixa sourceId; de target
      // fixa targetId.
      let sourceId = payload.otherId;
      let targetId = payload.recordId;
      if (payload.side === 'source') {
        sourceId = payload.recordId;
        targetId = payload.otherId;
      }

      const result = await this.relationship.link({
        definition,
        sourceField: { multiple: sourceField.multiple },
        targetField: { multiple: targetField.multiple },
        sourceId,
        targetId,
        metadata: payload.metadata ?? null,
      });

      if (result.isLeft()) return left(result.value);
      return right(result.value);
    } catch (error) {
      console.error('[relationships > link][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'LINK_RELATIONSHIP_ERROR',
        ),
      );
    }
  }
}
