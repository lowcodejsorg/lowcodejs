/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { buildTable } from '@application/core/util.core';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { BulkRestorePayload } from './bulk-restore.validator';

type Response = Either<HTTPException, { modified: number }>;

@Service()
export default class BulkRestoreUseCase {
  constructor(private readonly tableRepository: TableContractRepository) {}

  async execute(payload: BulkRestorePayload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBy({
        slug: payload.slug,
        exact: true,
      });

      if (!table)
        return left(
          HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND'),
        );

      const model = await buildTable(table);

      const result = await model.updateMany(
        { _id: { $in: payload.ids }, trashed: true },
        { $set: { trashed: false, trashedAt: null } },
      );

      return right({ modified: result.modifiedCount });
    } catch {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'BULK_RESTORE_ROWS_ERROR',
        ),
      );
    }
  }
}
