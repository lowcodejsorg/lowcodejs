/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { ITable as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { TableRemoveFromTrashPayload } from './remove-from-trash.validator';

type Response = Either<HTTPException, Entity>;
type Payload = TableRemoveFromTrashPayload;

@Service()
export default class TableRemoveFromTrashUseCase {
  constructor(private readonly tableRepository: TableContractRepository) {}

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

      if (!table.trashed)
        return left(
          HTTPException.Conflict('table is not in trash', 'NOT_TRASHED'),
        );

      const updated = await this.tableRepository.update({
        _id: table._id,
        trashed: false,
        trashedAt: null,
      });

      return right(updated);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'REMOVE_TABLE_FROM_TRASH_ERROR',
        ),
      );
    }
  }
}
