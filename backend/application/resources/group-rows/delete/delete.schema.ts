import type { FastifySchema } from 'fastify';

export const GroupRowDeleteSchema: FastifySchema = {
  tags: ['Group Rows'],
  summary: 'Delete item from group',
  description:
    'Removes an embedded item from a FIELD_GROUP array within a row.',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['slug', 'rowId', 'groupSlug', 'itemId'],
    properties: {
      slug: { type: 'string', description: 'Table slug' },
      rowId: { type: 'string', description: 'Row ID' },
      groupSlug: { type: 'string', description: 'Group slug' },
      itemId: { type: 'string', description: 'Embedded item ID to delete' },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Item deleted successfully',
      type: 'null',
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
        cause: { type: 'string', enum: ['DELETE_GROUP_ROW_ERROR'] },
      },
    },
  },
};
