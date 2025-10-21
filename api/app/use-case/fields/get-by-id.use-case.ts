import { Service } from 'fastify-decorators';

import { Either, left, right } from '@core/either.core';
import ApplicationException from '@exceptions/application.exception';
import { Collection } from '@model/collection.model';
import { Field } from '@model/field.model';
import { GetCollectionBySlugSchema } from '@validators/collections.validator';
import { GetFieldCollectionByIdSchema } from '@validators/field-collection.validator';
import z from 'zod';

type Response = Either<ApplicationException, import('@core/entity.core').Field>;

@Service()
export default class GetFieldByIdUseCase {
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
          'GET_FIELD_BY_ID_ERROR',
        ),
      );
    }
  }
}
