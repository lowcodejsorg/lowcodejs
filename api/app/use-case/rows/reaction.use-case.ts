/* eslint-disable @typescript-eslint/consistent-type-imports */
import { Service } from 'fastify-decorators';
import type { ObjectId } from 'mongoose';
import type z from 'zod';

import type { Either } from '@core/either.core';
import { left, right } from '@core/either.core';
import { buildCollection, buildPopulate } from '@core/util.core';
import ApplicationException from '@exceptions/application.exception';
import { Collection } from '@model/collection.model';
import { Reaction } from '@model/reaction.model';
import type {
  GetRowCollectionByIdSchema,
  GetRowCollectionSlugSchema,
  ReactionRowCollectionSchema,
} from '@validators/row-collection.validator';

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

      const c = await buildCollection({
        ...collection.toJSON({
          flattenObjectIds: true,
        }),
        _id: collection._id.toString(),
      });

      const populate = await buildPopulate(
        collection.fields as import('@core/entity.core').Field[],
      );

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
