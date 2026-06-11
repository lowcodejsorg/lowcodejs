import type { FastifySchema } from 'fastify';

export const GroupRowListSchema: FastifySchema = {
  tags: ['Group Rows'],
  summary: 'List items in group',
  description: 'Lists all embedded items within a FIELD_GROUP of a row.',
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
  response: {
    200: {
      description: 'List of items in the group',
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
      },
    },
    404: {
      description: 'Table, row, or group not found',
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
        cause: { type: 'string', enum: ['LIST_GROUP_ROWS_ERROR'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  },
};
