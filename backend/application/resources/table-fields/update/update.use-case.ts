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

      // Se foi fornecido um group slug, atualiza o campo no grupo
      const groupSlug = payload.group;
      if (groupSlug) {
        const targetGroup = table.groups?.find((g) => g.slug === groupSlug);
        if (!targetGroup) {
          return left(
            HTTPException.NotFound('Group not found', 'GROUP_NOT_FOUND'),
          );
        }
        return this.updateFieldInGroup(payload, table, targetGroup);
      }

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

      let groups = table.groups || [];

      if (updatedField.type === E_FIELD_TYPE.FIELD_GROUP) {
        // Verifica se já existe um grupo para este campo
        const existingGroup = groups.find(
          (g) => g.slug === field.configuration?.group?.slug,
        );

        if (!existingGroup) {
          // Cria novo grupo em groups
          const newGroup: IGroupConfiguration = {
            slug,
            name: updatedField.name,
            fields: [],
            _schema: {},
          };

          groups = [...groups, newGroup];
        } else if (oldSlug !== slug) {
          // Atualiza o slug do grupo existente
          groups = groups.map((g) =>
            g.slug === existingGroup.slug
              ? { ...g, slug, name: updatedField.name }
              : g,
          );
        }

        updatedField = await this.fieldRepository.update({
          _id: updatedField._id,
          configuration: {
            ...updatedField.configuration,
            group: { slug },
          },
        });
      }

      const fields = table.fields.map((f) =>
        f._id === field._id ? updatedField : f,
      );

      const _schema = buildSchema(fields, groups);

      await this.tableRepository.update({
        _id: table._id,
        _schema,
        fields: fields.flatMap((f) => f._id),
        groups,
        configuration: {
          ...table.configuration,
          owner: table.configuration.owner._id,
          administrators: table.configuration.administrators.flatMap(
            (a) => a._id,
          ),
        },
      });

      if (oldSlug !== slug) {
        const collection = await buildTable({
          ...table,
          _id: table._id,
          _schema,
          groups,
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
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'UPDATE_FIELD_TABLE_ERROR',
        ),
      );
    }
  }

  private async updateFieldInGroup(
    payload: Payload,
    parentTable: ITable,
    targetGroup: IGroupConfiguration,
  ): Promise<Response> {
    const field = await this.fieldRepository.findBy({
      _id: payload._id,
      exact: true,
    });

    if (!field)
      return left(HTTPException.NotFound('Field not found', 'FIELD_NOT_FOUND'));

    const oldSlug = field.slug;
    const slug = slugify(payload.name, { lower: true, trim: true });

    const updatedField = await this.fieldRepository.update({
      ...payload,
      _id: field._id,
      slug,
      ...(payload.trashed && { trashed: payload.trashed }),
      ...(payload.trashedAt && { trashedAt: payload.trashedAt }),
    });

    // Atualiza o grupo com o campo atualizado
    const updatedGroups = parentTable.groups.map((g) => {
      if (g.slug !== targetGroup.slug) return g;

      const updatedFields = g.fields.map((f) =>
        f._id === field._id ? updatedField : f,
      );
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

    return right(updatedField);
  }
}
