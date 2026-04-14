/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { RowContractRepository } from '@application/repositories/row/row-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { BulkTrashPayload } from './bulk-trash.validator';

type Response = Either<HTTPException, { modified: number }>;

@Service()
export default class BulkTrashUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly rowRepository: RowContractRepository,
  ) {}

  async execute(
    payload: BulkTrashPayload & {
      _ownOnly?: boolean;
      _currentUserId?: string;
    },
  ): Promise<Response> {
    try {
      const table = await this.tableRepository.findBySlug(payload.slug);

      if (!table) {
        return left(
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );
      }

      let ids = payload.ids;
      if (payload._ownOnly === true) {
        if (!payload._currentUserId) {
          return left(
            HTTPException.Forbidden(
              'Usuário não identificado para row-level security',
              'OWN_ROW_ONLY',
            ),
          );
        }

        const currentUserId = payload._currentUserId;
        const checks = await Promise.all(
          payload.ids.map(async (id) => {
            const row = await this.rowRepository.findOne({
              table,
              query: { _id: id },
              populate: false,
            });
            if (!row) return null;
            if (String(row.creator ?? '') !== currentUserId) return null;
            return id;
          }),
        );
        ids = checks.filter((id): id is string => id !== null);
      }

      const modified = await this.rowRepository.bulkTrash({ table, ids });

      return right({ modified });
    } catch (error) {
      console.error('[table-rows > bulk-trash][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'BULK_TRASH_ROWS_ERROR',
        ),
      );
    }
  }
}
