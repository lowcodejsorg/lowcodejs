/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import slugify from 'slugify';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IField as Entity, IField } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';
import { normalizeDefaultValue } from '@application/resources/table-fields/table-field-base.schema';
import { TableSchemaContractService } from '@application/services/table-schema/table-schema-contract.service';

import type { GroupFieldUpdatePayload } from './update.validator';

type Response = Either<HTTPException, Entity>;
type Payload = GroupFieldUpdatePayload;

function isDefaultValueEqual(
  a: string | string[] | null | undefined,
  b: string | string[] | null | undefined,
): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  if (typeof a === 'string' && typeof b === 'string') return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => v === b[i]);
  }
  return false;
}

@Service()
export default class GroupFieldUpdateUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly fieldRepository: FieldContractRepository,
    private readonly tableSchemaService: TableSchemaContractService,
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
        defaultValue: normalizeDefaultValue(payload.type, payload.defaultValue),
        _id: field._id,
        slug,
        group: normalizedGroup,
        ...(payload.trashed && {
          trashed: payload.trashed,
          required: false,
          visibilityList: 'HIDDEN',
          visibilityForm: 'HIDDEN',
          visibilityDetail: 'HIDDEN',
        }),
        ...(payload.trashedAt && { trashedAt: payload.trashedAt }),
      });

      // Atualiza o grupo com o campo atualizado
      const updatedGroups = table.groups.map((g) => {
        if (g.slug !== targetGroup.slug) return g;

        const updatedFields = g.fields.map((f) =>
          f._id === field._id ? updatedField : f,
        );
        const groupSchema =
          this.tableSchemaService.computeSchema(updatedFields);

        return {
          ...g,
          fields: updatedFields,
          _schema: groupSchema,
        };
      });

      // Reconstrói o schema da tabela pai com os grupos atualizados
      const parentSchema = this.tableSchemaService.computeSchema(
        table.fields,
        updatedGroups,
      );

      await this.tableRepository.update({
        _id: table._id,
        _schema: parentSchema,
        groups: updatedGroups,
        owner: table.owner._id,
      });

      await this.tableSchemaService.syncModel({
        ...table,
        _id: table._id,
        _schema: parentSchema,
        groups: updatedGroups,
      });

      return right(updatedField);
    } catch (error) {
      console.error('[group-fields > update][error]:', error);
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
    if (!isDefaultValueEqual(payload.defaultValue, field.defaultValue))
      return false;

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
    if (!isDefaultValueEqual(payload.defaultValue, field.defaultValue))
      return false;

    // relationship: comparar por _id
    const payloadRelId = payload.relationship?.table?._id ?? null;
    const fieldRelId = field.relationship?.table?._id ?? null;
    if (payloadRelId !== fieldRelId) return false;

    return true;
  }
}
