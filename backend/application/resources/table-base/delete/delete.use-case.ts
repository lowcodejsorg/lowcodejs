import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { Table } from '@application/model/table.model';

import type { TableDeleteParamValidator } from './delete.validator';

type Response = Either<HTTPException, null>;
type Payload = z.infer<typeof TableDeleteParamValidator>;

@Service()
export default class TableDeleteUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await Table.findOne({
        slug: payload.slug,
      });

      if (!table)
        return left(
          HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND'),
        );

      await table.deleteOne();
      return right(null);
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'DELETE_TABLE_ERROR',
        ),
      );
    }
  }
}
