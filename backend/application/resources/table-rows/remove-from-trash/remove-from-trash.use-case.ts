/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IField } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { buildPopulate, buildTable } from '@application/core/util.core';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { TableRowRemoveFromTrashPayload } from './remove-from-trash.validator';

type Response = Either<
  HTTPException,
  import('@application/core/entity.core').IRow
>;

type Payload = TableRowRemoveFromTrashPayload;

@Service()
export default class TableRowRemoveFromTrashUseCase {
  constructor(private readonly tableRepository: TableContractRepository) {}

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

      if (!row.trashed)
        return left(
          HTTPException.Conflict('Registro não está na lixeira', 'NOT_TRASHED'),
        );

      await row.set({ trashed: false, trashedAt: null }).save();

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
          'Erro interno do servidor',
          'REMOVE_ROW_FROM_TRASH_ERROR',
        ),
      );
    }
  }
}
