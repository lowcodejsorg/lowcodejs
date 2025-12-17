import { Service } from 'fastify-decorators';
import type { ObjectId } from 'mongoose';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { buildPopulate, buildTable } from '@application/core/util.core';
import { Evaluation } from '@application/model/evaluation.model';
import { Table } from '@application/model/table.model';

import type {
  TableRowEvaluationBodyValidator,
  TableRowEvaluationParamValidator,
} from './evaluation.validator';

type Response = Either<
  HTTPException,
  import('@application/core/entity.core').Row
>;

@Service()
export default class TableRowEvaluationUseCase {
  async execute(
    payload: z.infer<typeof TableRowEvaluationBodyValidator> &
      z.infer<typeof TableRowEvaluationParamValidator>,
  ): Promise<Response> {
    try {
      const table = await Table.findOne({
        slug: payload.slug,
      }).populate([
        {
          path: 'fields',
          model: 'Field',
        },
      ]);

      if (!table)
        return left(
          HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND'),
        );

      const c = await buildTable({
        ...table.toJSON({
          flattenObjectIds: true,
        }),
        _id: table._id.toString(),
      });

      const populate = await buildPopulate(
        table.fields as import('@application/core/entity.core').Field[],
      );

      const row = await c.findOne({
        _id: payload._id,
      });

      if (!row)
        return left(HTTPException.NotFound('Row not found', 'ROW_NOT_FOUND'));

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
        HTTPException.InternalServerError(
          'Internal server error',
          'EVALUATION_ROW_TABLE_ERROR',
        ),
      );
    }
  }
}
