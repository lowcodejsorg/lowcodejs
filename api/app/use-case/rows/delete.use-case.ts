import { Service } from 'fastify-decorators';

import { Either, left, right } from '@core/either.core';
import { buildCollection } from '@core/util.core';
import ApplicationException from '@exceptions/application.exception';
import { Collection } from '@model/collection.model';
import {
  GetRowCollectionByIdSchema,
  GetRowCollectionSlugSchema,
} from '@validators/row-collection.validator';
import z from 'zod';

type Response = Either<ApplicationException, null>;

@Service()
export default class DeleteRowCollectionUseCase {
  async execute(
    payload: z.infer<typeof GetRowCollectionByIdSchema> &
      z.infer<typeof GetRowCollectionSlugSchema>,
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

      let c;
      try {
        c = await buildCollection({
          ...collection?.toJSON({
            flattenObjectIds: true,
          }),
          _id: collection?._id.toString(),
        });
      } catch (error) {
        console.error('Model build error:', error);
        return left(
          ApplicationException.InternalServerError(
            'Failed to build collection model',
            'MODEL_BUILD_FAILED',
          ),
        );
      }

      const row = await c.findOneAndDelete({
        _id: payload._id,
      });

      if (!row)
        return left(
          ApplicationException.NotFound('Row not found', 'ROW_NOT_FOUND'),
        );

      return right(null);
    } catch (error) {
      console.error(error);
      return left(
        ApplicationException.InternalServerError(
          'Internal server error',
          'DELETE_ROW_ERROR',
        ),
      );
    }
  }
}
