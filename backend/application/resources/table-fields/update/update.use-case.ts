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
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { buildSchema, buildTable } from '@application/core/util.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import { normalizeDefaultValue } from '../table-field-base.schema';

import type { TableFieldUpdatePayload } from './update.validator';

type Response = Either<HTTPException, Entity>;
type Payload = TableFieldUpdatePayload;

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
export default class TableFieldUpdateUseCase {
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

      const field = await this.fieldRepository.findById(payload._id);

      if (!field)
        return left(
          HTTPException.NotFound('Campo não encontrado', 'FIELD_NOT_FOUND'),
        );

      if (field.native && payload.trashed) {
        return left(
          HTTPException.Forbidden(
            'Campos nativos não podem ser enviados para a lixeira',
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
            'Campo está bloqueado e não pode ser atualizado',
            'FIELD_LOCKED',
          ),
        );
      }

      if (field.native && !this.canUpdateNativeField(payload, field)) {
        return left(
          HTTPException.Forbidden(
            'Campos nativos só podem ter visibilidade e largura atualizados',
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
            'Último campo ativo, não pode ser enviado para a lixeira',
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
        defaultValue: normalizeDefaultValue(payload.type, payload.defaultValue),
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
          'Erro interno do servidor',
          'UPDATE_FIELD_TABLE_ERROR',
        ),
      );
    }
  }

  private canUpdateNativeField(payload: Payload, field: IField): boolean {
    // Native fields only allow visibility and width changes
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

    // group: comparar por slug
    const payloadGroupSlug =
      typeof payload.group === 'string'
        ? payload.group
        : (payload.group?.slug ?? null);
    const fieldGroupSlug = field.group?.slug ?? null;
    if (payloadGroupSlug !== fieldGroupSlug) return false;

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

    // group: comparar por slug
    const payloadGroupSlug =
      typeof payload.group === 'string'
        ? payload.group
        : (payload.group?.slug ?? null);
    const fieldGroupSlug = field.group?.slug ?? null;
    if (payloadGroupSlug !== fieldGroupSlug) return false;

    return true;
  }
}
