/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import slugify from 'slugify';

import { left, right } from '@application/core/either.core';
import {
  E_FIELD_TYPE,
  FIELD_NATIVE_LIST,
  type IField,
  type IGroupConfiguration,
  type ILayoutFields,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { buildSchema, buildTable } from '@application/core/util.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import {
  TableContractRepository,
  type TableCreatePayload,
} from '@application/repositories/table/table-contract.repository';

import type {
  ImportTableResponse,
  ImportTableUseCasePayload,
} from './import-table.types';

type ExportedField = {
  name: string;
  slug: string;
  type: string;
  required: boolean;
  multiple: boolean;
  format: string | null;
  showInFilter: boolean;
  showInForm: boolean;
  showInDetail: boolean;
  showInList: boolean;
  widthInForm: number | null;
  widthInList: number | null;
  widthInDetail: number | null;
  defaultValue: string | null;
  locked?: boolean;
  relationship: {
    tableSlug: string;
    fieldSlug: string;
    order: 'asc' | 'desc';
  } | null;
  dropdown: Array<{ id: string; label: string; color?: string | null }>;
  category: Array<{ id: string; label: string; children: unknown[] }>;
  group: { slug: string } | null;
};

@Service()
export default class ImportTableUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly fieldRepository: FieldContractRepository,
  ) {}

  async execute(
    payload: ImportTableUseCasePayload,
  ): Promise<ImportTableResponse> {
    try {
      if (!payload.ownerId) {
        return left(
          HTTPException.BadRequest(
            'Owner ID é obrigatório',
            'OWNER_ID_REQUIRED',
          ),
        );
      }

      const { fileContent, name } = payload;
      const content = fileContent as any;
      const header = content.header;
      const structure = content.structure;
      const data = content.data;

      if (!header || header.platform !== 'lowcodejs') {
        return left(
          HTTPException.BadRequest(
            'Arquivo de importação inválido. Plataforma não reconhecida.',
            'INVALID_PLATFORM',
          ),
        );
      }

      const newSlug = slugify(name, {
        lower: true,
        strict: true,
        trim: true,
      });

      // Check slug uniqueness
      const existingTable = await this.tableRepository.findBy({
        slug: newSlug,
        exact: true,
      });

      if (existingTable) {
        return left(
          HTTPException.BadRequest(
            'Já existe uma tabela com este nome/slug',
            'TABLE_SLUG_ALREADY_EXISTS',
          ),
        );
      }

      // 1. Create native fields
      const nativeFields =
        await this.fieldRepository.createMany(FIELD_NATIVE_LIST);
      const nativeFieldIds = nativeFields.map((f) => f._id);

      let importedFieldCount = 0;
      let importedRowCount = 0;
      const allCreatedFields: IField[] = [...nativeFields];
      const createdFieldIds: string[] = [...nativeFieldIds];
      const slugToFieldId = new Map<string, string>();

      // Map native fields
      for (const nf of nativeFields) {
        slugToFieldId.set(nf.slug, nf._id);
      }

      if (structure) {
        // 2. Create top-level fields (non-group fields)
        for (const exportedField of structure.fields) {
          const createdField = await this.createField(exportedField);
          createdFieldIds.push(createdField._id);
          allCreatedFields.push(createdField);
          slugToFieldId.set(createdField.slug, createdField._id);
          importedFieldCount++;
        }

        // 3. Create groups and their fields
        const groups: IGroupConfiguration[] = [];

        for (const exportedGroup of structure.groups || []) {
          const groupFields: IField[] = [];

          // Create the FIELD_GROUP field itself
          const fieldGroupField = await this.fieldRepository.create({
            name: exportedGroup.name,
            slug: exportedGroup.slug,
            type: E_FIELD_TYPE.FIELD_GROUP,
            required: false,
            multiple: false,
            format: null,
            showInList: true,
            showInForm: true,
            showInDetail: true,
            showInFilter: false,
            widthInForm: null,
            widthInList: null,
            widthInDetail: null,
            defaultValue: null,
            relationship: null,
            dropdown: [],
            category: [],
            group: { slug: exportedGroup.slug },
          });

          createdFieldIds.push(fieldGroupField._id);
          allCreatedFields.push(fieldGroupField);
          slugToFieldId.set(fieldGroupField.slug, fieldGroupField._id);
          importedFieldCount++;

          // Create group native fields
          const groupNativeList = [
            {
              name: 'ID',
              slug: '_id',
              type: E_FIELD_TYPE.IDENTIFIER,
              native: true,
              locked: true,
              required: false,
              multiple: false,
              format: null,
              showInList: false,
              showInFilter: false,
              showInForm: false,
              showInDetail: false,
              widthInForm: null,
              widthInList: 10,
              widthInDetail: null,
              defaultValue: null,
              relationship: null,
              dropdown: [],
              category: [],
              group: { slug: exportedGroup.slug },
            },
            {
              name: 'Criado em',
              slug: 'createdAt',
              type: E_FIELD_TYPE.CREATED_AT,
              native: true,
              locked: true,
              required: false,
              multiple: false,
              format: 'dd/MM/yyyy HH:mm:ss' as const,
              showInList: true,
              showInFilter: false,
              showInForm: false,
              showInDetail: true,
              widthInForm: null,
              widthInList: 10,
              widthInDetail: null,
              defaultValue: null,
              relationship: null,
              dropdown: [],
              category: [],
              group: { slug: exportedGroup.slug },
            },
            {
              name: 'Lixeira',
              slug: 'trashed',
              type: E_FIELD_TYPE.TRASHED,
              native: true,
              locked: true,
              required: false,
              multiple: false,
              format: null,
              showInList: false,
              showInFilter: false,
              showInForm: false,
              showInDetail: false,
              widthInForm: null,
              widthInList: 10,
              widthInDetail: null,
              defaultValue: null,
              relationship: null,
              dropdown: [],
              category: [],
              group: { slug: exportedGroup.slug },
            },
            {
              name: 'Enviado para lixeira em',
              slug: 'trashedAt',
              type: E_FIELD_TYPE.TRASHED_AT,
              native: true,
              locked: true,
              required: false,
              multiple: false,
              format: null,
              showInList: false,
              showInFilter: false,
              showInForm: false,
              showInDetail: false,
              widthInForm: null,
              widthInList: 10,
              widthInDetail: null,
              defaultValue: null,
              relationship: null,
              dropdown: [],
              category: [],
              group: { slug: exportedGroup.slug },
            },
          ];

          const groupNativeFields =
            await this.fieldRepository.createMany(groupNativeList);

          for (const gnf of groupNativeFields) {
            groupFields.push(gnf);
          }

          // Create group sub-fields
          for (const exportedSubField of exportedGroup.fields) {
            const createdSubField = await this.createField({
              ...exportedSubField,
              group: { slug: exportedGroup.slug },
            });
            groupFields.push(createdSubField);
            importedFieldCount++;
          }

          const groupSchema = buildSchema(groupFields);

          groups.push({
            slug: exportedGroup.slug,
            name: exportedGroup.name,
            fields: groupFields,
            _schema: groupSchema,
          });
        }

        // 4. Resolve layout fields (slug -> new field id)
        const layoutFields: Partial<ILayoutFields> = {};
        if (structure.layoutFields) {
          for (const [key, slugValue] of Object.entries(
            structure.layoutFields as Record<string, string | null>,
          )) {
            if (slugValue && slugToFieldId.has(slugValue)) {
              layoutFields[key as keyof ILayoutFields] =
                slugToFieldId.get(slugValue) || null;
            } else {
              layoutFields[key as keyof ILayoutFields] = null;
            }
          }
        }

        // 5. Resolve field order (slug -> new field id)
        const fieldOrderList = (structure.fieldOrderList || [])
          .map((slug: string) => slugToFieldId.get(slug))
          .filter(Boolean) as string[];

        const fieldOrderForm = (structure.fieldOrderForm || [])
          .map((slug: string) => slugToFieldId.get(slug))
          .filter(Boolean) as string[];

        // 6. Build schema and create table
        const _schema = buildSchema(allCreatedFields, groups);

        const createPayload: TableCreatePayload = {
          _schema,
          name,
          slug: newSlug,
          description: structure.description ?? null,
          type: 'TABLE',
          logo: null,
          fields: createdFieldIds,
          style: structure.style as any,
          visibility: structure.visibility as any,
          collaboration: structure.collaboration as any,
          administrators: [],
          owner: payload.ownerId,
          fieldOrderList,
          fieldOrderForm,
          methods: structure.methods || {
            onLoad: { code: null },
            beforeSave: { code: null },
            afterSave: { code: null },
          },
          groups,
          layoutFields: layoutFields as ILayoutFields,
        };

        const newTable = await this.tableRepository.create(createPayload);

        // 7. Import data if available
        if (data && data.rows && data.rows.length > 0 && newTable) {
          const fullTable = await this.tableRepository.findBy({
            _id: newTable._id,
            exact: true,
          });

          if (fullTable) {
            const model = await buildTable(fullTable);

            for (const row of data.rows) {
              try {
                const doc = new model(row);
                doc.creator = payload.ownerId as any;
                await doc.collection.insertOne(doc.toObject());
                importedRowCount++;
              } catch (rowError) {
                console.error('Erro ao importar row:', rowError);
                // Continue importing other rows
              }
            }
          }
        }

        return right({
          tableId: newTable._id,
          slug: newTable.slug,
          importedFields: importedFieldCount,
          importedRows: importedRowCount,
        });
      }

      // Data-only import (no structure) - needs an existing table slug in header
      // This is not supported in the current version
      return left(
        HTTPException.BadRequest(
          'Importação somente de dados requer a estrutura da tabela no arquivo',
          'STRUCTURE_REQUIRED',
        ),
      );
    } catch (_error) {
      console.error(_error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'IMPORT_TABLE_ERROR',
        ),
      );
    }
  }

  private async createField(exportedField: ExportedField): Promise<IField> {
    // For RELATIONSHIP fields, try to resolve the table reference
    let relationship = null;
    if (exportedField.relationship) {
      const relatedTable = await this.tableRepository.findBy({
        slug: exportedField.relationship.tableSlug,
        exact: true,
      });

      if (relatedTable) {
        const relatedField = relatedTable.fields.find(
          (f) => f.slug === exportedField.relationship!.fieldSlug,
        );

        if (relatedField) {
          relationship = {
            table: { _id: relatedTable._id, slug: relatedTable.slug },
            field: { _id: relatedField._id, slug: relatedField.slug },
            order: exportedField.relationship.order,
          };
        }
      }
    }

    return this.fieldRepository.create({
      name: exportedField.name,
      slug: exportedField.slug,
      type: exportedField.type as any,
      required: exportedField.required,
      multiple: exportedField.multiple,
      format: exportedField.format as any,
      showInList: exportedField.showInList,
      showInForm: exportedField.showInForm,
      showInDetail: exportedField.showInDetail,
      showInFilter: exportedField.showInFilter,
      widthInForm: exportedField.widthInForm,
      widthInList: exportedField.widthInList,
      widthInDetail: exportedField.widthInDetail,
      defaultValue: exportedField.defaultValue,
      locked: exportedField.locked,
      relationship,
      dropdown: exportedField.dropdown,
      category: exportedField.category as any,
      group: exportedField.group,
    });
  }
}
