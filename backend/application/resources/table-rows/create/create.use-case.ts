/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IRow } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import {
  hashPasswordFields,
  maskPasswordFields,
} from '@application/core/row-password-helper.core';
import { validateRowPayload } from '@application/core/row-payload-validator.core';
import { RowContractRepository } from '@application/repositories/row/row-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

type Response = Either<HTTPException, IRow>;

type Payload = Record<string, unknown> & {
  slug: string;
  creator?: string | null;
};

@Service()
export default class TableRowCreateUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly rowRepository: RowContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBySlug(payload.slug);

      if (!table) {
        return left(
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );
      }

      const errors = validateRowPayload(payload, table.fields, table.groups);

      if (errors) {
        return left(
          HTTPException.BadRequest(
            'Requisição inválida',
            'INVALID_PAYLOAD_FORMAT',
            errors,
          ),
        );
      }

      await hashPasswordFields(payload, table.fields);

      const row = await this.rowRepository.create({
        table,
        data: {
          ...payload,
          creator: payload.creator || null,
        },
      });

      maskPasswordFields(row, table.fields);

      return right(row);
    } catch (error) {
      console.error('[table-rows > create][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'CREATE_ROW_ERROR',
        ),
      );
    }
  }
}
