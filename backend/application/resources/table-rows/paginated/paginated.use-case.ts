/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IMeta, IRow, Paginated } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { RowContractRepository } from '@application/repositories/row/row-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';
import { RowContextContractService } from '@application/services/row-context/row-context-contract.service';
import { RowPasswordContractService } from '@application/services/row-password/row-password-contract.service';

import type { TableRowPaginatedPayload } from './paginated.validator';

type Response = Either<HTTPException, Paginated<IRow>>;

type Payload = TableRowPaginatedPayload & { user?: string };

@Service()
export default class TableRowPaginatedUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly rowRepository: RowContractRepository,
    private readonly rowPasswordService: RowPasswordContractService,
    private readonly rowContextService: RowContextContractService,
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

      const rows = await this.rowRepository.findMany({
        table,
        rawFilters: payload,
        skip,
        limit: payload.perPage,
        includeReverseRelationships: true,
      });

      const total = await this.rowRepository.count(table, payload);

      const lastPage = Math.ceil(total / payload.perPage);

      const meta: IMeta = {
        total,
        perPage: payload.perPage,
        page: payload.page,
        lastPage,
        firstPage: total > 0 ? 1 : 0,
      };

      const data = rows.map((row) => {
        this.rowPasswordService.mask(row, table.fields);
        return this.rowContextService.transform(
          row,
          table.fields,
          payload.user,
        );
      });

      return right({
        meta,
        data,
      });
    } catch (error) {
      console.error('[table-rows > paginated][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'LIST_ROW_TABLE_PAGINATED_ERROR',
        ),
      );
    }
  }
}
