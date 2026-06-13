/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IMeta, IRelationshipLink } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { RelationshipLinkContractRepository } from '@application/repositories/relationship-link/relationship-link-contract.repository';

import type { RelationshipListBySidePayload } from './list-by-side.validator';

type ListResult = { data: IRelationshipLink[]; meta: IMeta };
type Response = Either<HTTPException, ListResult>;

@Service()
export default class RelationshipListBySideUseCase {
  constructor(private readonly links: RelationshipLinkContractRepository) {}

  async execute(payload: RelationshipListBySidePayload): Promise<Response> {
    try {
      const { data, total } = await this.links.paginateBySide({
        relationshipId: payload.id,
        side: payload.side,
        recordId: payload.recordId,
        page: payload.page,
        perPage: payload.perPage,
      });

      const lastPage = Math.max(1, Math.ceil(total / payload.perPage));

      return right({
        data,
        meta: {
          total,
          page: payload.page,
          perPage: payload.perPage,
          lastPage,
          firstPage: 1,
        },
      });
    } catch (error) {
      console.error('[relationships > list-by-side][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'LIST_RELATIONSHIP_LINKS_ERROR',
        ),
      );
    }
  }
}
