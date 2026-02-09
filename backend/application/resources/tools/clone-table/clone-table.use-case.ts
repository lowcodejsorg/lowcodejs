/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import slugify from 'slugify';

import { left, right } from '@application/core/either.core';
import type { IField } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { buildSchema } from '@application/core/util.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import {
  TableContractRepository,
  TableCreatePayload,
} from '@application/repositories/table/table-contract.repository';

import {
  CARDS_TEMPLATE_ID,
  DOCUMENT_TEMPLATE_ID,
  FORUM_TEMPLATE_ID,
  KANBAN_TEMPLATE_ID,
  MOSAIC_TEMPLATE_ID,
} from './clone-table.constants';
import type {
  CloneTableDeps,
  CloneTableResponse,
  CloneTableUseCasePayload,
} from './clone-table.types';
import { createCardsTemplate } from './templates/cards-template';
import { createDocumentTemplate } from './templates/document-template';
import { createForumTemplate } from './templates/forum-template';
import { createKanbanTemplate } from './templates/kanban-template';
import { createMosaicTemplate } from './templates/mosaic-template';

type Response = CloneTableResponse;

@Service()
export default class CloneTableUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly fieldRepository: FieldContractRepository,
  ) {}

  private getTemplateDeps(): CloneTableDeps {
    return {
      tableRepository: this.tableRepository,
      fieldRepository: this.fieldRepository,
    };
  }

  async execute(payload: CloneTableUseCasePayload): Promise<Response> {
    try {
      if (!payload.ownerId) {
        return left(
          HTTPException.BadRequest(
            'Owner ID é obrigatório',
            'OWNER_ID_REQUIRED',
          ),
        );
      }

      const templateDeps = this.getTemplateDeps();

      if (payload.baseTableId === KANBAN_TEMPLATE_ID) {
        return await createKanbanTemplate(payload, templateDeps);
      }

      if (payload.baseTableId === CARDS_TEMPLATE_ID) {
        return await createCardsTemplate(payload, templateDeps);
      }

      if (payload.baseTableId === MOSAIC_TEMPLATE_ID) {
        return await createMosaicTemplate(payload, templateDeps);
      }

      if (payload.baseTableId === DOCUMENT_TEMPLATE_ID) {
        return await createDocumentTemplate(payload, templateDeps);
      }

      if (payload.baseTableId === FORUM_TEMPLATE_ID) {
        return await createForumTemplate(payload, templateDeps);
      }

      const baseTable = await this.tableRepository.findBy({
        _id: payload.baseTableId,
        exact: true,
      });

      if (!baseTable) {
        return left(
          HTTPException.NotFound(
            'Tabela base não encontrada',
            'TABLE_NOT_FOUND',
          ),
        );
      }

      const newSlug = slugify(payload.name, {
        lower: true,
        strict: true,
        trim: true,
      });

      const { newFieldIds, fieldIdMap, clonedFields } = await this.cloneFields(
        baseTable.fields,
      );

      const clonedGroups = await this.cloneGroups(
        baseTable.groups,
        clonedFields,
        fieldIdMap,
      );

      const _schema = buildSchema(clonedFields, clonedGroups);

      const orderList = this.remapFieldIds(
        baseTable.fieldOrderList,
        fieldIdMap,
      );

      const orderForm = this.remapFieldIds(
        baseTable.fieldOrderForm,
        fieldIdMap,
      );

      const createPayload: TableCreatePayload = {
        _schema,
        name: payload.name,
        slug: newSlug,
        description: baseTable.description ?? null,
        type: baseTable.type,
        logo: baseTable.logo?._id ?? null,
        fields: newFieldIds,
        style: baseTable.style,
        visibility: baseTable.visibility,
        collaboration: baseTable.collaboration,
        administrators: baseTable.administrators.flatMap((a) => a._id),
        owner: payload.ownerId,
        fieldOrderList: orderList,
        fieldOrderForm: orderForm,
        methods: baseTable.methods,
        groups: clonedGroups,
      };

      const newTable = await this.tableRepository.create(createPayload);

      return right({
        table: newTable,
        fieldIdMap,
      });
    } catch (_error) {
      return left(
        HTTPException.InternalServerError(
          'Erro ao clonar tabela',
          'CLONE_TABLE_ERROR',
        ),
      );
    }
  }

  private async cloneFields(fields: IField[]): Promise<{
    newFieldIds: string[];
    fieldIdMap: Record<string, string>;
    clonedFields: IField[];
  }> {
    const newFieldIds: string[] = [];
    const fieldIdMap: Record<string, string> = {};
    const clonedFields: IField[] = [];

    if (!fields || !Array.isArray(fields)) {
      return { newFieldIds, fieldIdMap, clonedFields };
    }

    for (const field of fields) {
      const createdField = await this.fieldRepository.create({
        name: field.name,
        slug: field.slug,
        type: field.type,
        required: field.required,
        multiple: field.multiple,
        format: field.format,
        showInList: field.showInList,
        showInForm: field.showInForm,
        showInDetail: field.showInDetail,
        showInFilter: field.showInFilter,
        defaultValue: field.defaultValue,
        locked: field.locked,
        relationship: field.relationship,
        dropdown: field.dropdown,
        category: field.category,
        group: field.group,
        widthInForm: field.widthInForm,
        widthInList: field.widthInList,
      });

      newFieldIds.push(createdField._id);
      fieldIdMap[field._id] = createdField._id;
      clonedFields.push(createdField);
    }

    return { newFieldIds, fieldIdMap, clonedFields };
  }

  private remapFieldIds(
    ids: string[] | undefined,
    map: Record<string, string>,
  ): string[] {
    if (!Array.isArray(ids)) return [];

    return ids.map((id) => map[id]).filter(Boolean);
  }

  private async cloneGroups(
    groups:
      | import('@application/core/entity.core').IGroupConfiguration[]
      | undefined,
    clonedFields: IField[],
    fieldIdMap: Record<string, string>,
  ): Promise<import('@application/core/entity.core').IGroupConfiguration[]> {
    if (!groups || !Array.isArray(groups) || groups.length === 0) {
      return [];
    }

    const clonedFieldMap = new Map(
      clonedFields.map((field) => [field._id, field]),
    );

    const clonedGroups: import('@application/core/entity.core').IGroupConfiguration[] =
      [];

    for (const group of groups) {
      const groupFields: IField[] = [];

      for (const field of group.fields ?? []) {
        const existingId = fieldIdMap[field._id];
        if (existingId) {
          const mapped = clonedFieldMap.get(existingId);
          if (mapped) groupFields.push(mapped);
          continue;
        }

        const createdField = await this.fieldRepository.create({
          name: field.name,
          slug: field.slug,
          type: field.type,
          required: field.required,
          multiple: field.multiple,
          format: field.format,
          showInList: field.showInList,
          showInForm: field.showInForm,
          showInDetail: field.showInDetail,
          showInFilter: field.showInFilter,
          defaultValue: field.defaultValue,
          locked: field.locked,
          relationship: field.relationship,
          dropdown: field.dropdown,
          category: field.category,
          group: field.group,
          widthInForm: field.widthInForm,
          widthInList: field.widthInList,
        });

        fieldIdMap[field._id] = createdField._id;
        clonedFieldMap.set(createdField._id, createdField);
        groupFields.push(createdField);
      }

      clonedGroups.push({
        slug: group.slug,
        name: group.name,
        fields: groupFields,
        _schema: buildSchema(groupFields),
      });
    }

    return clonedGroups;
  }
}
