/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { ITable as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { TableShowPayload } from './show.validator';

type Response = Either<HTTPException, Entity>;
type Payload = TableShowPayload;

@Service()
export default class TableShowUseCase {
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

      return right(table);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'GET_TABLE_BY_SLUG_ERROR',
        ),
      );
    }
  }
}
