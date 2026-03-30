import type { FastifySchema } from 'fastify';

export const BulkDeleteSchema: FastifySchema = {
  tags: ['Rows'],
  summary: 'Bulk delete rows permanently',
  description:
    'Permanently deletes multiple rows that are already in the trash. Only rows with trashed=true will be affected.',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['slug'],
    properties: {
      slug: {
        type: 'string',
        description: 'Table slug containing the rows',
      },
    },
    additionalProperties: false,
  },
  body: {
    type: 'object',
    required: ['ids'],
    properties: {
      ids: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        description: 'Array of row IDs to permanently delete',
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Rows permanently deleted',
      type: 'object',
      properties: {
        deleted: {
          type: 'number',
          description: 'Number of rows permanently deleted',
        },
      },
    },
    404: {
      description: 'Table not found',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [404] },
        cause: { type: 'string', enum: ['TABLE_NOT_FOUND'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
    500: {
      description: 'Internal server error',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['BULK_DELETE_ROWS_ERROR'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  },
};
