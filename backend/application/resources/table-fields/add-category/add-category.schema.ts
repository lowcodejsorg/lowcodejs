import type { FastifySchema } from 'fastify';

export const TableFieldAddCategorySchema: FastifySchema = {
  tags: ['Fields'],
  summary: 'Add category option',
  description:
    'Adds a new category option to a CATEGORY field, either at the root or as a child of an existing category.',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['slug', '_id'],
    properties: {
      slug: {
        type: 'string',
        description: 'Table slug containing the field',
        examples: ['users', 'products', 'blog-posts'],
      },
      _id: {
        type: 'string',
        description: 'Field ID to add the category option',
        examples: ['507f1f77bcf86cd799439011'],
      },
    },
    additionalProperties: false,
  },
  body: {
    type: 'object',
    required: ['label'],
    properties: {
      label: {
        type: 'string',
        description: 'Category label',
        examples: ['Financeiro', 'Clientes'],
      },
      parentId: {
        type: 'string',
        nullable: true,
        description: 'Parent category ID (null or omitted for root)',
        examples: ['123456', null],
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Category option created',
      type: 'object',
      properties: {
        node: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            parentId: { type: 'string', nullable: true },
          },
        },
        field: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            type: { type: 'string' },
            configuration: { type: 'object' },
          },
        },
      },
    },
    400: {
      description: 'Bad request - Validation error',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [400] },
        cause: { type: 'string' },
      },
    },
    401: {
      description: 'Unauthorized - Authentication required',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [401] },
        cause: { type: 'string', enum: ['AUTHENTICATION_REQUIRED'] },
      },
    },
    403: {
      description: 'Forbidden - Access denied',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [403] },
        cause: { type: 'string', enum: ['ACCESS_DENIED'] },
      },
    },
    404: {
      description: 'Not found - Table, field, or parent category not found',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [404] },
        cause: { type: 'string' },
      },
    },
    500: {
      description: 'Internal server error',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['ADD_CATEGORY_OPTION_ERROR'] },
      },
    },
  },
};
