import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { buildSchema } from '@application/core/util.core';
import { Field } from '@application/model/field.model';
import { Table } from '@application/model/table.model';

import type { TableFieldSendToTrashParamValidator } from './send-to-trash.validator';

type Response = Either<
  HTTPException,
  import('@application/core/entity.core').IField
>;

type Payload = z.infer<typeof TableFieldSendToTrashParamValidator>;

@Service()
export default class TableFieldSendToTrashUseCase {
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

      if (field.trashed)
        return left(
          HTTPException.Conflict('Field already in trash', 'ALREADY_TRASHED'),
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
            listing: false,
            filtering: false,
            required: false,
          },
          trashed: true,
          trashedAt: new Date(),
        })
        .save();

      const fields = (
        table.fields as import('@application/core/entity.core').IField[]
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
          fields: fields?.flatMap((c) => c?._id?.toString()),
          _schema,
        })
        .save();

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
          'SEND_FIELD_TO_TRASH_ERROR',
        ),
      );
    }
  }
}
