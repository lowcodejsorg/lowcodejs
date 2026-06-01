import type { FastifySchema } from 'fastify';

export const TableFieldDeleteCategorySchema: FastifySchema = {
  tags: ['Fields'],
  summary: 'Delete category option',
  description:
    'Removes a category option (and its descendants) from a CATEGORY field tree and unlinks it from all rows that reference it.',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['slug', '_id', 'categoryId'],
    properties: {
      slug: {
        type: 'string',
        description: 'Table slug containing the field',
        examples: ['users', 'products', 'blog-posts'],
      },
      _id: {
        type: 'string',
        description: 'Field ID containing the category',
        examples: ['507f1f77bcf86cd799439011'],
      },
      categoryId: {
        type: 'string',
        description: 'Category node ID to remove',
        examples: ['123456'],
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Category option removed',
      type: 'object',
      properties: {
        field: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            type: { type: 'string' },
            required: { type: 'boolean' },
            multiple: { type: 'boolean' },
            format: { type: 'string', nullable: true },
            showInList: { type: 'boolean' },
            showInForm: { type: 'boolean' },
            showInDetail: { type: 'boolean' },
            showInFilter: { type: 'boolean' },
            widthInForm: { type: 'number', nullable: true },
            widthInList: { type: 'number', nullable: true },
            widthInDetail: { type: 'number', nullable: true },
            locked: { type: 'boolean' },
            native: { type: 'boolean' },
            defaultValue: {
              anyOf: [
                { type: 'string' },
                { type: 'array', items: { type: 'string' } },
                { type: 'null' },
              ],
            },
            relationship: { type: 'object', nullable: true },
            dropdown: { type: 'array', nullable: true },
            category: { type: 'array', nullable: true },
            group: { type: 'object', nullable: true },
          },
        },
        removedIds: {
          type: 'array',
          items: { type: 'string' },
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
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
    401: {
      description: 'Unauthorized - Authentication required',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [401] },
        cause: { type: 'string', enum: ['AUTHENTICATION_REQUIRED'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
    403: {
      description: 'Forbidden - Access denied',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [403] },
        cause: { type: 'string', enum: ['ACCESS_DENIED'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
    404: {
      description: 'Not found - Table, field, or category not found',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [404] },
        cause: { type: 'string' },
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
        cause: { type: 'string', enum: ['DELETE_CATEGORY_OPTION_ERROR'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  },
};
