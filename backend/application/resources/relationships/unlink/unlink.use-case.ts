/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { RelationshipContractService } from '@application/services/relationship/relationship-contract.service';

import type { RelationshipUnlinkPayload } from './unlink.validator';

type Response = Either<HTTPException, null>;

@Service()
export default class RelationshipUnlinkUseCase {
  constructor(private readonly relationship: RelationshipContractService) {}

  async execute(payload: RelationshipUnlinkPayload): Promise<Response> {
    try {
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
