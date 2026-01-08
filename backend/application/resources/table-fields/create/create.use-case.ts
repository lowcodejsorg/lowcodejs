/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import slugify from 'slugify';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import {
  E_FIELD_TYPE,
  E_TABLE_STYLE,
  E_TABLE_TYPE,
  type IField as Entity,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { buildSchema, buildTable } from '@application/core/util.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { TableFieldCreatePayload } from './create.validator';

type Response = Either<HTTPException, Entity>;
type Payload = TableFieldCreatePayload;

@Service()
export default class TableFieldCreateUseCase {
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

      const slug = slugify(payload.name, { lower: true, trim: true });

      const existFieldOnTable = table.fields?.find(
        (field) => field.slug === slug,
      );

      if (existFieldOnTable)
        return left(
          HTTPException.Conflict('Field already exist', 'FIELD_ALREADY_EXIST'),
        );

      let field = await this.fieldRepository.create({
        ...payload,
        slug,
        configuration: {
          ...payload.configuration,
          group: null,
        },
      });

      if (field.type === E_FIELD_TYPE.FIELD_GROUP) {
        const _schema = buildSchema([]);

        const group = await this.tableRepository.create({
          _schema,
          fields: [],
          slug,
          configuration: {
            administrators: [],
            fields: {
              orderForm: [],
              orderList: [],
            },
            collaboration: table.configuration.collaboration,
            style: E_TABLE_STYLE.LIST,
            visibility: table.configuration.visibility,
            owner: table.configuration.owner._id,
          },
          description: null,
          name: field.name,
          type: E_TABLE_TYPE.FIELD_GROUP,
        });

        field = await this.fieldRepository.update({
          _id: field._id,
          configuration: {
            ...field.configuration,
            group: {
              _id: group._id,
              slug: group.slug,
            },
          },
        });

        await buildTable(group);
      }

      const fields = [...(table.fields ?? []), field];
      const _schema = buildSchema(fields);

      await this.tableRepository.update({
        _id: table._id,
        fields: fields.flatMap((f) => f._id),
        _schema: {
          ...table._schema,
          ..._schema,
        },
        configuration: {
          owner: table.configuration.owner._id,
        },
      });

      await buildTable({
        ...table,
        _id: table._id,
      });

      return right(field);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'CREATE_FIELD_ERROR',
        ),
      );
    }
  }
}
