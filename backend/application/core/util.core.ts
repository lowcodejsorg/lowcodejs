/**
 * Facade de re-export para backward compatibility.
 *
 * A logica real foi decomposta em modulos focados:
 * - builders/schema-builder.ts  (buildSchema, FieldTypeMapper, PASSWORD_REGEX)
 * - builders/model-builder.ts   (buildTable, findReverseRelationships)
 * - builders/populate-builder.ts (buildPopulate, getRelationship)
 * - builders/query-builder.ts   (buildQuery, buildOrder, normalize)
 *
 * Novos imports devem usar diretamente: import { buildTable } from '@application/core/builders'
 */
export {
  buildOrder,
  buildPopulate,
  buildQuery,
  buildSchema,
  buildTable,
  FieldTypeMapper,
  getRelationship,
  normalize,
  PASSWORD_REGEX,
  transformRowContext,
  type QueryOrder,
} from './builders';
