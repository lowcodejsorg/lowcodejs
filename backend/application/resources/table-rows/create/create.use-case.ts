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

      const groupPayload = [];

      const groups = (table.fields as IField[])?.filter(
        (c) => c.type === E_FIELD_TYPE.FIELD_GROUP,
      );

      for await (const group of groups) {
        const groupTable = await this.tableRepository.findBy({
          slug: group.configuration?.group?.slug?.toString(),
          exact: true,
        });

        if (!groupTable) continue;

        const hasGroupPayload = payload[group.slug];

        if (!hasGroupPayload) continue;

        const buildGroup = await buildTable(groupTable);

        for (const item of payload[
          group.slug
        ] as import('@application/core/entity.core').IRow[]) {
          groupPayload.push({
            table: buildGroup,
            payload: item,
            group: group.slug,
          });
        }
      }

      const processedGroupIds: { [key: string]: string[] } = {};

      for await (const item of groupPayload) {
        if (!processedGroupIds[item.group]) {
          processedGroupIds[item.group] = [];
        }

        const rowGroup = await item.table.findOne({
          _id: item.payload._id,
        });

        if (!rowGroup) {
          const created = await item.table.create({
            ...item.payload,
          });

          processedGroupIds[item.group].push(created?._id?.toString());
        } else {
          await rowGroup
            .set({
              ...rowGroup.toJSON({
                flattenObjectIds: true,
              }),
              ...item.payload,
            })
            .save();

          processedGroupIds[item.group].push(rowGroup?._id?.toString());
        }
      }

      for (const groupSlug in processedGroupIds) {
        payload[groupSlug] = processedGroupIds[groupSlug];
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
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'CREATE_ROW_ERROR',
        ),
      );
    }
  }
}
