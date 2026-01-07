import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { Table as Model } from '@application/model/table.model';

import type { TableShowParamValidator } from './show.validator';

type Response = Either<
  HTTPException,
  import('@application/core/entity.core').ITable
>;

type Payload = z.infer<typeof TableShowParamValidator>;

@Service()
export default class TableShowUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await Model.findOne({ slug: payload.slug }).populate([
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

      if (!table)
        return left(
          HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND'),
        );

      return right({
        ...table.toJSON(),
        _id: table._id.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'GET_TABLE_BY_SLUG_ERROR',
        ),
      );
    }
  }
}
