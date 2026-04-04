/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import { transformRowContext } from '@application/core/builders';
import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { ReactionContractRepository } from '@application/repositories/reaction/reaction-contract.repository';
import { RowContractRepository } from '@application/repositories/row/row-contract.repository';
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
    private readonly rowRepository: RowContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBySlug(payload.slug);

      if (!table)
        return left(
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );

      const row = await this.rowRepository.findOne({
        table,
        query: { _id: payload._id },
      });

      if (!row)
        return left(
          HTTPException.NotFound('Registro não encontrado', 'ROW_NOT_FOUND'),
        );

      const fieldValue = row[payload.field];
      const existingIds: string[] = Array.isArray(fieldValue)
        ? fieldValue.flatMap((r: { toString(): string }) => r?.toString())
        : [];

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

      let updatedRow: import('@application/core/entity.core').IRow;

      if (oldReactionId) {
        const updatedIds = existingIds.map((id) => {
          if (id === oldReactionId) {
            return reactionId;
          }
          return id;
        });
        updatedRow = await this.rowRepository.setFieldAndSave({
          table,
          _id: payload._id,
          field: payload.field,
          value: updatedIds,
        });
        await this.reactionRepository.delete(oldReactionId);
      } else {
        updatedRow = await this.rowRepository.setFieldAndSave({
          table,
          _id: payload._id,
          field: payload.field,
          value: [...existingIds, reactionId],
        });
      }

      return right(transformRowContext(updatedRow, table.fields, payload.user));
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
