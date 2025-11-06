import type { FastifySchema } from 'fastify';

export const TableRowPaginatedSchema: FastifySchema = {
  tags: ['Rows'],
  summary: 'List rows paginated',
  description:
    'Get a paginated list of rows in a table with optional search and dynamic filtering',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['slug'],
    properties: {
      slug: {
        type: 'string',
        description: 'Slug of the table to list rows from',
        examples: ['users', 'products', 'blog-posts'],
      },
    },
    additionalProperties: false,
  },
  querystring: {
    type: 'object',
    properties: {
      page: {
        type: 'number',
        minimum: 1,
        default: 1,
        description: 'Page number (starts from 1)',
        examples: [1, 2, 5],
      },
      perPage: {
        type: 'number',
        minimum: 1,
        maximum: 100,
        default: 50,
        description: 'Number of items per page (max 100)',
        examples: [10, 25, 50, 100],
      },
      search: {
        type: 'string',
        minLength: 1,
        description: 'Search term for filtering rows (optional)',
        examples: ['john', 'product', 'category'],
      },
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
    additionalProperties: true,
  },
  response: {
    200: {
      description: 'Paginated list of rows in the table',
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            description: 'Row data structure varies based on table fields',
            additionalProperties: true,
          },
        },
        meta: {
          type: 'object',
          properties: {
            total: {
              type: 'number',
              description: 'Total number of rows',
            },
            perPage: {
              type: 'number',
              description: 'Number of items per page',
            },
            page: { type: 'number', description: 'Current page number' },
            lastPage: { type: 'number', description: 'Last page number' },
            firstPage: {
              type: 'number',
              description: 'First page number',
            },
          },
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
      examples: [
        {
          message: 'Unauthorized',
          code: 401,
          cause: 'AUTHENTICATION_REQUIRED',
        },
      ],
    },
    404: {
      description: 'Table not found',
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
        cause: {
          type: 'string',
          enum: ['LIST_ROW_TABLE_PAGINATED_ERROR'],
        },
      },
    },
  },
};
