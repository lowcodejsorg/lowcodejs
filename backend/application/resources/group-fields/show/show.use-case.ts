/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IField as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { GroupFieldShowPayload } from './show.validator';

type Response = Either<HTTPException, Entity>;
type Payload = GroupFieldShowPayload;

@Service()
export default class GroupFieldShowUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly fieldRepository: FieldContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBy({
        slug: payload.slug,
        exact: true,
      });

      if (!table)
        return left(
          HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND'),
        );

      const targetGroup = table.groups?.find(
        (g) => g.slug === payload.groupSlug,
      );
      if (!targetGroup) {
        return left(
          HTTPException.NotFound('Group not found', 'GROUP_NOT_FOUND'),
        );
      }

      const field = await this.fieldRepository.findBy({
        _id: payload.fieldId,
        exact: true,
      });

      if (!field)
        return left(
          HTTPException.NotFound('Field not found', 'FIELD_NOT_FOUND'),
        );

      return right(field);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'GET_GROUP_FIELD_ERROR',
        ),
      );
    }
  }
}
