/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import mongoose from 'mongoose';

import type {
  IField,
  IGroupConfiguration,
  IRow,
  Optional,
} from '@application/core/entity.core';
import { executeScript } from '@application/core/table/handler';
import type { FieldDefinition } from '@application/core/table/types';
import { getDataConnection } from '@config/database.config';

import { ModelBuilderContractService } from './model-builder-contract.service';
import { SchemaBuilderContractService } from './schema-builder-contract.service';

export interface Entity extends Omit<IRow, '_id'>, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

@Service()
export default class MongooseModelBuilder implements ModelBuilderContractService {
  constructor(private readonly schema: SchemaBuilderContractService) {}

  /**
   * Maps IField array to FieldDefinition array for sandbox execution
   * Includes all necessary data for each field type
   */
  private static mapFieldsForSandbox(fields: IField[]): FieldDefinition[] {
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

  async build(
    table: Optional<
      import('@application/core/entity.core').ITable,
      '_id' | 'createdAt' | 'updatedAt' | 'trashed' | 'trashedAt'
    >,
  ): Promise<mongoose.Model<Entity>> {
    if (!table?.slug) throw new Error('Table slug not found');

    if (!table?._schema) throw new Error('Table schema not found');

    const conn = getDataConnection();

    const schemaDefinition: mongoose.SchemaDefinition = {};

    for (const [key, value] of Object.entries(table._schema)) {
      if (Array.isArray(value) && value[0]?.type === 'Embedded') {
        let embeddedSchema = value[0].schema || {};

        const group = Array.isArray(table.groups)
          ? table.groups.find((g: IGroupConfiguration) => g.slug === key)
          : undefined;

        if (group && Array.isArray(group.fields) && group.fields.length > 0) {
          embeddedSchema = this.schema.build(group.fields as IField[]);
        } else if (Object.keys(embeddedSchema).length === 0 && group?._schema) {
          embeddedSchema = group._schema;
        }

        const subSchemaDefinition: mongoose.SchemaDefinition = {};

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

    // Slug nativo do registro (link de compartilhamento amigavel). Igual a
    // trashed/createdAt: propriedade-base injetada em toda build, sem migracao.
    schemaDefinition['sharedRowSlug'] = {
      type: String,
      default: null,
      index: true,
    };

    // Auditoria nativa: quem fez a ultima alteracao (UPDATED_BY). Propriedade-base
    // injetada em toda build (como sharedRowSlug) — garante o path mesmo em
    // tabelas criadas antes do recurso, sem migracao de _schema. Sem isso o
    // Mongoose (strict) descartaria o updatedBy no $set de tabelas antigas.
    // updatedAt ja e gerado automaticamente pelo timestamps abaixo.
    schemaDefinition['updatedBy'] = {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    };

    const schema = new mongoose.Schema(schemaDefinition, {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
      id: false,
    });

    // ===== ADICIONA OS MIDDLEWARES AQUI =====

    if (table?.methods?.beforeSave?.code) {
      schema.pre('save', async function (next): Promise<void> {
        const result = await executeScript({
          code: table?.methods?.beforeSave?.code!,
          doc: this,
          tableSlug: table.slug,
          fields: MongooseModelBuilder.mapFieldsForSandbox(table.fields ?? []),
          context: {
            userAction: this.isNew ? 'novo_registro' : 'editar_registro',
            executionMoment: 'antes_salvar',
            userId: this.creator?.toString(),
            isNew: this.isNew,
            viaSaveHook: true,
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
      schema.post('save', async function (doc, next): Promise<void> {
        const result = await executeScript({
          code: table?.methods?.afterSave?.code!,
          doc,
          tableSlug: table.slug,
          fields: MongooseModelBuilder.mapFieldsForSandbox(table.fields ?? []),
          context: {
            userAction: doc.isNew ? 'novo_registro' : 'editar_registro',
            executionMoment: 'depois_salvar',
            userId: doc.creator?.toString(),
            isNew: doc.isNew,
            viaSaveHook: true,
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

    const modelName = table._id?.toString();
    if (!modelName) throw new Error('Table _id not found');
    if (conn.models[modelName]) {
      conn.deleteModel(modelName);
    }
    const model = conn.model<Entity>(modelName, schema, table.slug);

    await model.createCollection();

    return model;
  }
}
