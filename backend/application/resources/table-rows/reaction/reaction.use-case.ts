import { Service } from 'fastify-decorators';
import type { ObjectId } from 'mongoose';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { buildPopulate, buildTable } from '@application/core/util.core';
import { Reaction } from '@application/model/reaction.model';
import { Table } from '@application/model/table.model';

import type {
  TableRowReactionBodyValidator,
  TableRowReactionParamValidator,
} from './reaction.validator';

type Response = Either<
  HTTPException,
  import('@application/core/entity.core').Row
>;

type Payload = z.infer<typeof TableRowReactionBodyValidator> &
  z.infer<typeof TableRowReactionParamValidator>;

@Service()
export default class TableRowReactionUseCase {
  async execute(payload: Payload): Promise<Response> {
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
        HTTPException.InternalServerError(
          'Internal server error',
          'REACTION_ROW_TABLE_ERROR',
        ),
      );
    }
  }
}
