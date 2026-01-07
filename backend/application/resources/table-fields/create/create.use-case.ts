import { Service } from 'fastify-decorators';
import slugify from 'slugify';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import { E_FIELD_TYPE } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { buildSchema, buildTable } from '@application/core/util.core';
import { Field } from '@application/model/field.model';
import { Table } from '@application/model/table.model';

import type {
  TableFieldCreateBodyValidator,
  TableFieldCreateParamValidator,
} from './create.validator';

type Response = Either<
  HTTPException,
  import('@application/core/entity.core').IField
>;
type Payload = z.infer<typeof TableFieldCreateBodyValidator> &
  z.infer<typeof TableFieldCreateParamValidator>;

@Service()
export default class TableFieldCreateUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await Table.findOne({
        slug: payload.slug,
      });

      if (!table)
        return left(
          HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND'),
        );

      const slug = slugify(payload.name, { lower: true, trim: true });

      const existFieldOnTable = (
        table.fields as import('@application/core/entity.core').IField[]
      )?.find((field) => field.slug === slug);

      if (existFieldOnTable)
        return left(
          HTTPException.Conflict('Field already exist', 'FIELD_ALREADY_EXIST'),
        );

      const field = await Field.create({
        ...payload,
        slug,
        configuration: {
          ...payload.configuration,
          group: null,
        },
      });

      if (field.type === E_FIELD_TYPE.FIELD_GROUP) {
        const _schema = buildSchema([]);

        const group = await Table.create({
          _schema,
          fields: [],
          slug,
          configuration: {
            administrators: [],
            fields: {
              orderForm: [],
              orderList: [],
            },
            collaboration: 'restricted',
            style: 'list',
            visibility: 'restricted',
            owner: table?.configuration?.owner?.toString(),
          },
          description: null,
          name: field.name,
          type: 'field-group',
        });

        await field
          .set({
            ...field.toJSON({
              flattenObjectIds: true,
            }),
            configuration: {
              ...field.toJSON({
                flattenObjectIds: true,
              }).configuration,
              group: {
                _id: group._id,
                slug: group.slug,
              },
            },
          })
          .save();

        await buildTable({
          ...group.toJSON({
            flattenObjectIds: true,
          }),
          _id: group._id.toString(),
        });
      }

      const fields = [
        ...((table.fields as import('@application/core/entity.core').IField[]) ??
          []),
        {
          ...field.toJSON({
            flattenObjectIds: true,
          }),
          _id: field._id.toString(),
        },
      ];
      const _schema = buildSchema(fields);

      await table
        .set({
          ...table.toJSON({
            flattenObjectIds: true,
          }),
          fields,
          _schema: {
            ...table?.toJSON({
              flattenObjectIds: true,
            })._schema,
            ..._schema,
          },
        })
        .save();

      await buildTable({
        ...table.toJSON({
          flattenObjectIds: true,
        }),
        _id: table._id.toString(),
      });

      return right({
        ...field.toJSON({
          flattenObjectIds: true,
        }),
        _id: field._id.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'CREATE_FIELD_ERROR',
        ),
      );
    }
  }
}
