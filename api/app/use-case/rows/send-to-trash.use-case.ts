/* eslint-disable @typescript-eslint/consistent-type-imports */
import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@core/either.core';
import { left, right } from '@core/either.core';
import { buildCollection, buildPopulate } from '@core/util.core';
import ApplicationException from '@exceptions/application.exception';
import { Collection } from '@model/collection.model';
import type {
  GetRowCollectionByIdSchema,
  GetRowCollectionSlugSchema,
} from '@validators/row-collection.validator';

type Response = Either<ApplicationException, import('@core/entity.core').Row>;

@Service()
export default class SendRowCollectionToTrashUseCase {
  async execute(
    payload: z.infer<typeof GetRowCollectionByIdSchema> &
      z.infer<typeof GetRowCollectionByIdSchema> &
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

      const c = await buildCollection({
        ...collection?.toJSON({
          flattenObjectIds: true,
        }),
        _id: collection?._id.toString(),
      });

      const populate = await buildPopulate(
        collection?.fields as import('@core/entity.core').Field[],
      );

      const row = await c.findOne({
        _id: payload._id,
      });

      if (!row)
        return left(
          ApplicationException.NotFound('Row not found', 'ROW_NOT_FOUND'),
        );

      if (row.trashed)
        return left(
          ApplicationException.Conflict(
            'Row already in trash',
            'ALREADY_TRASHED',
          ),
        );

      await row.updateOne({
        trashed: true,
        trashedAt: new Date(),
      });

      const populated = await row.populate(populate);

      return right({
        ...populated.toJSON({
          flattenObjectIds: true,
        }),
        _id: populated._id.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        ApplicationException.InternalServerError(
          'Internal server error',
          'SEND_ROW_COLLECTION_TO_TRASH_ERROR',
        ),
      );
    }
  }
}
