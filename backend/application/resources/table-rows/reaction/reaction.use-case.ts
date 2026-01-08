/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import type { ObjectId } from 'mongoose';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IField } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { buildPopulate, buildTable } from '@application/core/util.core';
import { ReactionContractRepository } from '@application/repositories/reaction/reaction-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { TableRowReactionPayload } from './reaction.validator';

type Response = Either<
  HTTPException,
  import('@application/core/entity.core').IRow
>;

type Payload = TableRowReactionPayload;

@Service()
export default class TableRowReactionUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly reactionRepository: ReactionContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBy({
        slug: payload.slug,
        exact: true,
      });

      if (!table)
        return left(
          HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND'),
        );

      const c = await buildTable(table);

      const populate = await buildPopulate(table.fields as IField[]);

      const row = await c.findOne({
        _id: payload._id,
      });

      if (!row)
        return left(HTTPException.NotFound('Row not found', 'ROW_NOT_FOUND'));

      let reaction = await this.reactionRepository.findBy({
        user: payload.user,
        exact: true,
      });

      if (!reaction) {
        reaction = await this.reactionRepository.create({
          type: payload.type,
          user: payload.user,
        });
      } else {
        reaction = await this.reactionRepository.update({
          _id: reaction._id,
          type: payload.type,
        });
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
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'REACTION_ROW_TABLE_ERROR',
        ),
      );
    }
  }
}
