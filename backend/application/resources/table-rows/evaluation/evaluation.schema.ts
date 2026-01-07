import type { FastifySchema } from 'fastify';

export const TableRowEvaluationSchema: FastifySchema = {
  tags: ['Rows'],
  summary: 'Add evaluation to row',
  description:
    'Adds a numeric evaluation (rating) to a specific field in a row. Creates or updates evaluation record linked to user and field.',
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
        description: 'Row ID to add evaluation to',
        examples: ['507f1f77bcf86cd799439011'],
      },
    },
    additionalProperties: false,
  },
  body: {
    type: 'object',
    required: ['value', 'field'],
    properties: {
      value: {
        type: 'number',
        description: 'Numeric evaluation value (rating)',
        examples: [1, 2, 3, 4, 5],
      },
      field: {
        type: 'string',
        description:
          'Field slug that accepts evaluations (must be EVALUATION type field)',
        examples: ['rating', 'score', 'quality'],
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description:
        'Evaluation added successfully - Returns the complete updated row',
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
            'Field is not an evaluation field',
            'Invalid evaluation value',
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
        cause: { type: 'string', enum: ['EVALUATION_ROW_ERROR'] },
      },
    },
  },
};
