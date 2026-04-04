/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import {
  buildOrder,
  buildQuery,
  transformRowContext,
} from '@application/core/builders';
import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type {
  IField,
  IMeta,
  IRow,
  Paginated,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { maskPasswordFields } from '@application/core/row-password-helper.core';
import { RowContractRepository } from '@application/repositories/row/row-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { TableRowPaginatedPayload } from './paginated.validator';

type Response = Either<HTTPException, Paginated<IRow>>;

type Payload = TableRowPaginatedPayload & { user?: string };

@Service()
export default class TableRowPaginatedUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly rowRepository: RowContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const skip = (payload.page - 1) * payload.perPage;

      const table = await this.tableRepository.findBySlug(payload.slug);

      if (!table) {
        return left(
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );
      }

      const query = await buildQuery(
        payload,
        table.fields,
        table.groups,
        table.slug,
      );

      const order = buildOrder(payload, table.fields, table.order);

      const rows = await this.rowRepository.findMany({
        table,
        query,
        skip,
        limit: payload.perPage,
        sort: order,
        includeReverseRelationships: true,
      });

      const total = await this.rowRepository.count(table, query);

      const lastPage = Math.ceil(total / payload.perPage);

      const meta: IMeta = {
        total,
        perPage: payload.perPage,
        page: payload.page,
        lastPage,
        firstPage: total > 0 ? 1 : 0,
      };

      const data = rows.map((row) => {
        maskPasswordFields(row, table.fields);
        return transformRowContext(row, table.fields, payload.user);
      });

      return right({
        meta,
        data,
      });
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'LIST_ROW_TABLE_PAGINATED_ERROR',
        ),
      );
    }
  }
}
