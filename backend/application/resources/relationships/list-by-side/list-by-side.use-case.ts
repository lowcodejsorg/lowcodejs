/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IMeta, IRelationshipLink } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { RelationshipDefinitionContractRepository } from '@application/repositories/relationship-definition/relationship-definition-contract.repository';
import { RelationshipLinkContractRepository } from '@application/repositories/relationship-link/relationship-link-contract.repository';
import { RelationshipContractService } from '@application/services/relationship/relationship-contract.service';

import type { RelationshipListBySidePayload } from './list-by-side.validator';

type ListResult = { data: IRelationshipLink[]; meta: IMeta };
type Response = Either<HTTPException, ListResult>;

@Service()
export default class RelationshipListBySideUseCase {
  constructor(
    private readonly links: RelationshipLinkContractRepository,
    private readonly definitions: RelationshipDefinitionContractRepository,
    private readonly relationship: RelationshipContractService,
  ) {}

  async execute(payload: RelationshipListBySidePayload): Promise<Response> {
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

      // Listagem por vínculo é N:N-only. 1:1/1:N listam os filhos via paginação
      // de row do lado filho filtrada pela FK (endpoint de rows).
      const isPivot = await this.relationship.isPivot(definition);
      if (!isPivot) {
        return left(
          HTTPException.BadRequest(
            'Relacionamentos 1:1 e 1:N são listados pela paginação de registros, não por vínculos',
            'RELATIONSHIP_NOT_PIVOT',
          ),
        );
      }

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
