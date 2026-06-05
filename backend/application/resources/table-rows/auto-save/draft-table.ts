import type {
  IEmbeddedSchema,
  ISchema,
  ITable,
  ITableSchema,
} from '@application/core/entity.core';

/**
 * Constroi uma copia da tabela com TODOS os campos marcados como
 * `required: false`, usada exclusivamente pelo auto-save para persistir
 * rascunhos parciais sem disparar os validators de obrigatoriedade do Mongoose.
 *
 * O core (`schema-builder`/`model-builder`) permanece intocado: a tabela
 * original continua gerando o schema com `required` real para create/update
 * normais. Como `buildTable` reconstroi o model a cada chamada, este schema
 * relaxado vive apenas durante a request do auto-save.
 */
function isEmbeddedSchemaArray(
  value: ISchema | ISchema[] | IEmbeddedSchema[],
): value is IEmbeddedSchema[] {
  return Array.isArray(value) && value[0]?.type === 'Embedded';
}

function relaxTableSchema(schema: ITableSchema): void {
  for (const value of Object.values(schema)) {
    if (isEmbeddedSchemaArray(value)) {
      for (const entry of value) {
        entry.required = false;
        relaxTableSchema(entry.schema);
      }
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        entry.required = false;
      }
      continue;
    }

    value.required = false;
  }
}

export function toDraftTable(table: ITable): ITable {
  const draft = structuredClone(table);

  if (draft._schema) {
    relaxTableSchema(draft._schema);
  }

  if (Array.isArray(draft.groups)) {
    for (const group of draft.groups) {
      if (Array.isArray(group.fields)) {
        for (const field of group.fields) {
          field.required = false;
        }
      }

      if (group._schema) {
        relaxTableSchema(group._schema);
      }
    }
  }

  return draft;
}
