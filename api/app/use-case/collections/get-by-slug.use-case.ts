import { Service } from 'fastify-decorators';

import { Either, left, right } from '@core/either.core';
import ApplicationException from '@exceptions/application.exception';
import { Collection as Model } from '@model/collection.model';
import {
  GetCollectionBySlugSchema,
  GetCollectionQuerySchema,
} from '@validators/collections.validator';
import z from 'zod';

type Response = Either<
  ApplicationException,
  import('@core/entity.core').Collection
>;

@Service()
export default class GetCollectionBySlugUseCase {
  async execute(
    payload: z.infer<typeof GetCollectionQuerySchema> &
      z.infer<typeof GetCollectionBySlugSchema>,
  ): Promise<Response> {
    try {
      const collection = await Model.findOne({ slug: payload.slug }).populate([
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

      if (!collection)
        return left(
          ApplicationException.NotFound(
            'Collection not found',
            'COLLECTION_NOT_FOUND',
          ),
        );

      const isPublic = payload.public && payload.public === 'true';

      if (isPublic && collection?.configuration?.visibility !== 'public')
        return left(
          ApplicationException.BadRequest(
            'Collection is not public',
            'COLLECTION_NOT_PUBLIC',
          ),
        );

      return right({
        ...collection.toJSON(),
        _id: collection._id.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        ApplicationException.InternalServerError(
          'Internal server error',
          'GET_COLLECTION_BY_SLUG_ERROR',
        ),
      );
    }
  }
}
