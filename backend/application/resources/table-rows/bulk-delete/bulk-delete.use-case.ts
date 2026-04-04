/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { RowContractRepository } from '@application/repositories/row/row-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { BulkDeletePayload } from './bulk-delete.validator';

type Response = Either<HTTPException, { deleted: number }>;

@Service()
export default class BulkDeleteUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly rowRepository: RowContractRepository,
  ) {}

  async execute(payload: BulkDeletePayload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBySlug(payload.slug);

      if (!table) {
        return left(
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );
      }

      const deleted = await this.rowRepository.bulkDelete({
        table,
        ids: payload.ids,
      });

      return right({ deleted });
    } catch (error) {
      console.error('[table-rows > bulk-delete][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'BULK_DELETE_ROWS_ERROR',
        ),
      );
    }
  }
}
