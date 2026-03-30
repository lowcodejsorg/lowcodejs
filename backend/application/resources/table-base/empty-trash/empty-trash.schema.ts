import type { FastifySchema } from 'fastify';

export const EmptyTrashSchema: FastifySchema = {
  tags: ['Tables'],
  summary: 'Empty trash - delete all trashed tables',
  description:
    'Permanently deletes all tables in the trash, including their fields and dynamic collections.',
  security: [{ cookieAuth: [] }],
  response: {
    200: {
      description: 'Trash emptied successfully',
      type: 'object',
      properties: {
        deleted: {
          type: 'number',
          description: 'Number of tables permanently deleted',
        },
      },
    },
    500: {
      description: 'Internal server error',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['EMPTY_TRASH_TABLES_ERROR'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  },
};
