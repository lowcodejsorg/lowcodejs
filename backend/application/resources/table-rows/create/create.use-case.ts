/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import { type IField, type IRow } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import {
  hashPasswordFields,
  maskPasswordFields,
} from '@application/core/row-password-helper.core';
import { validateRowPayload } from '@application/core/row-payload-validator.core';
import { buildPopulate, buildTable } from '@application/core/util.core';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

type Response = Either<HTTPException, IRow>;

// type Payload = TableRowCreatePayload;

type Payload = {
  [x: string]: any;
};

@Service()
export default class TableRowCreateUseCase {
  constructor(private readonly tableRepository: TableContractRepository) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBySlug(payload.slug);

      if (!table)
        return left(
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );

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

      await hashPasswordFields(payload, table.fields as IField[]);

      const build = await buildTable(table);

      const populate = await buildPopulate(
        table.fields as IField[],
        table.groups,
      );

      const created = await build.create({
        ...payload,
        creator: payload.creator ?? null,
      });

      const row = await created.populate(populate);

      const rowJson = {
        ...row?.toJSON({
          flattenObjectIds: true,
        }),
        _id: row?._id?.toString(),
      };

      maskPasswordFields(rowJson, table.fields as IField[]);

      return right(rowJson);
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'CREATE_ROW_ERROR',
        ),
      );
    }
  }
}
