/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import slugify from 'slugify';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IField as Entity, IField } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { buildSchema, buildTable } from '@application/core/util.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { GroupFieldUpdatePayload } from './update.validator';

type Response = Either<HTTPException, Entity>;
type Payload = GroupFieldUpdatePayload;

@Service()
export default class GroupFieldUpdateUseCase {
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

      const targetGroup = table.groups?.find(
        (g) => g.slug === payload.groupSlug,
      );

      if (!targetGroup) {
        return left(
          HTTPException.NotFound('Group not found', 'GROUP_NOT_FOUND'),
        );
      }

      const field = await this.fieldRepository.findBy({
        _id: payload.fieldId,
        exact: true,
      });

      if (!field)
        return left(
          HTTPException.NotFound('Field not found', 'FIELD_NOT_FOUND'),
        );

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
      const updatedGroups = table.groups.map((g) => {
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
      const parentSchema = buildSchema(table.fields as IField[], updatedGroups);

      await this.tableRepository.update({
        _id: table._id,
        _schema: parentSchema,
        groups: updatedGroups,
        owner: table.owner._id,
        administrators: table.administrators.flatMap((a) => a._id),
      });

      await buildTable({
        ...table,
        _id: table._id,
        _schema: parentSchema,
        groups: updatedGroups,
      });

      return right(updatedField);
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'UPDATE_GROUP_FIELD_ERROR',
        ),
      );
    }
  }

  private canUpdateNativeField(payload: Payload, field: IField): boolean {
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
