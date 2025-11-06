import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { buildTable } from '@application/core/util.core';
import { Table } from '@application/model/table.model';

import type { TableRowDeleteParamValidator } from './delete.validator';

type Response = Either<HTTPException, null>;
type Payload = z.infer<typeof TableRowDeleteParamValidator>;
@Service()
export default class TableRowDeleteUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await Table.findOne({
        slug: payload.slug,
      });

      if (!table)
        return left(
          HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND'),
        );

      const c = await buildTable({
        ...table?.toJSON({
          flattenObjectIds: true,
        }),
        _id: table?._id.toString(),
      });

      const row = await c.findOneAndDelete({
        _id: payload._id,
      });

      if (!row)
        return left(HTTPException.NotFound('Row not found', 'ROW_NOT_FOUND'));

      return right(null);
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'DELETE_ROW_ERROR',
        ),
      );
    }
  }
}
