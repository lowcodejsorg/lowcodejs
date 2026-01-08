/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type {
  ITable as Entity,
  IMeta,
  Paginated,
} from '@application/core/entity.core';
import { E_TABLE_TYPE } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { TablePaginatedPayload } from './paginated.validator';

type Response = Either<HTTPException, Paginated<Entity>>;
type Payload = TablePaginatedPayload;

@Service()
export default class TablePaginatedUseCase {
  constructor(private readonly tableRepository: TableContractRepository) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const trashed = payload.trashed === 'true';

      const tables = await this.tableRepository.findMany({
        page: payload.page,
        perPage: payload.perPage,
        search: payload.search ?? payload.name,
        type: E_TABLE_TYPE.TABLE,
        trashed,
      });

      const total = await this.tableRepository.count({
        search: payload.search ?? payload.name,
        type: E_TABLE_TYPE.TABLE,
        trashed,
      });

      const lastPage = Math.ceil(total / payload.perPage);

      const meta: IMeta = {
        total,
        perPage: payload.perPage,
        page: payload.page,
        lastPage,
        firstPage: total > 0 ? 1 : 0,
      };

      return right({
        meta,
        data: tables,
      });
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'TABLE_LIST_PAGINATED_ERROR',
        ),
      );
    }
  }
}
