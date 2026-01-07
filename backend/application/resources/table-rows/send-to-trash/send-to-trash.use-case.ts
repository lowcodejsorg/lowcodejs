import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { buildPopulate, buildTable } from '@application/core/util.core';
import { Table } from '@application/model/table.model';

import type { TableRowSendToTrashParamValidator } from './send-to-trash.validator';

type Response = Either<
  HTTPException,
  import('@application/core/entity.core').IRow
>;

type Payload = z.infer<typeof TableRowSendToTrashParamValidator>;

@Service()
export default class TableRowSendToTrashUseCase {
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

      const populate = await buildPopulate(
        table?.fields as import('@application/core/entity.core').IField[],
      );

      const row = await c.findOne({
        _id: payload._id,
      });

      if (!row)
        return left(HTTPException.NotFound('Row not found', 'ROW_NOT_FOUND'));

      if (row.trashed)
        return left(
          HTTPException.Conflict('Row already in trash', 'ALREADY_TRASHED'),
        );

      await row.updateOne({
        trashed: true,
        trashedAt: new Date(),
      });

      const populated = await row.populate(populate);

      return right({
        ...populated.toJSON({
          flattenObjectIds: true,
        }),
        _id: populated._id.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'SEND_ROW_TABLE_TO_TRASH_ERROR',
        ),
      );
    }
  }
}
