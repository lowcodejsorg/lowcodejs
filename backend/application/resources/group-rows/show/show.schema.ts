import type { FastifySchema } from 'fastify';

export const GroupRowShowSchema: FastifySchema = {
  tags: ['Group Rows'],
  summary: 'Get item in group',
  description: 'Retrieves a specific embedded item by ID from a FIELD_GROUP.',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['slug', 'rowId', 'groupSlug', 'itemId'],
    properties: {
      slug: { type: 'string', description: 'Table slug' },
      rowId: { type: 'string', description: 'Row ID' },
      groupSlug: { type: 'string', description: 'Group slug' },
      itemId: { type: 'string', description: 'Embedded item ID' },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Item retrieved successfully',
      type: 'object',
      additionalProperties: true,
    },
    404: {
      description: 'Table, row, group, or item not found',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [404] },
        cause: {
          type: 'string',
          enum: [
            'TABLE_NOT_FOUND',
            'ROW_NOT_FOUND',
            'GROUP_NOT_FOUND',
            'ITEM_NOT_FOUND',
          ],
        },
      },
    },
    500: {
      description: 'Internal server error',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['GET_GROUP_ROW_ERROR'] },
      },
    },
  },
};
