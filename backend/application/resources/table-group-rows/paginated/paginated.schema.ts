import type { FastifySchema } from 'fastify';

export const GroupRowPaginatedSchema: FastifySchema = {
  tags: ['Group Rows'],
  summary: 'List items in group paginated',
  description:
    'Returns a paginated list of embedded items within a FIELD_GROUP of a row.',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['slug', 'rowId', 'groupSlug'],
    properties: {
      slug: { type: 'string', description: 'Table slug' },
      rowId: { type: 'string', description: 'Row ID' },
      groupSlug: { type: 'string', description: 'Group slug' },
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
        examples: [10, 20, 30, 40, 50],
      },
      search: {
        type: 'string',
        minLength: 1,
        description: 'Search term for filtering items (optional)',
      },
    },
    additionalProperties: true,
  },
  response: {
    200: {
      description: 'Paginated list of items in the group',
      type: 'object',
      additionalProperties: true,
    },
    401: {
      description: 'Unauthorized',
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
    404: {
      description: 'Table, row or group not found',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [404] },
        cause: {
          type: 'string',
          enum: ['TABLE_NOT_FOUND', 'ROW_NOT_FOUND', 'GROUP_NOT_FOUND'],
        },
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
        cause: { type: 'string', enum: ['LIST_GROUP_ROWS_PAGINATED_ERROR'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  },
};
