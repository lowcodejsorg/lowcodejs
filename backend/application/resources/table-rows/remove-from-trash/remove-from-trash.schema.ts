import type { FastifySchema } from 'fastify';

export const TableRowRemoveFromTrashSchema: FastifySchema = {
  tags: ['Rows'],
  summary: 'Remove row from trash',
  description:
    'Restores a row from trash by setting trashed=false and clearing trashedAt timestamp. Makes the row active again.',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['slug', '_id'],
    properties: {
      slug: {
        type: 'string',
        description: 'Table slug containing the row',
        examples: ['users', 'products', 'blog-posts'],
      },
      _id: {
        type: 'string',
        description: 'Row ID to restore from trash',
        examples: ['507f1f77bcf86cd799439011'],
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Row restored from trash successfully',
      type: 'object',
      properties: {
        _id: { type: 'string', description: 'Row ID' },
        trashed: {
          type: 'boolean',
          enum: [false],
          description: 'Row is no longer in trash',
        },
        trashedAt: {
          type: 'string',
          nullable: true,
          description: 'Timestamp when moved to trash (now null)',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: 'Creation timestamp',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          description: 'Last update timestamp',
        },
      },
      additionalProperties: true,
    },
    401: {
      description: 'Unauthorized - Authentication required',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Unauthorized'] },
        code: { type: 'number', enum: [401] },
        cause: { type: 'string', enum: ['AUTHENTICATION_REQUIRED'] },
      },
    },
    404: {
      description: 'Not found - Table or row does not exist or is not in trash',
      type: 'object',
      properties: {
        message: {
          type: 'string',
          enum: ['Table not found', 'Row not found'],
        },
        code: { type: 'number', enum: [404] },
        cause: {
          type: 'string',
          enum: ['TABLE_NOT_FOUND', 'ROW_NOT_FOUND'],
        },
      },
      examples: [
        {
          message: 'Row not found',
          code: 404,
          cause: 'ROW_NOT_FOUND',
        },
      ],
    },
    500: {
      description: 'Internal server error - Database or server issues',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Internal server error'] },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['REMOVE_ROW_FROM_TRASH_ERROR'] },
      },
    },
  },
};
