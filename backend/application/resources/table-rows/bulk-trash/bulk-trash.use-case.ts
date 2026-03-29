/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { buildTable } from '@application/core/util.core';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { BulkTrashPayload } from './bulk-trash.validator';

type Response = Either<HTTPException, { modified: number }>;

@Service()
export default class BulkTrashUseCase {
  constructor(private readonly tableRepository: TableContractRepository) {}

  async execute(payload: BulkTrashPayload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBySlug(payload.slug);

      if (!table)
        return left(
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );

      const model = await buildTable(table);

      const result = await model.updateMany(
        { _id: { $in: payload.ids }, trashed: false },
        { $set: { trashed: true, trashedAt: new Date() } },
      );

      return right({ modified: result.modifiedCount });
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'BULK_TRASH_ROWS_ERROR',
        ),
      );
    }
  }
}
