import { Service } from 'fastify-decorators';

import { Either, left, right } from '@core/either.core';
import ApplicationException from '@exceptions/application.exception';
import { Collection } from '@model/collection.model';
import { GetCollectionBySlugSchema } from '@validators/collections.validator';
import z from 'zod';

type Response = Either<
  ApplicationException,
  import('@core/entity.core').Collection
>;

@Service()
export default class SendCollectionToTrashUseCase {
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

      if (collection.trashed)
        return left(
          ApplicationException.Conflict(
            'Collection already in trash',
            'ALREADY_TRASHED',
          ),
        );

      await collection
        .set({
          ...collection.toJSON(),
          trashed: true,
          trashedAt: new Date(),
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

      return right({
        ...populated.toJSON(),
        _id: populated._id.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        ApplicationException.InternalServerError(
          'Internal server error',
          'SEND_COLLECTION_TO_TRASH_ERROR',
        ),
      );
    }
  }
}
