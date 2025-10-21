import { Either, left, right } from '@core/either.core';
import { buildCollection, buildPopulate } from '@core/util.core';
import ApplicationException from '@exceptions/application.exception';
import { Collection } from '@model/collection.model';
import { Reaction } from '@model/reaction.model';
import {
  GetRowCollectionByIdSchema,
  GetRowCollectionSlugSchema,
  ReactionRowCollectionSchema,
} from '@validators/row-collection.validator';
import { Service } from 'fastify-decorators';
import { ObjectId } from 'mongoose';
import z from 'zod';

type Response = Either<ApplicationException, import('@core/entity.core').Row>;

@Service()
export default class ReactionRowCollectionUseCase {
  async execute(
    payload: z.infer<typeof ReactionRowCollectionSchema> &
      z.infer<typeof GetRowCollectionByIdSchema> &
      z.infer<typeof GetRowCollectionSlugSchema>,
  ): Promise<Response> {
    try {
      const collection = await Collection.findOne({
        slug: payload.slug,
      }).populate([
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

      let c;
      try {
        c = await buildCollection({
          ...collection.toJSON({
            flattenObjectIds: true,
          }),
          _id: collection._id.toString(),
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
          collection.fields as import('@core/entity.core').Field[],
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

      let reaction = await Reaction.findOne({
        user: payload.user,
      });

      if (!reaction) {
        reaction = await Reaction.create({
          type: payload.type,
          user: payload.user,
        });
      }

      if (reaction) {
        await reaction
          .set({
            ...reaction.toJSON({
              flattenObjectIds: true,
            }),
            type: payload.type,
          })
          .save();
      }

      const reactions =
        row[payload.field]?.flatMap((r: ObjectId) => r?.toString()) ?? [];
      const reactionId = reaction?._id?.toString();

      // se não existir a reação adiciona o id na propriedade do registro
      if (!reactions.includes(reactionId))
        await row
          ?.set({
            ...row?.toJSON({
              flattenObjectIds: true,
            }),
            [payload.field]: [...reactions, reactionId],
          })
          .save();

      const populated = await row?.populate(populate);

      return right({
        ...populated?.toJSON({
          flattenObjectIds: true,
        }),
        _id: populated?._id.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        ApplicationException.InternalServerError(
          'Internal server error',
          'REACTION_ROW_COLLECTION_ERROR',
        ),
      );
    }
  }
}
