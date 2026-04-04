/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import slugify from 'slugify';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import {
  E_FIELD_TYPE,
  FIELD_GROUP_NATIVE_LIST,
  type IField as Entity,
  type IGroupConfiguration,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { buildSchema, buildTable } from '@application/core/util.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import { normalizeDefaultValue } from '../table-field-base.schema';

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
      const table = await this.tableRepository.findBySlug(payload.slug);

      if (!table)
        return left(
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );

      const slug = slugify(payload.name, { lower: true, trim: true });

      const existFieldOnTable = table.fields?.find(
        (field) => field.slug === slug,
      );

      if (existFieldOnTable)
        return left(
          HTTPException.Conflict('Campo já existe', 'FIELD_ALREADY_EXIST', {
            name: 'Campo já existe',
          }),
        );

      let field = await this.fieldRepository.create({
        ...payload,
        defaultValue: normalizeDefaultValue(payload.type, payload.defaultValue),
        slug,
        group: null,
      });

      let groups = table.groups || [];

      if (field.type === E_FIELD_TYPE.FIELD_GROUP) {
        // Cria campos nativos para o grupo
        const nativeGroupFields = await this.fieldRepository.createMany(
          FIELD_GROUP_NATIVE_LIST,
        );

        const groupSchema = buildSchema(nativeGroupFields);

        // Adiciona grupo em groups da tabela pai
        const newGroup: IGroupConfiguration = {
          slug,
          name: field.name,
          fields: nativeGroupFields,
          _schema: groupSchema,
        };

        groups = [...groups, newGroup];

        field = await this.fieldRepository.update({
          _id: field._id,
          group: { slug },
        });
      }

      const fields = [...(table.fields ?? []), field];
      const _schema = buildSchema(fields, groups);

      await this.tableRepository.update({
        _id: table._id,
        fields: fields.flatMap((f) => f._id),
        _schema: {
          ...table._schema,
          ..._schema,
        },
        groups,
        owner: table.owner._id,
        administrators: table.administrators.flatMap((a) => a._id),
        fieldOrderList: [...(table.fieldOrderList ?? []), field._id],
        fieldOrderForm: [...(table.fieldOrderForm ?? []), field._id],
        fieldOrderFilter: [...(table.fieldOrderFilter ?? []), field._id],
        fieldOrderDetail: [...(table.fieldOrderDetail ?? []), field._id],
      });

      await buildTable({
        ...table,
        _id: table._id,
        _schema: {
          ...table._schema,
          ..._schema,
        },
        groups,
      });

      return right(field);
    } catch (error) {
      console.error('[table-fields > create][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'CREATE_FIELD_ERROR',
        ),
      );
    }
  }
}
