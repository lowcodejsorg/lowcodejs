import { Either, left, right } from '@core/either.core';
import { buildCollection, buildPopulate } from '@core/util.core';
import ApplicationException from '@exceptions/application.exception';
import { Collection } from '@model/collection.model';
import {
  GetRowCollectionByIdSchema,
  GetRowCollectionSlugSchema,
} from '@validators/row-collection.validator';
import { Service } from 'fastify-decorators';
import z from 'zod';

type Response = Either<ApplicationException, import('@core/entity.core').Row>;

@Service()
export default class RemoveRowCollectionFromTrashUseCase {
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

      let populate;
      try {
        populate = await buildPopulate(
          collection?.fields as import('@core/entity.core').Field[],
        );
      } catch (error) {
        console.error('Populate build error:', error);
        return left(
          ApplicationException.InternalServerError(
            'Failed to build populate strategy',
            'POPULATE_BUILD_FAILED',
          ),
        );
      }

      const row = await c.findOne({
        _id: payload._id,
      });

      if (!row)
        return left(
          ApplicationException.NotFound('Row not found', 'ROW_NOT_FOUND'),
        );

      if (!row.trashed)
        return left(
          ApplicationException.Conflict(
            'Row is not in trash',
            'NOT_TRASHED',
          ),
        );

      await row
        .set({
          ...row.toJSON({
            flattenObjectIds: true,
          }),
          trashed: false,
          trashedAt: null,
        })
        .save();

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
          'REMOVE_ROW_FROM_TRASH_ERROR',
        ),
      );
    }
  }
}
