/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import slugify from 'slugify';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import {
  E_FIELD_TYPE,
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_TYPE,
  E_TABLE_VISIBILITY,
  type IField as Entity,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { buildSchema, buildTable } from '@application/core/util.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { TableFieldUpdatePayload } from './update.validator';

type Response = Either<HTTPException, Entity>;
type Payload = TableFieldUpdatePayload;

@Service()
export default class TableFieldUpdateUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly fieldRepository: FieldContractRepository,
  ) {}

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

      const field = await this.fieldRepository.findBy({
        _id: payload._id,
        exact: true,
      });

      if (!field)
        return left(
          HTTPException.NotFound('Field not found', 'FIELD_NOT_FOUND'),
        );

      if (
        table.fields?.filter((f) => !f.trashed).length === 1 &&
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

      let updatedField = await this.fieldRepository.update({
        ...payload,
        _id: field._id,
        slug,
        ...(payload.trashed && { trashed: payload.trashed }),
        ...(payload.trashedAt && { trashedAt: payload.trashedAt }),
      });

      if (updatedField.type === E_FIELD_TYPE.FIELD_GROUP) {
        let group;

        if (updatedField.configuration?.group?._id) {
          group = await this.tableRepository.findBy({
            _id: updatedField.configuration.group._id,
            exact: true,
          });
        }

        if (!group) {
          const _schema = buildSchema([]);
          group = await this.tableRepository.create({
            _schema,
            fields: [],
            slug,
            configuration: {
              administrators: [],
              fields: {
                orderForm: [],
                orderList: [],
              },
              collaboration: E_TABLE_COLLABORATION.RESTRICTED,
              style: E_TABLE_STYLE.LIST,
              visibility: E_TABLE_VISIBILITY.RESTRICTED,
              owner: table.configuration.owner._id,
            },
            description: null,
            name: updatedField.name,
            type: E_TABLE_TYPE.FIELD_GROUP,
          });

          updatedField = await this.fieldRepository.update({
            _id: updatedField._id,
            configuration: {
              ...updatedField.configuration,
              group: {
                _id: group._id,
                slug: group.slug,
              },
            },
          });
        }

        await buildTable(group);
      }

      const fields = table.fields.map((f) =>
        f._id === field._id ? updatedField : f,
      );

      const _schema = buildSchema(fields);

      await this.tableRepository.update({
        _id: table._id,
        _schema,
        fields: fields.flatMap((f) => f._id),
        configuration: {
          owner: table.configuration.owner._id,
        },
      });

      if (oldSlug !== slug) {
        const collection = await buildTable({
          ...table,
          _id: table._id,
        });
        await collection.updateMany(
          {},
          {
            $rename: {
              [oldSlug]: slug,
            },
          },
        );
      }

      return right(updatedField);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'UPDATE_FIELD_TABLE_ERROR',
        ),
      );
    }
  }
}
