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
      const groupSlug =
        typeof payload.group === 'string' ? payload.group : payload.group?.slug;
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

      if (field.native && payload.trashed) {
        return left(
          HTTPException.Forbidden(
            'Native fields cannot be trashed',
            'NATIVE_FIELD_CANNOT_BE_TRASHED',
          ),
        );
      }

      if (
        field.locked &&
        !field.native &&
        !this.canUpdateLockedField(payload, field)
      ) {
        return left(
          HTTPException.Forbidden(
            'Field is locked and cannot be updated',
            'FIELD_LOCKED',
          ),
        );
      }

      if (field.native && !this.canUpdateNativeField(payload, field)) {
        return left(
          HTTPException.Forbidden(
            'Native fields can only have visibility and width updated',
            'NATIVE_FIELD_RESTRICTED',
          ),
        );
      }

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
      const slug = field.native
        ? field.slug
        : slugify(payload.name, { lower: true, trim: true });

      // Normalize group: if it's a string, convert to object format
      const normalizedGroup =
        typeof payload.group === 'string'
          ? { slug: payload.group }
          : payload.group;

      let updatedField = await this.fieldRepository.update({
        ...payload,
        _id: field._id,
        slug,
        group: normalizedGroup,
        ...(payload.trashed && { trashed: payload.trashed }),
        ...(payload.trashedAt && { trashedAt: payload.trashedAt }),
      });

      let groups = table.groups || [];

      if (updatedField.type === E_FIELD_TYPE.FIELD_GROUP) {
        // Verifica se já existe um grupo para este campo
        const existingGroup = groups.find((g) => g.slug === field.group?.slug);

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
          group: { slug },
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
        owner: table.owner._id,
        administrators: table.administrators.flatMap((a) => a._id),
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

    if (field.native && !this.canUpdateNativeField(payload, field)) {
      return left(
        HTTPException.Forbidden(
          'Native fields can only have visibility and width updated',
          'NATIVE_FIELD_RESTRICTED',
        ),
      );
    }

    if (field.locked && !this.canUpdateLockedField(payload, field)) {
      return left(
        HTTPException.Forbidden(
          'Field is locked and cannot be updated',
          'FIELD_LOCKED',
        ),
      );
    }

    const oldSlug = field.slug;
    const slug = field.native
      ? field.slug
      : slugify(payload.name, { lower: true, trim: true });

    // Normalize group: if it's a string, convert to object format
    const normalizedGroup =
      typeof payload.group === 'string'
        ? { slug: payload.group }
        : payload.group;

    const updatedField = await this.fieldRepository.update({
      ...payload,
      _id: field._id,
      slug,
      group: normalizedGroup,
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
      owner: parentTable.owner._id,
      administrators: parentTable.administrators.flatMap((a) => a._id),
    });

    await buildTable({
      ...parentTable,
      _id: parentTable._id,
      _schema: parentSchema,
      groups: updatedGroups,
    });

    return right(updatedField);
  }

  private canUpdateNativeField(payload: Payload, field: IField): boolean {
    // Native fields only allow visibility and width changes
    if (payload.name !== field.name) return false;
    if (payload.type !== field.type) return false;
    if (payload.trashed || payload.trashedAt) return false;
    if (payload.required !== field.required) return false;
    if (payload.multiple !== field.multiple) return false;
    if (payload.format !== field.format) return false;
    if (payload.defaultValue !== field.defaultValue) return false;
    if (payload.showInFilter !== field.showInFilter) return false;
    if (payload.showInForm !== field.showInForm) return false;
    if (
      JSON.stringify(payload.relationship ?? null) !==
      JSON.stringify(field.relationship ?? null)
    )
      return false;
    if (
      JSON.stringify(payload.group ?? null) !==
      JSON.stringify(field.group ?? null)
    )
      return false;
    if (
      JSON.stringify(payload.dropdown ?? []) !==
      JSON.stringify(field.dropdown ?? [])
    )
      return false;
    if (
      JSON.stringify(payload.category ?? []) !==
      JSON.stringify(field.category ?? [])
    )
      return false;
    return true;
  }

  private canUpdateLockedField(payload: Payload, field: IField): boolean {
    if (payload.name !== field.name) return false;
    if (payload.type !== field.type) return false;
    if (payload.trashed || payload.trashedAt) return false;

    const sameConfig =
      payload.required === field.required &&
      payload.multiple === field.multiple &&
      payload.format === field.format &&
      payload.showInFilter === field.showInFilter &&
      payload.showInForm === field.showInForm &&
      payload.showInDetail === field.showInDetail &&
      payload.showInList === field.showInList &&
      payload.defaultValue === field.defaultValue &&
      JSON.stringify(payload.relationship ?? null) ===
        JSON.stringify(field.relationship ?? null) &&
      JSON.stringify(payload.group ?? null) ===
        JSON.stringify(field.group ?? null);

    return sameConfig;
  }
}
