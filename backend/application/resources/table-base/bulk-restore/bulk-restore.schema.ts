import type { FastifySchema } from 'fastify';

export const BulkRestoreSchema: FastifySchema = {
  tags: ['Tables'],
  summary: 'Bulk restore tables from trash',
  description:
    'Restores multiple tables from trash by setting trashed=false and clearing trashedAt.',
  security: [{ cookieAuth: [] }],
  body: {
    type: 'object',
    required: ['ids'],
    properties: {
      ids: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        description: 'Array of table IDs to restore from trash',
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Tables restored from trash successfully',
      type: 'object',
      properties: {
        modified: {
          type: 'number',
          description: 'Number of tables restored from trash',
        },
      },
    },
    500: {
      description: 'Internal server error',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['BULK_RESTORE_TABLES_ERROR'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  },
};
