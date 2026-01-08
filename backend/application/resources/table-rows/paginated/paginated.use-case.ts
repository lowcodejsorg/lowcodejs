/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IField, IMeta, Paginated } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import {
  buildOrder,
  buildPopulate,
  buildQuery,
  buildTable,
} from '@application/core/util.core';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { TableRowPaginatedPayload } from './paginated.validator';

type Response = Either<
  HTTPException,
  Paginated<import('@application/core/entity.core').IRow>
>;

type Payload = TableRowPaginatedPayload;

@Service()
export default class TableRowPaginatedUseCase {
  constructor(private readonly tableRepository: TableContractRepository) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const skip = (payload.page - 1) * payload.perPage;

      const table = await this.tableRepository.findBy({
        slug: payload.slug,
        exact: true,
      });

      if (!table)
        return left(
          HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND'),
        );

      const c = await buildTable(table);

      const query = await buildQuery(payload, table.fields as IField[]);

      const order = buildOrder(payload, table.fields as IField[]);

      const populate = await buildPopulate(table.fields as IField[]);

      const rows = await c
        .find(query)
        .populate(populate)
        .skip(skip)
        .limit(payload.perPage)
        .sort(order);

      const total = await c.countDocuments(query);

      const lastPage = Math.ceil(total / payload.perPage);

      const meta: IMeta = {
        total,
        perPage: payload.perPage,
        page: payload.page,
        lastPage,
        firstPage: total > 0 ? 1 : 0,
      };

      // @ts-ignore
      return right({
        meta,
        data: rows?.map((u) => ({
          ...u?.toJSON({
            flattenObjectIds: true,
          }),
          _id: u?._id.toString(),
        })),
      });
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'LIST_ROW_TABLE_PAGINATED_ERROR',
        ),
      );
    }
  }
}
