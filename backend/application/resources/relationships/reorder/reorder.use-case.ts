/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { RelationshipLinkContractRepository } from '@application/repositories/relationship-link/relationship-link-contract.repository';

import type { RelationshipReorderPayload } from './reorder.validator';

type Response = Either<HTTPException, null>;

@Service()
export default class RelationshipReorderUseCase {
  constructor(private readonly links: RelationshipLinkContractRepository) {}

  async execute(payload: RelationshipReorderPayload): Promise<Response> {
    try {
      for (const item of payload.items) {
        await this.links.setOrder(item.linkId, item.order);
      }
      return right(null);
    } catch (error) {
      console.error('[relationships > reorder][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'REORDER_RELATIONSHIP_LINKS_ERROR',
        ),
      );
    }
  }
}
