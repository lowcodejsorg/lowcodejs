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
  TableFieldUpdateBodyValidator,
  TableFieldUpdateParamValidator,
} from './update.validator';

type Response = Either<
  HTTPException,
  import('@application/core/entity.core').IField
>;
type Payload = z.infer<typeof TableFieldUpdateBodyValidator> &
  z.infer<typeof TableFieldUpdateParamValidator>;

@Service()
export default class TableFieldUpdateUseCase {
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

      const field = await Field.findOne({ _id: payload._id });

      if (!field)
        return left(
          HTTPException.NotFound('Field not found', 'FIELD_NOT_FOUND'),
        );

      if (
        table?.fields?.filter(
          (f) => !(f as import('@application/core/entity.core').IField).trashed,
        ).length === 1 &&
        payload.trashed
      ) {
        return left(
          HTTPException.Conflict(
            'Last active field, should not be sent to trash',
            'LAST_ACTIVE_FIELD',
          ),
        );
      }

      const oldSlug = field.slug;

      const slug = slugify(payload.name, { lower: true, trim: true });

      await field
        .set({
          ...field.toJSON({
            flattenObjectIds: true,
          }),
          ...payload,
          slug,
          ...(payload.trashed && { trashed: payload.trashed }),
          ...(payload.trashedAt && {
            trashedAt: payload.trashedAt,
          }),
        })
        .save();

      if (field.type === E_FIELD_TYPE.FIELD_GROUP) {
        let group;

        // Se já tem grupo, busca existente
        if (field.configuration?.group?._id) {
          group = await Table.findOne({
            _id: field.configuration.group._id,
          });
        }

        // Se não tem grupo, cria novo
        if (!group) {
          const _schema = buildSchema([]);
          group = await Table.create({
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

          // Atualiza field com referência ao grupo
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
        }

        // Sempre registra o modelo do grupo
        await buildTable({
          ...group.toJSON({
            flattenObjectIds: true,
          }),
          _id: group._id.toString(),
        });
      }

      const fields = (
        table.fields as import('@application/core/entity.core').IField[]
      ).map((f) => {
        if (f._id?.toString() === field._id?.toString()) {
          return {
            ...field?.toJSON({
              flattenObjectIds: true,
            }),
            _id: field?._id?.toString(),
          };
        }

        return f;
      });

      const _schema = buildSchema(fields);

      await table
        .set({
          ...table.toJSON({
            flattenObjectIds: true,
          }),
          _schema,
          fields: fields.flatMap((f) => f._id?.toString()),
        })
        .save();

      if (oldSlug !== slug) {
        const c = await buildTable({
          ...table.toJSON({
            flattenObjectIds: true,
          }),
          _id: table._id.toString(),
        });
        await c.updateMany(
          {},
          {
            $rename: {
              [oldSlug]: slug,
            },
          },
        );
      }

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
          'UPDATE_FIELD_TABLE_ERROR',
        ),
      );
    }
  }
}
