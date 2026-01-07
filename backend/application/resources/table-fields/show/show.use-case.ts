import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { Field } from '@application/model/field.model';
import { Table } from '@application/model/table.model';

import type { TableFieldShowParamValidator } from './show.validator';

type Response = Either<
  HTTPException,
  import('@application/core/entity.core').IField
>;
type Payload = z.infer<typeof TableFieldShowParamValidator>;

@Service()
export default class TableFieldShowUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await Table.findOne({
        slug: payload.slug,
      });

      if (!table)
        return left(
          HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND'),
        );

      const field = await Field.findOne({ _id: payload._id });

      if (!field)
        return left(
          HTTPException.NotFound('Field not found', 'FIELD_NOT_FOUND'),
        );

      return right({
        ...field.toJSON({
          flattenObjectIds: true,
        }),
        _id: field._id.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'GET_FIELD_BY_ID_ERROR',
        ),
      );
    }
  }
}
