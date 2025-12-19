import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { buildSchema } from '@application/core/util.core';
import { Field } from '@application/model/field.model';
import { Table } from '@application/model/table.model';

import type { TableFieldRemoveFromTrashParamValidator } from './remove-from-trash.validator';

type Response = Either<
  HTTPException,
  import('@application/core/entity.core').Field
>;
type Payload = z.infer<typeof TableFieldRemoveFromTrashParamValidator>;

@Service()
export default class TableFieldRemoveFromTrashUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await Table.findOne({
        slug: payload.slug,
      }).populate([
        {
          path: 'fields',
          model: 'Field',
        },
      ]);

      if (!table)
        return left(
          HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND'),
        );

      const field = await Field.findOne({ _id: payload._id });

      if (!field)
        return left(
          HTTPException.NotFound('Field not found', 'FIELD_NOT_FOUND'),
        );

      if (!field.trashed)
        return left(
          HTTPException.Conflict('Field is not in trash', 'NOT_TRASHED'),
        );

      await field
        .set({
          ...field.toJSON({
            flattenObjectIds: true,
          }),
          configuration: {
            ...field?.toJSON({
              flattenObjectIds: true,
            })?.configuration,
            listing: true,
            filtering: true,
            required: false,
          },
          trashedAt: null,
          trashed: false,
        })
        .save();

      const fields = (
        table.fields as import('@application/core/entity.core').Field[]
      ).map((f) => {
        if (f._id?.toString() === field._id?.toString()) {
          return {
            ...field?.toJSON({
              flattenObjectIds: true,
            }),
            _id: field?._id?.toString(),
          };
        }

        return f;
      });

      const _schema = buildSchema(fields);

      await table
        .set({
          ...table.toJSON({
            flattenObjectIds: true,
          }),
          fields: fields.flatMap((f) => f?._id?.toString()),
          _schema,
        })
        .save();

      return right({
        ...field.toJSON({
          flattenObjectIds: true,
        }),
        _id: field._id?.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'REMOVE_FIELD_FROM_TRASH_ERROR',
        ),
      );
    }
  }
}
