import type { FastifySchema } from 'fastify';

export const TableRowDeleteSchema: FastifySchema = {
  tags: ['Rows'],
  summary: 'Delete row',
  description:
    'Permanently deletes a row from a table. This action cannot be undone and removes all associated data.',
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
        description: 'Row ID to delete permanently',
        examples: ['507f1f77bcf86cd799439011'],
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Row deleted successfully',
      type: 'object',
      properties: {},
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
      description: 'Not found - Table or row does not exist',
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
        cause: { type: 'string', enum: ['DELETE_ROW_ERROR'] },
      },
    },
  },
};
