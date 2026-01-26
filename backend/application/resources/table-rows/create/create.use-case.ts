/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import {
  E_FIELD_TYPE,
  type IField,
  type IRow,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { buildPopulate, buildTable } from '@application/core/util.core';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { TableRowCreatePayload } from './create.validator';

type Response = Either<HTTPException, IRow>;

type Payload = TableRowCreatePayload;

@Service()
export default class TableRowCreateUseCase {
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

      const build = await buildTable(table);

      const populate = await buildPopulate(table.fields as IField[]);

      const created = await build.create({
        ...payload,
        creator: payload.creator ?? null,
      });

      const row = await created.populate(populate);

      return right({
        ...row?.toJSON({
          flattenObjectIds: true,
        }),
        _id: row?._id?.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'CREATE_ROW_ERROR',
        ),
      );
    }
  }
}
