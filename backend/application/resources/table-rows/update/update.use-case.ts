/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IField } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { hashPasswordFields } from '@application/core/row-password-helper.core';
import { validateRowPayload } from '@application/core/row-payload-validator.core';
// import TableFieldRowValidation from '@application/core/table-field-row-validation.exception';
import { buildPopulate, buildTable } from '@application/core/util.core';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

type Response = Either<
  HTTPException,
  import('@application/core/entity.core').IRow
>;

// type Payload = TableRowUpdatePayload;
type Payload = {
  [x: string]: any;
};

@Service()
export default class TableRowUpdateUseCase {
  constructor(private readonly tableRepository: TableContractRepository) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBySlug(payload.slug);

      if (!table)
        return left(
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );

      const errors = validateRowPayload(payload, table.fields, table.groups, {
        skipMissing: true,
      });

      if (errors) {
        return left(
          HTTPException.BadRequest(
            'Requisição inválida',
            'INVALID_PAYLOAD_FORMAT',
            errors,
          ),
        );
      }

      await hashPasswordFields(payload, table.fields as IField[]);

      const build = await buildTable(table);

      const populate = await buildPopulate(
        table.fields as IField[],
        table.groups,
      );

      const row = await build.findOne({ _id: payload._id }).populate(populate);

      if (!row)
        return left(
          HTTPException.NotFound('Registro não encontrado', 'ROW_NOT_FOUND'),
        );

      await row
        .set({
          ...row.toJSON({
            flattenObjectIds: true,
          }),
          ...payload,
        })
        .save();

      await row.populate(populate);

      const rowJson = {
        ...row.toJSON({
          flattenObjectIds: true,
        }),
        _id: row?._id?.toString(),
      };

      // @ts-ignore
      return right(rowJson);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'UPDATE_ROW_TABLE_ERROR',
        ),
      );
    }
  }
}
