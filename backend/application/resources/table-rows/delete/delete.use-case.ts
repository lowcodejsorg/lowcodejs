/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { resolveCreatorId } from '@application/core/row-ownership.core';
import { RowContractRepository } from '@application/repositories/row/row-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { TableRowDeletePayload } from './delete.validator';

type Response = Either<HTTPException, null>;
type Payload = TableRowDeletePayload & {
  __actorUserId?: string;
  // Convidado contributor: só pode remover os próprios registros.
  __ownOnly?: boolean;
};

@Service()
export default class TableRowDeleteUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly rowRepository: RowContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBySlug(payload.slug);

      if (!table) {
        return left(
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );
      }

      // Convidado contributor só remove o que criou.
      if (payload.__ownOnly) {
        const current = await this.rowRepository.findOne({
          table,
          query: { _id: payload._id },
        });

        if (!current) {
          return left(
            HTTPException.NotFound('Registro não encontrado', 'ROW_NOT_FOUND'),
          );
        }

        const creatorId = resolveCreatorId(current.creator);
        if (!payload.__actorUserId || creatorId !== payload.__actorUserId) {
          return left(
            HTTPException.Forbidden(
              'Você só pode remover os seus próprios registros',
              'OWN_ROW_ONLY',
            ),
          );
        }
      }

      const deleted = await this.rowRepository.deleteOne(table, payload._id);

      if (!deleted) {
        return left(
          HTTPException.NotFound('Registro não encontrado', 'ROW_NOT_FOUND'),
        );
      }

      return right(null);
    } catch (error) {
      console.error('[table-rows > delete][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'DELETE_ROW_ERROR',
        ),
      );
    }
  }
}
