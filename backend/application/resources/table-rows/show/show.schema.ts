import type { FastifySchema } from 'fastify';

export const TableRowShowSchema: FastifySchema = {
  tags: ['Rows'],
  summary: 'Get row by ID',
  description:
    'Retrieves a specific row by its ID from a table with all relationships populated. Supports public visibility filtering.',
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
        description: 'Row ID to retrieve',
        examples: ['507f1f77bcf86cd799439011'],
      },
    },
    additionalProperties: false,
  },
  querystring: {
    type: 'object',
    properties: {
      trashed: {
        type: 'string',
        enum: ['true', 'false'],
        default: 'false',
        description: 'Include trashed rows (optional)',
        examples: ['true', 'false'],
      },
      public: {
        type: 'string',
        enum: ['true', 'false'],
        default: 'false',
        description: 'Filter by public visibility only (optional)',
        examples: ['true', 'false'],
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Row retrieved successfully with populated relationships',
      type: 'object',
      properties: {
        _id: { type: 'string', description: 'Row ID' },
        trashed: { type: 'boolean', description: 'Is row in trash' },
        trashedAt: {
          type: 'string',
          format: 'date-time',
          nullable: true,
          description: 'When row was trashed',
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
    400: {
      description:
        'Bad request - Table is not public when requesting public access',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Table is not public'] },
        code: { type: 'number', enum: [400] },
        cause: { type: 'string', enum: ['TABLE_NOT_PUBLIC'] },
      },
      examples: [
        {
          message: 'Table is not public',
          code: 400,
          cause: 'TABLE_NOT_PUBLIC',
        },
      ],
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
        cause: {
          type: 'string',
          enum: ['GET_ROW_TABLE_BY_ID_ERROR'],
        },
      },
    },
  },
};
