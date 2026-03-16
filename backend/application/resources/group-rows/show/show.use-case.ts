/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IField } from '@application/core/entity.core';
import { E_FIELD_TYPE } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { maskPasswordFields } from '@application/core/row-password-helper.core';
import { buildPopulate, buildTable } from '@application/core/util.core';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { GroupRowShowPayload } from './show.validator';

type Response = Either<HTTPException, Record<string, any>>;
type Payload = GroupRowShowPayload;

@Service()
export default class GroupRowShowUseCase {
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

      const groupField = table.fields?.find(
        (f) =>
          f.type === E_FIELD_TYPE.FIELD_GROUP &&
          f.group?.slug === payload.groupSlug,
      );

      if (!groupField) {
        return left(
          HTTPException.NotFound('Group not found', 'GROUP_NOT_FOUND'),
        );
      }

      const build = await buildTable(table);

      const populate = await buildPopulate(
        table.fields as IField[],
        table.groups,
      );

      const row = await build
        .findOne({ _id: payload.rowId })
        .populate(populate);

      if (!row)
        return left(HTTPException.NotFound('Row not found', 'ROW_NOT_FOUND'));

      const rowJson = row.toJSON({ flattenObjectIds: true });
      maskPasswordFields(rowJson, table.fields as IField[]);

      const items = rowJson[groupField.slug] || [];
      const item = items.find((i: any) => i._id?.toString() === payload.itemId);

      if (!item)
        return left(HTTPException.NotFound('Item not found', 'ITEM_NOT_FOUND'));

      return right(item);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'GET_GROUP_ROW_ERROR',
        ),
      );
    }
  }
}
