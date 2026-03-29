/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import type { ObjectId } from 'mongoose';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IField } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import {
  buildPopulate,
  buildTable,
  transformRowContext,
} from '@application/core/util.core';
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
      const table = await this.tableRepository.findBySlug(payload.slug);

      if (!table)
        return left(
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );

      const c = await buildTable(table);

      const populate = await buildPopulate(
        table.fields as IField[],
        table.groups,
      );

      const row = await c.findOne({
        _id: payload._id,
      });

      if (!row)
        return left(
          HTTPException.NotFound('Registro não encontrado', 'ROW_NOT_FOUND'),
        );

      const existingIds: string[] =
        row[payload.field]?.flatMap((r: ObjectId) => r?.toString()) ?? [];

      let oldReactionId: string | null = null;

      for (const id of existingIds) {
        const found = await this.reactionRepository.findByIdAndUser(
          id,
          payload.user,
        );
        if (found) {
          oldReactionId = found._id;
          break;
        }
      }

      const reaction = await this.reactionRepository.create({
        type: payload.type,
        user: payload.user,
      });

      const reactionId = reaction._id.toString();

      if (oldReactionId) {
        const updatedIds = existingIds.map((id) =>
          id === oldReactionId ? reactionId : id,
        );
        await row.set(payload.field, updatedIds).save();
        await this.reactionRepository.delete(oldReactionId);
      } else {
        await row.set(payload.field, [...existingIds, reactionId]).save();
      }

      const populated = await row?.populate(populate);

      const rowJson = {
        ...populated?.toJSON({
          flattenObjectIds: true,
        }),
        _id: populated?._id.toString(),
      };

      return right(
        transformRowContext(rowJson, table.fields as IField[], payload.user),
      );
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'REACTION_ROW_TABLE_ERROR',
        ),
      );
    }
  }
}
