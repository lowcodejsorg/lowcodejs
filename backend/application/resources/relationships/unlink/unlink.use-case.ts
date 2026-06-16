/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { RelationshipDefinitionContractRepository } from '@application/repositories/relationship-definition/relationship-definition-contract.repository';
import { RelationshipContractService } from '@application/services/relationship/relationship-contract.service';

import type { RelationshipUnlinkPayload } from './unlink.validator';

type Response = Either<HTTPException, null>;

@Service()
export default class RelationshipUnlinkUseCase {
  constructor(
    private readonly relationship: RelationshipContractService,
    private readonly definitions: RelationshipDefinitionContractRepository,
  ) {}

  async execute(payload: RelationshipUnlinkPayload): Promise<Response> {
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

      // Desvincular é N:N-only. 1:1/1:N limpam a FK via atualização do registro.
      const isPivot = await this.relationship.isPivot(definition);
      if (!isPivot) {
        return left(
          HTTPException.BadRequest(
            'Relacionamentos 1:1 e 1:N são geridos pela atualização do registro, não por vínculos',
            'RELATIONSHIP_NOT_PIVOT',
          ),
        );
      }

      const result = await this.relationship.unlink(payload.linkId);
      if (result.isLeft()) return left(result.value);
      return right(null);
    } catch (error) {
      console.error('[relationships > unlink][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'UNLINK_RELATIONSHIP_ERROR',
        ),
      );
    }
  }
}
