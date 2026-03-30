import type { FastifySchema } from 'fastify';

export const BulkTrashSchema: FastifySchema = {
  tags: ['Tables'],
  summary: 'Bulk send tables to trash',
  description:
    'Moves multiple tables to trash by setting trashed=true and trashedAt timestamp.',
  security: [{ cookieAuth: [] }],
  body: {
    type: 'object',
    required: ['ids'],
    properties: {
      ids: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        description: 'Array of table IDs to move to trash',
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Tables moved to trash successfully',
      type: 'object',
      properties: {
        modified: {
          type: 'number',
          description: 'Number of tables moved to trash',
        },
      },
    },
    500: {
      description: 'Internal server error',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['BULK_TRASH_TABLES_ERROR'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  },
};
