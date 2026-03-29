/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IField } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import {
  buildPopulate,
  buildTable,
  transformRowContext,
} from '@application/core/util.core';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { TableRowShowPayload } from './show.validator';

type Response = Either<
  HTTPException,
  import('@application/core/entity.core').IRow
>;

type Payload = TableRowShowPayload & { user?: string };

@Service()
export default class TableRowShowUseCase {
  constructor(private readonly tableRepository: TableContractRepository) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBy({
        slug: payload.slug,
        exact: true,
      });

      if (!table)
        return left(
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );

      const c = await buildTable(table);

      const populate = await buildPopulate(
        table.fields as IField[],
        table.groups,
        table.slug,
      );

      const row = await c.findOne({
        _id: payload._id,
      });

      if (!row)
        return left(
          HTTPException.NotFound('Registro não encontrado', 'ROW_NOT_FOUND'),
        );

      const populated = await row.populate(populate);

      const rowJson = {
        ...populated?.toJSON({
          flattenObjectIds: true,
        }),
        _id: populated?._id?.toString(),
      };

      return right(
        transformRowContext(rowJson, table.fields as IField[], payload.user),
      );
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'GET_ROW_TABLE_BY_ID_ERROR',
        ),
      );
    }
  }
}
