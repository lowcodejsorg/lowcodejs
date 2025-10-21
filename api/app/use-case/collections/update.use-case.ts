import { Either, left, right } from '@core/either.core';
import { buildCollection } from '@core/util.core';
import ApplicationException from '@exceptions/application.exception';
import { Collection } from '@model/collection.model';
import {
  GetCollectionBySlugSchema,
  UpdateCollectionSchema,
} from '@validators/collections.validator';
import { Service } from 'fastify-decorators';
import z from 'zod';

type Response = Either<
  ApplicationException,
  import('@core/entity.core').Collection
>;

@Service()
export default class UpdateCollectionUseCase {
  async execute(
    payload: z.infer<typeof UpdateCollectionSchema> &
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

      await collection
        .set({
          ...collection.toJSON(),
          ...payload,
          configuration: {
            ...collection?.toJSON()?.configuration,
            ...payload.configuration,
            administrators: payload.configuration?.administrators ?? [],
          },
        })
        .save();

      const populated = await collection?.populate([
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

      await buildCollection({
        ...populated.toJSON(),
        _id: populated._id.toString(),
      });

      return right({
        ...populated?.toJSON(),
        _id: populated._id.toString(),
      });
    } catch (error) {
      return left(
        ApplicationException.InternalServerError(
          'Internal server error',
          'UPDATE_COLLECTION_ERROR',
        ),
      );
    }
  }
}
