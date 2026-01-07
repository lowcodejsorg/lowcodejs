import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { Table } from '@application/model/table.model';

import type { TableRemoveFromTrashParamValidator } from './remove-from-trash.validator';

type Response = Either<
  HTTPException,
  import('@application/core/entity.core').ITable
>;
type Payload = z.infer<typeof TableRemoveFromTrashParamValidator>;

@Service()
export default class TableRemoveFromTrashUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await Table.findOne({
        slug: payload.slug,
      });

      if (!table)
        return left(
          HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND'),
        );

      if (!table.trashed)
        return left(
          HTTPException.Conflict('table is not in trash', 'NOT_TRASHED'),
        );

      await table
        .set({
          ...table.toJSON(),
          trashed: false,
          trashedAt: null,
        })
        .save();

      const populated = await table?.populate([
        {
          path: 'configuration.administrators',
          select: 'name _id',
          model: 'User',
        },
        {
          path: 'logo',
          model: 'Storage',
        },
        {
          path: 'configuration.owner',
          select: 'name _id',
          model: 'User',
        },
        {
          path: 'fields',
          model: 'Field',
        },
      ]);

      return right({
        ...populated.toJSON(),
        _id: populated._id.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'REMOVE_TABLE_FROM_TRASH_ERROR',
        ),
      );
    }
  }
}
