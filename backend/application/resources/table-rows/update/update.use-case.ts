import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import { FIELD_TYPE } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { buildPopulate, buildTable } from '@application/core/util.core';
import { Table } from '@application/model/table.model';

import type {
  TableRowUpdateBodyValidator,
  TableRowUpdateParamValidator,
} from './update.validator';

type Response = Either<
  HTTPException,
  import('@application/core/entity.core').Row
>;

type Payload = z.infer<typeof TableRowUpdateBodyValidator> &
  z.infer<typeof TableRowUpdateParamValidator>;

@Service()
export default class TableRowUpdateUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await Table.findOne({
        slug: payload.slug,
      }).populate([
        {
          path: 'fields',
          model: 'Field',
        },
      ]);

      if (!table)
        return left(
          HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND'),
        );

      const build = await buildTable({
        ...table?.toJSON({
          flattenObjectIds: true,
        }),
        _id: table?._id?.toString(),
      });

      const populate = await buildPopulate(
        table?.fields as import('@application/core/entity.core').Field[],
      );

      const row = await build.findOne({ _id: payload._id }).populate(populate);

      if (!row)
        return left(HTTPException.NotFound('Row not found', 'ROW_NOT_FOUND'));

      const groupPayload = [];

      const groups = (
        table.fields as import('@application/core/entity.core').Field[]
      )?.filter((field) => field.type === FIELD_TYPE.FIELD_GROUP);

      for await (const group of groups) {
        const groupTable = await Table.findOne({
          slug: group.configuration?.group?.slug?.toString(),
        }).populate([
          {
            path: 'fields',
            model: 'Field',
          },
        ]);

        if (!groupTable) continue;

        const hasGroupPayload = payload[group.slug];

        if (!hasGroupPayload) continue;

        const buildGroup = await buildTable({
          ...groupTable?.toJSON({
            flattenObjectIds: true,
          }),
          _id: groupTable?._id?.toString(),
        });

        for (const item of payload[
          group.slug
        ] as import('@application/core/entity.core').Row[]) {
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

        const groupRow = await item.table.findOne({
          _id: item.payload._id,
        });

        if (!groupRow) {
          const created = await item.table.create({
            ...item.payload,
          });

          processedGroupIds[item.group].push(created?._id?.toString());
        } else {
          await groupRow
            .set({
              ...groupRow.toJSON({
                flattenObjectIds: true,
              }),
              ...item.payload,
            })
            .save();

          processedGroupIds[item.group].push(groupRow?._id?.toString());
        }
      }

      for (const groupSlug in processedGroupIds) {
        payload[groupSlug] = processedGroupIds[groupSlug];
      }

      // await row.updateOne({
      //   ...row.toJSON({
      //     flattenObjectIds: true,
      //   }),
      //   ...payload,
      // });

      await row
        .set({
          ...row.toJSON({
            flattenObjectIds: true,
          }),
          ...payload,
        })
        .save();

      await row.populate(populate);

      console.log('row', JSON.stringify(row, null, 2));

      // @ts-ignore
      return right({
        ...row.toJSON({
          flattenObjectIds: true,
        }),
        _id: row?._id?.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'UPDATE_ROW_TABLE_ERROR',
        ),
      );
    }
  }
}
