import type { FastifySchema } from 'fastify';

export const EmptyTrashSchema: FastifySchema = {
  tags: ['Rows'],
  summary: 'Empty trash - delete all trashed rows',
  description: 'Permanently deletes all rows in the trash for a given table.',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['slug'],
    properties: {
      slug: {
        type: 'string',
        description: 'Table slug',
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Trash emptied successfully',
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
        cause: { type: 'string', enum: ['EMPTY_TRASH_ROWS_ERROR'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  },
};
