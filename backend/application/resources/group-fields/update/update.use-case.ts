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
      const table = await this.tableRepository.findBySlug(payload.slug);

      if (!table)
        return left(
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );

      const targetGroup = table.groups?.find(
        (g) => g.slug === payload.groupSlug,
      );

      if (!targetGroup) {
        return left(
          HTTPException.NotFound('Grupo não encontrado', 'GROUP_NOT_FOUND'),
        );
      }

      const field = await this.fieldRepository.findById(payload.fieldId);

      if (!field)
        return left(
          HTTPException.NotFound('Campo não encontrado', 'FIELD_NOT_FOUND'),
        );

      if (field.native && !this.canUpdateNativeField(payload, field)) {
        return left(
          HTTPException.Forbidden(
            'Campos nativos só podem ter visibilidade e largura atualizados',
            'NATIVE_FIELD_RESTRICTED',
          ),
        );
      }

      if (field.locked && !this.canUpdateLockedField(payload, field)) {
        return left(
          HTTPException.Forbidden(
            'Campo está bloqueado e não pode ser atualizado',
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
        ...(payload.trashed && {
          trashed: payload.trashed,
          required: false,
          showInList: false,
          showInForm: false,
          showInDetail: false,
          showInFilter: false,
        }),
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
          'Erro interno do servidor',
          'UPDATE_GROUP_FIELD_ERROR',
        ),
      );
    }
  }

  private canUpdateNativeField(payload: Payload, field: IField): boolean {
    // Native fields only allow visibility and width changes
    // Group context is already defined by the URL, so group comparison is skipped
    if (payload.name !== field.name) return false;
    if (payload.type !== field.type) return false;
    if (payload.trashed || payload.trashedAt) return false;
    if (payload.required !== field.required) return false;
    if (payload.multiple !== field.multiple) return false;
    if (payload.format !== field.format) return false;
    if (payload.defaultValue !== field.defaultValue) return false;

    // relationship: comparar por _id
    const payloadRelId = payload.relationship?.table?._id ?? null;
    const fieldRelId = field.relationship?.table?._id ?? null;
    if (payloadRelId !== fieldRelId) return false;

    // dropdown: comparar por ids
    const payloadDropdownIds = (payload.dropdown ?? [])
      .map((d) => d.id)
      .join(',');
    const fieldDropdownIds = (field.dropdown ?? []).map((d) => d.id).join(',');
    if (payloadDropdownIds !== fieldDropdownIds) return false;

    // category: comparar por ids
    const payloadCategoryIds = (payload.category ?? [])
      .map((c) => c.id)
      .join(',');
    const fieldCategoryIds = (field.category ?? []).map((c) => c.id).join(',');
    if (payloadCategoryIds !== fieldCategoryIds) return false;

    return true;
  }

  private canUpdateLockedField(payload: Payload, field: IField): boolean {
    // Locked fields allow visibility and width changes, block everything else
    // Group context is already defined by the URL, so group comparison is skipped
    if (payload.name !== field.name) return false;
    if (payload.type !== field.type) return false;
    if (payload.trashed || payload.trashedAt) return false;
    if (payload.required !== field.required) return false;
    if (payload.multiple !== field.multiple) return false;
    if (payload.format !== field.format) return false;
    if (payload.defaultValue !== field.defaultValue) return false;

    // relationship: comparar por _id
    const payloadRelId = payload.relationship?.table?._id ?? null;
    const fieldRelId = field.relationship?.table?._id ?? null;
    if (payloadRelId !== fieldRelId) return false;

    return true;
  }
}
