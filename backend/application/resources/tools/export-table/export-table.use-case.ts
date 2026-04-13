/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import { left, right } from '@application/core/either.core';
import type {
  IField,
  IGroupConfiguration,
} from '@application/core/entity.core';
import { E_FIELD_TYPE } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { RowContractRepository } from '@application/repositories/row/row-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type {
  ExportedField,
  ExportedGroup,
  ExportedStructure,
  ExportResult,
  ExportTableResponse,
  ExportTableUseCasePayload,
} from './export-table.types';

@Service()
export default class ExportTableUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly rowRepository: RowContractRepository,
  ) {}

  async execute(
    payload: ExportTableUseCasePayload,
  ): Promise<ExportTableResponse> {
    try {
      const table = await this.tableRepository.findBySlug(payload.slug);

      if (!table) {
        return left(
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );
      }

      const includeStructure =
        payload.exportType === 'structure' || payload.exportType === 'full';
      const includeData =
        payload.exportType === 'data' || payload.exportType === 'full';

      const result: ExportResult = {
        header: {
          version: '1.0',
          platform: 'lowcodejs',
          tableName: table.name,
          tableSlug: table.slug,
          exportedBy: payload.userName,
          exportedAt: new Date().toISOString(),
          exportType: payload.exportType,
        },
      };

      if (includeStructure) {
        result.structure = this.exportStructure(table);
      }

      if (includeData) {
        result.data = await this.exportData(table);
      }

      return right(result);
    } catch (error) {
      console.error('[tools > export-table][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro ao exportar tabela',
          'EXPORT_TABLE_ERROR',
        ),
      );
    }
  }

  private exportStructure(
    table: import('@application/core/entity.core').ITable,
  ): ExportedStructure {
    const nonNativeFields = table.fields.filter((f) => !f.native);

    const fieldSlugMap = new Map<string, string>();
    for (const field of table.fields) {
      fieldSlugMap.set(field._id, field.slug);
    }

    const exportedFields = nonNativeFields
      .filter((f) => !f.group)
      .map((f) => this.exportField(f));

    const exportedGroups: ExportedGroup[] = (table.groups || []).map(
      (group) => ({
        slug: group.slug,
        name: group.name,
        fields: (group.fields || [])
          .filter((f) => !f.native)
          .map((f) => this.exportField(f)),
      }),
    );

    const fieldOrderList = (table.fieldOrderList || [])
      .map((id) => fieldSlugMap.get(id))
      .filter(Boolean) as string[];

    const fieldOrderForm = (table.fieldOrderForm || [])
      .map((id) => fieldSlugMap.get(id))
      .filter(Boolean) as string[];

    const fieldOrderFilter = (table.fieldOrderFilter || [])
      .map((id) => fieldSlugMap.get(id))
      .filter(Boolean) as string[];

    const fieldOrderDetail = (table.fieldOrderDetail || [])
      .map((id) => fieldSlugMap.get(id))
      .filter(Boolean) as string[];

    return {
      name: table.name,
      slug: table.slug,
      description: table.description,
      style: table.style,
      viewTable: table.viewTable,
      updateTable: table.updateTable,
      createField: table.createField,
      updateField: table.updateField,
      removeField: table.removeField,
      viewField: table.viewField,
      createRow: table.createRow,
      updateRow: table.updateRow,
      removeRow: table.removeRow,
      viewRow: table.viewRow,
      fields: exportedFields,
      groups: exportedGroups,
      fieldOrderList,
      fieldOrderForm,
      fieldOrderFilter,
      fieldOrderDetail,
      layoutFields: table.layoutFields
        ? this.exportLayoutFields(table.layoutFields, fieldSlugMap)
        : {},
      methods: table.methods || {
        onLoad: { code: null },
        beforeSave: { code: null },
        afterSave: { code: null },
      },
    };
  }

  private exportLayoutFields(
    layoutFields: Record<string, string | null>,
    fieldSlugMap: Map<string, string>,
  ): Record<string, string | null> {
    const result: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(layoutFields)) {
      if (value && fieldSlugMap.has(value)) {
        result[key] = fieldSlugMap.get(value) || null;
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  private exportField(field: IField): ExportedField {
    return {
      name: field.name,
      slug: field.slug,
      type: field.type,
      required: field.required,
      multiple: field.multiple,
      format: field.format,
      showInFilter: field.showInFilter,
      showInForm: field.showInForm,
      showInDetail: field.showInDetail,
      showInList: field.showInList,
      widthInForm: field.widthInForm,
      widthInList: field.widthInList,
      defaultValue: field.defaultValue,
      locked: field.locked,
      relationship: field.relationship
        ? {
            tableSlug: field.relationship.table.slug,
            fieldSlug: field.relationship.field.slug,
            order: field.relationship.order,
          }
        : null,
      dropdown: field.dropdown || [],
      category: field.category || [],
      group: field.group ? { slug: field.group.slug } : null,
    };
  }

  private async exportData(
    table: import('@application/core/entity.core').ITable,
  ): Promise<{ totalRows: number; rows: Record<string, unknown>[] }> {
    const rows = await this.rowRepository.findAllRaw(table);

    const nonNativeFields = table.fields.filter((f) => !f.native);
    const fieldSlugs = new Set(nonNativeFields.map((f) => f.slug));

    // Also include group field slugs
    for (const group of table.groups || []) {
      for (const f of group.fields || []) {
        if (!f.native) fieldSlugs.add(f.slug);
      }
    }

    const exportedRows = rows.map((row) => {
      const exportedRow: Record<string, unknown> = {};

      for (const field of nonNativeFields) {
        const value = row[field.slug];
        if (value === undefined || value === null) continue;

        if (
          field.type === E_FIELD_TYPE.RELATIONSHIP ||
          field.type === E_FIELD_TYPE.FILE ||
          field.type === E_FIELD_TYPE.USER ||
          field.type === E_FIELD_TYPE.EVALUATION ||
          field.type === E_FIELD_TYPE.REACTION ||
          field.type === E_FIELD_TYPE.CREATOR
        ) {
          // Skip reference fields - they contain ObjectIds that won't be valid on import
          continue;
        }

        if (field.type === E_FIELD_TYPE.FIELD_GROUP) {
          // For field groups, export only non-reference subfields
          const group = (table.groups || []).find(
            (g) => g.slug === field.group?.slug,
          );
          if (group && Array.isArray(value)) {
            const exportedGroupRows = value.map((groupRow: any) => {
              const exportedGroupRow: Record<string, unknown> = {};
              for (const gf of group.fields || []) {
                if (gf.native) continue;
                if (
                  gf.type === E_FIELD_TYPE.RELATIONSHIP ||
                  gf.type === E_FIELD_TYPE.FILE ||
                  gf.type === E_FIELD_TYPE.USER ||
                  gf.type === E_FIELD_TYPE.EVALUATION ||
                  gf.type === E_FIELD_TYPE.REACTION
                ) {
                  continue;
                }
                if (groupRow[gf.slug] !== undefined) {
                  exportedGroupRow[gf.slug] = groupRow[gf.slug];
                }
              }
              return exportedGroupRow;
            });
            exportedRow[field.slug] = exportedGroupRows;
          }
          continue;
        }

        exportedRow[field.slug] = value;
      }

      return exportedRow;
    });

    return {
      totalRows: exportedRows.length,
      rows: exportedRows,
    };
  }
}
