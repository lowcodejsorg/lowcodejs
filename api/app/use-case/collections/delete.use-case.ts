import { Service } from 'fastify-decorators';

import { Either, left, right } from '@core/either.core';
import { buildCollection } from '@core/util.core';
import ApplicationException from '@exceptions/application.exception';
import { Collection } from '@model/collection.model';
import { GetCollectionBySlugSchema } from '@validators/collections.validator';
import z from 'zod';

type Response = Either<ApplicationException, null>;

@Service()
export default class DeleteCollectionUseCase {
  async execute(
    payload: z.infer<typeof GetCollectionBySlugSchema>,
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

      // Check if collection has any rows (data)
      try {
        const model = await buildCollection({
          ...collection.toJSON({
            flattenObjectIds: true,
          }),
          _id: collection._id.toString(),
        });

        const rowCount = await model.countDocuments();
        if (rowCount > 0) {
          return left(
            ApplicationException.Conflict(
              'Collection has data and cannot be deleted',
              'HAS_REFERENCES',
            ),
          );
        }
      } catch (error) {
        // If model build fails, collection structure is invalid, allow deletion
        console.warn('Could not check references, allowing deletion:', error);
      }

      await collection.deleteOne();

      return right(null);
    } catch (error) {
      console.error(error);
      return left(
        ApplicationException.InternalServerError(
          'Internal server error',
          'DELETE_COLLECTION_ERROR',
        ),
      );
    }
  }
}
