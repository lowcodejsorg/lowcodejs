import { Either, left, right } from '@core/either.core';
import { buildCollection, buildPopulate } from '@core/util.core';
import ApplicationException from '@exceptions/application.exception';
import { Collection } from '@model/collection.model';
import { Evaluation } from '@model/evaluation.model';
import {
  EvaluationRowCollectionSchema,
  GetRowCollectionByIdSchema,
  GetRowCollectionSlugSchema,
} from '@validators/row-collection.validator';
import { Service } from 'fastify-decorators';
import { ObjectId } from 'mongoose';
import z from 'zod';

type Response = Either<ApplicationException, import('@core/entity.core').Row>;

@Service()
export default class EvaluationRowCollectionUseCase {
  async execute(
    payload: z.infer<typeof EvaluationRowCollectionSchema> &
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
      // .populate(populate);

      if (!row)
        return left(
          ApplicationException.NotFound('Row not found', 'ROW_NOT_FOUND'),
        );

      let evaluation = await Evaluation.findOne({
        user: payload.user,
      });

      if (!evaluation) {
        evaluation = await Evaluation.create({
          value: payload.value,
          user: payload.user,
        });
      }

      if (evaluation) {
        await evaluation
          .set({
            ...evaluation.toJSON(),
            value: payload.value,
          })
          .save();
      }

      const evaluations =
        row[payload.field]?.flatMap((r: ObjectId) => r?.toString()) ?? [];
      const evaluationId = evaluation?._id?.toString();

      if (!evaluations.includes(evaluationId))
        await row
          ?.set({
            ...row?.toJSON({
              flattenObjectIds: true,
            }),
            [payload.field]: [...evaluations, evaluationId],
          })
          .save();

      const populated = await row?.populate(populate);

      return right({
        ...populated?.toJSON({
          flattenObjectIds: true,
        }),
        _id: populated?._id?.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        ApplicationException.InternalServerError(
          'Internal server error',
          'EVALUATION_ROW_COLLECTION_ERROR',
        ),
      );
    }
  }
}
