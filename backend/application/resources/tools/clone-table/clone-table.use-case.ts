/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import slugify from 'slugify';

import { left, right } from '@application/core/either.core';
import { FIELD_NATIVE_LIST, type IField } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import { RowContractRepository } from '@application/repositories/row/row-contract.repository';
import {
  TableContractRepository,
  TableCreatePayload,
} from '@application/repositories/table/table-contract.repository';
import { TableSchemaContractService } from '@application/services/table-schema/table-schema-contract.service';

import {
  CALENDAR_TEMPLATE_ID,
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
import { createCalendarTemplate } from './templates/calendar-template';
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
    private readonly rowRepository: RowContractRepository,
    private readonly tableSchemaService: TableSchemaContractService,
  ) {}

  private getTemplateDeps(): CloneTableDeps {
    return {
      tableRepository: this.tableRepository,
      fieldRepository: this.fieldRepository,
      rowRepository: this.rowRepository,
      tableSchemaService: this.tableSchemaService,
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

      if (payload.baseTableId === CALENDAR_TEMPLATE_ID) {
        return await createCalendarTemplate(payload, templateDeps);
      }

      const baseTable = await this.tableRepository.findById(
        payload.baseTableId,
      );

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

      const { nativeFields, nativeFieldIds } = await this.createNativeFields();

      const nativeIdMap: Record<string, string> = {};
      const baseNativeFields = baseTable.fields.filter((f) => f.native);
      for (const baseNative of baseNativeFields) {
        const matched = nativeFields.find((nf) => nf.slug === baseNative.slug);
        if (matched) {
          nativeIdMap[baseNative._id] = matched._id;
        }
      }

      const nonNativeFields = baseTable.fields.filter(
        (f) => !f.native && !f.trashed,
      );

      const { newFieldIds, fieldIdMap, clonedFields } =
        await this.cloneFields(nonNativeFields);

      const combinedFieldIdMap = { ...nativeIdMap, ...fieldIdMap };

      const clonedGroups = await this.cloneGroups(
        baseTable.groups,
        clonedFields,
        combinedFieldIdMap,
      );

      const _schema = this.tableSchemaService.computeSchema(
        [...nativeFields, ...clonedFields],
        clonedGroups,
      );

      const orderList = this.remapFieldIds(
        baseTable.fieldOrderList,
        combinedFieldIdMap,
      );

      const orderForm = this.remapFieldIds(
        baseTable.fieldOrderForm,
        combinedFieldIdMap,
      );

      const orderFilter = this.remapFieldIds(
        baseTable.fieldOrderFilter,
        combinedFieldIdMap,
      );

      const orderDetail = this.remapFieldIds(
        baseTable.fieldOrderDetail,
        combinedFieldIdMap,
      );

      const createPayload: TableCreatePayload = {
        _schema,
        name: payload.name,
        slug: newSlug,
        description: baseTable.description ?? null,
        type: baseTable.type,
        logo: baseTable.logo?._id ?? null,
        fields: [...nativeFieldIds, ...newFieldIds],
        style: baseTable.style,
        visibility: baseTable.visibility,
        collaboration: baseTable.collaboration,
        administrators: baseTable.administrators.flatMap((a) => a._id),
        owner: payload.ownerId,
        fieldOrderList: orderList,
        fieldOrderForm: orderForm,
        fieldOrderFilter: orderFilter,
        fieldOrderDetail: orderDetail,
        methods: baseTable.methods,
        groups: clonedGroups,
      };

      const newTable = await this.tableRepository.create(createPayload);

      return right({
        table: newTable,
        fieldIdMap: combinedFieldIdMap,
      });
    } catch (error) {
      console.error('[tools > clone-table][error]:', error);
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
        widthInDetail: field.widthInDetail,
      });

      newFieldIds.push(createdField._id);
      fieldIdMap[field._id] = createdField._id;
      clonedFields.push(createdField);
    }

    return { newFieldIds, fieldIdMap, clonedFields };
  }

  private async createNativeFields(): Promise<{
    nativeFields: IField[];
    nativeFieldIds: string[];
  }> {
    const nativeFields =
      await this.fieldRepository.createMany(FIELD_NATIVE_LIST);
    const nativeFieldIds = nativeFields.flatMap((f) => f._id);
    return { nativeFields, nativeFieldIds };
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
        if (field.trashed) continue;

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
          widthInDetail: field.widthInDetail,
        });

        fieldIdMap[field._id] = createdField._id;
        clonedFieldMap.set(createdField._id, createdField);
        groupFields.push(createdField);
      }

      clonedGroups.push({
        slug: group.slug,
        name: group.name,
        fields: groupFields,
        _schema: this.tableSchemaService.computeSchema(groupFields),
      });
    }

    return clonedGroups;
  }
}
