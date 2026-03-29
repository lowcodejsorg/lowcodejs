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
  PASSWORD_REGEX,
  FieldTypeMapper,
  buildSchema,
  findReverseRelationships,
  buildTable,
  getRelationship,
  buildPopulate,
  normalize,
  buildQuery,
  buildOrder,
  type QueryOrder,
  transformRowContext,
} from './builders';
