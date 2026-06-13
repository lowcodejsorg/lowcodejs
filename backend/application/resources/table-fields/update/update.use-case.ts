/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import {
  buildFieldPermissions,
  E_FIELD_TYPE,
  type IField as Entity,
  type IField,
  type IGroupConfiguration,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { FieldSlug } from '@application/core/field-slug.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import { RowContractRepository } from '@application/repositories/row/row-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';
import { ModelBuilderContractService } from '@application/services/table/model-builder-contract.service';
import { SchemaBuilderContractService } from '@application/services/table/schema-builder-contract.service';
import { deleteCascadeDropdownConfigsForField } from '@extensions/forms/plugins/cascade-dropdown/cascade-dropdown-config.model';

import {
  hasDuplicateDropdownLabels,
  normalizeDefaultValue,
} from '../table-field-base.schema';

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
    private readonly rowRepository: RowContractRepository,
    private readonly schemaBuilder: SchemaBuilderContractService,
    private readonly modelBuilder: ModelBuilderContractService,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const tableSlug = payload.tableSlug ?? payload.slug;
      if (!tableSlug) {
        return left(
          HTTPException.BadRequest('Tabela inválida', 'INVALID_TABLE_SLUG'),
        );
      }

      const table = await this.tableRepository.findBySlug(tableSlug);

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

      if (field.native) {
        const updatedField = await this.fieldRepository.update({
          _id: field._id,
          showInFilter: payload.showInFilter,
          // Visibilidade por contexto (list/form/detail) por grupo.
          permissions: payload.permissions,
          widthInForm: payload.widthInForm,
          widthInList: payload.widthInList,
          widthInDetail: payload.widthInDetail,
          tip: payload.tip,
        });

        const fields = table.fields.map((f) =>
          f._id === field._id ? updatedField : f,
        );
        const groups = table.groups || [];
        const _schema = this.schemaBuilder.build(fields, groups);

        await this.tableRepository.update({
          _id: table._id,
          _schema,
          fields: fields.flatMap((f) => f._id),
          groups,
          owner: table.owner._id,
        });

        return right(updatedField);
      }

      if (field.locked && !this.canUpdateLockedField(payload, field)) {
        return left(
          HTTPException.Forbidden(
            'Campo está bloqueado e não pode ser atualizado',
            'FIELD_LOCKED',
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
      const nameChanged = payload.name !== field.name;
      let resolvedSlug: { slug: string; error: string | null } = {
        slug: oldSlug,
        error: null,
      };
      if (nameChanged) {
        resolvedSlug = FieldSlug.resolve({ name: payload.name });
      }

      if (resolvedSlug.error) {
        return left(
          HTTPException.BadRequest('Slug inválido', 'INVALID_FIELD_SLUG', {
            slug: resolvedSlug.error,
          }),
        );
      }

      const slug = resolvedSlug.slug;

      const existFieldOnTable = table.fields?.some(
        (item) => item._id !== field._id && item.slug === slug && !item.trashed,
      );

      if (existFieldOnTable) {
        return left(
          HTTPException.Conflict('Campo já existe', 'FIELD_ALREADY_EXIST', {
            slug: 'Campo já existe',
          }),
        );
      }

      if (hasDuplicateDropdownLabels(payload.dropdown)) {
        return left(
          HTTPException.Conflict(
            'Opções do dropdown não podem ter nomes duplicados',
            'DROPDOWN_OPTION_ALREADY_EXISTS',
            { dropdown: 'Opção já existe no dropdown' },
          ),
        );
      }

      let normalizedGroup: { slug: string; _id?: string } | null = null;
      if (typeof payload.group === 'string') {
        normalizedGroup = { slug: payload.group };
      } else if (payload.group) {
        normalizedGroup = { slug: payload.group.slug };
        if (payload.group._id) {
          normalizedGroup._id = payload.group._id;
        }
      }

      let updatedField = await this.fieldRepository.update({
        ...payload,
        defaultValue: normalizeDefaultValue(payload.type, payload.defaultValue),
        _id: field._id,
        slug,
        group: normalizedGroup,
        ...(payload.trashed && {
          trashed: payload.trashed,
          required: false,
          showInFilter: false,
          permissions: buildFieldPermissions(false, false, false),
        }),
        ...(payload.trashedAt && { trashedAt: payload.trashedAt }),
      });

      let groups = table.groups || [];

      if (updatedField.type === E_FIELD_TYPE.FIELD_GROUP) {
        const existingGroup = groups.find((g) => g.slug === field.group?.slug);
        const groupId = updatedField._id;

        if (!existingGroup) {
          const newGroup: IGroupConfiguration = {
            _id: groupId,
            slug,
            name: updatedField.name,
            fields: [],
            _schema: {},
          };
          groups = [...groups, newGroup];
        } else {
          groups = groups.map((g) => {
            if (g.slug === existingGroup.slug) {
              return { ...g, _id: groupId, slug, name: updatedField.name };
            }
            return g;
          });
        }

        updatedField = await this.fieldRepository.update({
          _id: updatedField._id,
          group: { slug, _id: groupId },
        });
      }

      const fields = table.fields.map((f) =>
        f._id === field._id ? updatedField : f,
      );

      const _schema = this.schemaBuilder.build(fields, groups);

      await this.tableRepository.update({
        _id: table._id,
        _schema,
        fields: fields.flatMap((f) => f._id),
        groups,
        owner: table.owner._id,
      });

      if (oldSlug !== slug) {
        await this.modelBuilder.build({
          ...table,
          _id: table._id,
          _schema,
          groups,
        });
        await this.rowRepository.renameField(table, oldSlug, slug);
      }

      if (payload.trashed) {
        await deleteCascadeDropdownConfigsForField({
          tableSlug,
          fieldId: field._id,
          fieldSlug: field.slug,
        });
      }

      return right(updatedField);
    } catch (error) {
      console.error('[table-fields > update][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'UPDATE_FIELD_TABLE_ERROR',
        ),
      );
    }
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
