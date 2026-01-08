import type { FastifySchema } from 'fastify';

export const TableRowReactionSchema: FastifySchema = {
  tags: ['Rows'],
  summary: 'Add reaction to row',
  description:
    'Adds a reaction (like/unlike) to a specific field in a row. Creates or updates reaction record linked to user and field.',
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
        description: 'Row ID to add reaction to',
        examples: ['507f1f77bcf86cd799439011'],
      },
    },
    additionalProperties: false,
  },
  body: {
    type: 'object',
    required: ['type', 'field'],
    properties: {
      type: {
        type: 'string',
        enum: ['LIKE', 'UNLIKE'],
        description: 'Type of reaction',
      },
      field: {
        type: 'string',
        description:
          'Field slug that accepts reactions (must be REACTION type field)',
        examples: ['rating', 'feedback', 'approval'],
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description:
        'Reaction added successfully - Returns the complete updated row',
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
      description: 'Bad request - Invalid field type or validation error',
      type: 'object',
      properties: {
        message: {
          type: 'string',
          enum: [
            'Field is not a reaction field',
            'Invalid reaction type',
            'User not found',
          ],
        },
        code: { type: 'number', enum: [400] },
        cause: {
          type: 'string',
          enum: ['INVALID_FIELD_TYPE', 'INVALID_PARAMETERS'],
        },
      },
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
      description: 'Not found - ITable, row, or field does not exist',
      type: 'object',
      properties: {
        message: {
          type: 'string',
          enum: ['Table not found', 'Row not found', 'Field not found'],
        },
        code: { type: 'number', enum: [404] },
        cause: {
          type: 'string',
          enum: ['TABLE_NOT_FOUND', 'ROW_NOT_FOUND', 'FIELD_NOT_FOUND'],
        },
      },
    },
    500: {
      description: 'Internal server error - Database or server issues',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Internal server error'] },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['REACTION_ROW_ERROR'] },
      },
    },
  },
};
