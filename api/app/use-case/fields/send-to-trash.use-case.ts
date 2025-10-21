import { Either, left, right } from '@core/either.core';
import { buildSchema } from '@core/util.core';
import ApplicationException from '@exceptions/application.exception';
import { Collection } from '@model/collection.model';
import { Field } from '@model/field.model';
import { GetCollectionBySlugSchema } from '@validators/collections.validator';
import { GetFieldCollectionByIdSchema } from '@validators/field-collection.validator';
import { Service } from 'fastify-decorators';
import z from 'zod';

type Response = Either<ApplicationException, import('@core/entity.core').Field>;

@Service()
export default class SendFieldToTrashUseCase {
  async execute(
    payload: z.infer<typeof GetFieldCollectionByIdSchema> &
      z.infer<typeof GetCollectionBySlugSchema>,
  ): Promise<Response> {
    try {
      const collection = await Collection.findOne({
        slug: payload.slug,
      });

      if (!collection)
        return left(
          ApplicationException.NotFound(
            'Collection not found',
            'COLLECTION_NOT_FOUND',
          ),
        );

      const field = await Field.findOne({ _id: payload._id });

      if (!field)
        return left(
          ApplicationException.NotFound('Field not found', 'FIELD_NOT_FOUND'),
        );

      if (field.trashed)
        return left(
          ApplicationException.Conflict(
            'Field already in trash',
            'ALREADY_TRASHED',
          ),
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
        collection.fields as import('@core/entity.core').Field[]
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

      await collection
        .set({
          ...collection.toJSON({
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
        ApplicationException.InternalServerError(
          'Internal server error',
          'SEND_FIELD_TO_TRASH_ERROR',
        ),
      );
    }
  }
}
