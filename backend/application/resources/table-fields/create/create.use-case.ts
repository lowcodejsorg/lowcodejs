/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import slugify from 'slugify';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import {
  E_FIELD_TYPE,
  type IField as Entity,
  type IField,
  type IGroupConfiguration,
  type ITable,
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

      // Se foi fornecido um group slug, adiciona o campo ao grupo
      const groupSlug = payload.group;
      if (groupSlug) {
        const targetGroup = table.groups?.find((g) => g.slug === groupSlug);
        if (!targetGroup) {
          return left(
            HTTPException.NotFound('Group not found', 'GROUP_NOT_FOUND'),
          );
        }
        return this.addFieldToGroup(payload, table, targetGroup);
      }

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

      let groups = table.groups || [];

      if (field.type === E_FIELD_TYPE.FIELD_GROUP) {
        // Adiciona grupo em groups da tabela pai
        const newGroup: IGroupConfiguration = {
          slug,
          name: field.name,
          fields: [],
          _schema: {},
        };

        groups = [...groups, newGroup];

        field = await this.fieldRepository.update({
          _id: field._id,
          configuration: {
            ...field.configuration,
            group: { slug },
          },
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
        configuration: {
          ...table.configuration,
          owner: table.configuration.owner._id,
          administrators: table.configuration.administrators.flatMap(
            (a) => a._id,
          ),
        },
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
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'CREATE_FIELD_ERROR',
        ),
      );
    }
  }

  private async addFieldToGroup(
    payload: Payload,
    parentTable: ITable,
    targetGroup: IGroupConfiguration,
  ): Promise<Response> {
    const slug = slugify(payload.name, { lower: true, trim: true });

    // Verifica se o campo já existe no grupo
    const existFieldInGroup = targetGroup.fields?.find((f) => f.slug === slug);
    if (existFieldInGroup) {
      return left(
        HTTPException.Conflict(
          'Field already exist in group',
          'FIELD_ALREADY_EXIST',
        ),
      );
    }

    // Cria o campo
    const field = await this.fieldRepository.create({
      ...payload,
      slug,
      configuration: {
        ...payload.configuration,
        group: null,
      },
    });

    // Atualiza o grupo com o novo campo e schema
    const updatedGroups = parentTable.groups.map((g) => {
      if (g.slug !== targetGroup.slug) return g;

      const updatedFields = [...(g.fields || []), field];
      const groupSchema = buildSchema(updatedFields);

      return {
        ...g,
        fields: updatedFields,
        _schema: groupSchema,
      };
    });

    // Reconstrói o schema da tabela pai com os grupos atualizados
    const parentSchema = buildSchema(
      parentTable.fields as IField[],
      updatedGroups,
    );

    await this.tableRepository.update({
      _id: parentTable._id,
      _schema: parentSchema,
      groups: updatedGroups,
      configuration: {
        ...parentTable.configuration,
        owner: parentTable.configuration.owner._id,
        administrators: parentTable.configuration.administrators.flatMap(
          (a) => a._id,
        ),
      },
    });

    await buildTable({
      ...parentTable,
      _id: parentTable._id,
      _schema: parentSchema,
      groups: updatedGroups,
    });

    return right(field);
  }
}
