import type { FastifySchema } from 'fastify';

export const ImportTableSchema: FastifySchema = {
  tags: ['Tools'],
  summary: 'Import table',
  description: 'Imports a table from a previously exported JSON',
  security: [{ cookieAuth: [] }],
  body: {
    type: 'object',
    required: ['fileContent'],
    properties: {
      name: {
        type: ['string', 'null'],
        description:
          'Optional override for the first table name (only applied to single-table imports).',
      },
      tables: {
        type: 'array',
        description:
          'Per-table rename map: original slug → new name. The final slug is derived from the name. Tables not listed keep their original name/slug. Relationships are preserved.',
        items: {
          type: 'object',
          required: ['slug', 'name'],
          properties: {
            slug: { type: 'string' },
            name: { type: 'string' },
          },
        },
      },
      menus: {
        type: 'array',
        description:
          'Per-menu rename map: original slug → new name. Applies only to conflicting leaf menu items — existing parent menus are reused, never renamed.',
        items: {
          type: 'object',
          required: ['slug', 'name'],
          properties: {
            slug: { type: 'string' },
            name: { type: 'string' },
          },
        },
      },
      fileContent: {
        type: 'object',
        description:
          'The exported JSON content (v1 single-table or v2 multi-table)',
        additionalProperties: true,
      },
    },
    additionalProperties: false,
  },
  response: {
    201: {
      description: 'Table imported successfully',
      type: 'object',
      properties: {
        tableId: { type: 'string' },
        slug: { type: 'string' },
        importedFields: { type: 'number' },
        importedRows: { type: 'number' },
        importedMenus: { type: 'number' },
        tables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tableId: { type: 'string' },
              slug: { type: 'string' },
              name: { type: 'string' },
            },
          },
        },
      },
    },
    400: {
      description: 'Bad request',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number' },
        cause: { type: 'string' },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  },
};
