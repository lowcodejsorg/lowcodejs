/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IField } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { GroupFieldListPayload } from './list.validator';

type Response = Either<HTTPException, IField[]>;
type Payload = GroupFieldListPayload;

@Service()
export default class GroupFieldListUseCase {
  constructor(private readonly tableRepository: TableContractRepository) {}

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

      return right(targetGroup.fields || []);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'LIST_GROUP_FIELDS_ERROR',
        ),
      );
    }
  }
}
