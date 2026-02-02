/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import { E_FIELD_TYPE, type IField } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
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
      const table = await this.tableRepository.findBy({
        slug: payload.slug,
        exact: true,
      });

      if (!table)
        return left(
          HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND'),
        );

      const errors = validateRowPayload(payload, table.fields, table.groups, {
        skipMissing: true,
      });

      if (errors) {
        return left(
          HTTPException.BadRequest(
            'Invalid request',
            'INVALID_PAYLOAD_FORMAT',
            errors,
          ),
        );
      }

      const build = await buildTable(table);

      const populate = await buildPopulate(
        table.fields as IField[],
        table.groups,
      );

      const row = await build.findOne({ _id: payload._id }).populate(populate);

      if (!row)
        return left(HTTPException.NotFound('Row not found', 'ROW_NOT_FOUND'));

      // Processa campos FIELD_GROUP como embedded documents
      const groupFields = (table.fields as IField[])?.filter(
        (f) => f.type === E_FIELD_TYPE.FIELD_GROUP,
      );

      for (const groupField of groupFields) {
        const groupSlug = groupField.slug;
        const groupData = payload[groupSlug];

        if (
          groupData &&
          Array.isArray(groupData) &&
          groupData.length > 0 &&
          typeof groupData[0] === 'object' &&
          groupData[0] !== null
        ) {
          // Sanitiza os dados embedded (remove _id interno se existir)
          payload[groupSlug] = (
            groupData as Array<{ _id?: string; [key: string]: unknown }>
          ).map(({ _id, ...rest }) => rest);
        }
      }

      await row
        .set({
          ...row.toJSON({
            flattenObjectIds: true,
          }),
          ...payload,
        })
        .save();

      await row.populate(populate);

      // @ts-ignore
      return right({
        ...row.toJSON({
          flattenObjectIds: true,
        }),
        _id: row?._id?.toString(),
      });
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'UPDATE_ROW_TABLE_ERROR',
        ),
      );
    }
  }
}
