import type { FastifySchema } from 'fastify';

export const TableRowCreateSchema: FastifySchema = {
  tags: ['Rows'],
  summary: 'Create row',
  description:
    'Creates a new row in a table with dynamic schema based on table fields. Handles FIELD_GROUP types by creating/updating nested table entries. Authentication is required only if table collaboration is set to "restricted". Tables with "open" collaboration allow public access.',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['slug'],
    properties: {
      slug: {
        type: 'string',
        description: 'Table slug where the row will be created',
        examples: ['users', 'products', 'blog-posts'],
      },
    },
    additionalProperties: false,
  },
  body: {
    type: 'object',
    description:
      'Dynamic row data based on table fields. Keys correspond to field slugs, values depend on field types.',
    additionalProperties: true,
    examples: [
      {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        active: true,
        tags: ['developer', 'javascript'],
        profile_picture: ['507f1f77bcf86cd799439011'],
        related_products: [
          '507f1f77bcf86cd799439012',
          '507f1f77bcf86cd799439013',
        ],
      },
    ],
    properties: {
      field_slug_example: {
        oneOf: [
          {
            type: 'string',
            description: 'For TEXT_SHORT, TEXT_LONG, DROPDOWN fields',
          },
          { type: 'number', description: 'For number-based fields' },
          { type: 'boolean', description: 'For boolean fields' },
          {
            type: 'array',
            items: { type: 'string' },
            description: 'For multiple values or FILE, RELATIONSHIP fields',
          },
          {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                _id: {
                  type: 'string',
                  description: 'Optional ID for FIELD_GROUP items',
                },
              },
              additionalProperties: true,
            },
            description: 'For FIELD_GROUP fields - array of nested objects',
          },
          { type: 'object', description: 'For complex field types' },
        ],
      },
    },
  },
  response: {
    201: {
      description: 'Row created successfully with populated relationships',
      type: 'object',
      properties: {
        _id: { type: 'string', description: 'Row ID' },
        trashed: {
          type: 'boolean',
          enum: [false],
          description: 'Row is not trashed',
        },
        trashedAt: {
          type: 'string',
          nullable: true,
          description: 'When row was trashed (null for new rows)',
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
        'Bad request - Validation error or field requirements not met',
      type: 'object',
      properties: {
        message: {
          type: 'string',
          enum: [
            'Validation failed',
            'Required field missing',
            'Invalid field type',
          ],
        },
        code: { type: 'number', enum: [400] },
        cause: {
          type: 'string',
          enum: ['INVALID_PARAMETERS', 'VALIDATION_ERROR'],
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
      description: 'Not found - Table with specified slug does not exist',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Table not found'] },
        code: { type: 'number', enum: [404] },
        cause: { type: 'string', enum: ['TABLE_NOT_FOUND'] },
      },
      examples: [
        {
          message: 'Table not found',
          code: 404,
          cause: 'TABLE_NOT_FOUND',
        },
      ],
    },
    500: {
      description: 'Internal server error - Database or server issues',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Internal server error'] },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['CREATE_ROW_ERROR'] },
      },
    },
  },
};
