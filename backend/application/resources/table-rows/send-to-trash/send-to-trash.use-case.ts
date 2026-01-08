/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IField } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { buildPopulate, buildTable } from '@application/core/util.core';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { TableRowSendToTrashPayload } from './send-to-trash.validator';

type Response = Either<
  HTTPException,
  import('@application/core/entity.core').IRow
>;

type Payload = TableRowSendToTrashPayload;

@Service()
export default class TableRowSendToTrashUseCase {
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

      const c = await buildTable(table);

      const populate = await buildPopulate(table.fields as IField[]);

      const row = await c.findOne({
        _id: payload._id,
      });

      if (!row)
        return left(HTTPException.NotFound('Row not found', 'ROW_NOT_FOUND'));

      if (row.trashed)
        return left(
          HTTPException.Conflict('Row already in trash', 'ALREADY_TRASHED'),
        );

      await row.updateOne({
        trashed: true,
        trashedAt: new Date(),
      });

      const populated = await row.populate(populate);

      return right({
        ...populated.toJSON({
          flattenObjectIds: true,
        }),
        _id: populated._id.toString(),
      });
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'SEND_ROW_TABLE_TO_TRASH_ERROR',
        ),
      );
    }
  }
}
