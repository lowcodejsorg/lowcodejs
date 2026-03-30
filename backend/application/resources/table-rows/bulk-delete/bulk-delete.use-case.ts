/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { buildTable } from '@application/core/util.core';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { BulkDeletePayload } from './bulk-delete.validator';

type Response = Either<HTTPException, { deleted: number }>;

@Service()
export default class BulkDeleteUseCase {
  constructor(private readonly tableRepository: TableContractRepository) {}

  async execute(payload: BulkDeletePayload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBySlug(payload.slug);

      if (!table)
        return left(
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );

      const model = await buildTable(table);

      const result = await model.deleteMany({
        _id: { $in: payload.ids },
        trashed: true,
      });

      return right({ deleted: result.deletedCount });
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'BULK_DELETE_ROWS_ERROR',
        ),
      );
    }
  }
}
