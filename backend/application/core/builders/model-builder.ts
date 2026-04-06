import mongoose from 'mongoose';

import { Field } from '@application/model/field.model';
import { Table } from '@application/model/table.model';

import type {
  IField,
  IGroupConfiguration,
  IRow,
  Optional,
} from '../entity.core';
import { E_FIELD_TYPE } from '../entity.core';
import { executeScript } from '../table/handler';
import type { FieldDefinition } from '../table/types';

interface Entity
  extends Omit<IRow, '_id'>, mongoose.Document<Omit<IRow, '_id'>> {
  _id: mongoose.Types.ObjectId;
}

interface IReverseRelationship {
  sourceTableSlug: string;
  fieldSlug: string;
  virtualName: string;
}

/**
 * Maps IField array to FieldDefinition array for sandbox execution
 * Includes all necessary data for each field type
 */
function mapFieldsForSandbox(fields: IField[]): FieldDefinition[] {
  return fields.map((f) => ({
    slug: f.slug,
    type: f.type,
    name: f.name,
    multiple: f.multiple ?? false,
    ...(f.relationship && { relationship: f.relationship }),
    ...(f.group && { group: f.group }),
    ...(f.dropdown?.length && { dropdown: f.dropdown }),
    ...(f.category?.length && { category: f.category }),
  }));
}

export async function findReverseRelationships(
  tableSlug: string,
): Promise<IReverseRelationship[]> {
  const reverseFields = await Field.find({
    type: E_FIELD_TYPE.RELATIONSHIP,
    'relationship.table.slug': tableSlug,
    trashed: { $ne: true },
  }).select('_id slug');

  if (reverseFields.length === 0) return [];

  const fieldIds = reverseFields.flatMap((f) => f._id);
  const tables = await Table.find({
    fields: { $in: fieldIds },
    trashed: { $ne: true },
  }).select('slug fields');

  const result: IReverseRelationship[] = [];

  for (const table of tables) {
    const matchingFields = reverseFields.filter((rf) =>
      table.fields.some((fId: any) => fId.toString() === rf._id.toString()),
    );

    for (const field of matchingFields) {
      let virtualName = table.slug;

      if (matchingFields.length > 1) {
        virtualName = table.slug.concat('-').concat(field.slug);
      }

      result.push({
        sourceTableSlug: table.slug,
        fieldSlug: field.slug,
        virtualName,
      });
    }
  }

  return result;
}

export async function buildTable(
  table: Optional<
    import('@application/core/entity.core').ITable,
    '_id' | 'createdAt' | 'updatedAt' | 'trashed' | 'trashedAt'
  >,
): Promise<mongoose.Model<Entity>> {
  if (!table?.slug) throw new Error('Table slug not found');

  if (!table?._schema) throw new Error('Table schema not found');

  const schemaDefinition: Record<string, any> = {};

  for (const [key, value] of Object.entries(table._schema)) {
    if (Array.isArray(value) && value[0]?.type === 'Embedded') {
      let embeddedSchema = value[0].schema || {};

      if (
        Object.keys(embeddedSchema).length === 0 &&
        Array.isArray(table.groups)
      ) {
        const group = table.groups.find(
          (g: IGroupConfiguration) => g.slug === key,
        );
        if (group?._schema) {
          embeddedSchema = group._schema;
        }
      }

      const subSchemaDefinition: Record<string, any> = {};

      for (const [subKey, subValue] of Object.entries(embeddedSchema)) {
        subSchemaDefinition[subKey] = subValue;
      }

      const subSchema = new mongoose.Schema(subSchemaDefinition, {
        _id: true,
        timestamps: true,
        id: false,
      });
      schemaDefinition[key] = [subSchema];
    } else {
      schemaDefinition[key] = value;
    }
  }

  delete schemaDefinition['_id'];
  delete schemaDefinition['createdAt'];

  const schema = new mongoose.Schema(schemaDefinition, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
  });

  // === VIRTUAL POPULATE (Relacionamentos Reversos) ===
  const reverseRelationships = await findReverseRelationships(table.slug);
  for (const rel of reverseRelationships) {
    schema.virtual(rel.virtualName, {
      ref: rel.sourceTableSlug,
      localField: '_id',
      foreignField: rel.fieldSlug,
    });
  }

  // ===== ADICIONA OS MIDDLEWARES AQUI =====

  if (table?.methods?.beforeSave?.code) {
    schema.pre('save', async function (next) {
      const result = await executeScript({
        code: table?.methods?.beforeSave?.code!,
        doc: this,
        tableSlug: table.slug,
        fields: mapFieldsForSandbox(table.fields as IField[]),
        context: {
          userAction: this.isNew ? 'novo_registro' : 'editar_registro',
          executionMoment: 'antes_salvar',
          userId: this.creator?.toString(),
          isNew: this.isNew,
          tableInfo: {
            _id: table._id?.toString() ?? '',
            name: table.name,
            slug: table.slug,
          },
        },
      });

      if (!result.success) {
        throw new Error(`Erro no beforeSave: ${result.error?.message}`);
      }

      next();
    });
  }

  if (table?.methods?.afterSave?.code) {
    schema.post('save', async function (doc, next) {
      const result = await executeScript({
        code: table?.methods?.afterSave?.code!,
        doc,
        tableSlug: table.slug,
        fields: mapFieldsForSandbox(table.fields as IField[]),
        context: {
          userAction: doc.isNew ? 'novo_registro' : 'editar_registro',
          executionMoment: 'depois_salvar',
          userId: doc.creator?.toString(),
          isNew: doc.isNew,
          tableInfo: {
            _id: table._id?.toString() ?? '',
            name: table.name,
            slug: table.slug,
          },
        },
      });

      if (!result.success) {
        console.error(
          'Erro no afterSave (nao bloqueante):',
          result.error?.message,
        );
      }

      next();
    });
  }

  delete mongoose.models[table.slug];
  const model = mongoose.model<Entity>(
    table.slug,
    schema,
    table.slug,
  ) as mongoose.Model<Entity>;

  await model?.createCollection();

  return model;
}
