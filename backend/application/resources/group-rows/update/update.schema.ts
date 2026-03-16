import type { FastifySchema } from 'fastify';

export const GroupRowUpdateSchema: FastifySchema = {
  tags: ['Group Rows'],
  summary: 'Update item in group',
  description:
    'Updates an existing embedded item within a FIELD_GROUP of a row.',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['slug', 'rowId', 'groupSlug', 'itemId'],
    properties: {
      slug: { type: 'string', description: 'Table slug' },
      rowId: { type: 'string', description: 'Row ID' },
      groupSlug: { type: 'string', description: 'Group slug' },
      itemId: { type: 'string', description: 'Embedded item ID to update' },
    },
    additionalProperties: false,
  },
  body: {
    type: 'object',
    description: 'Dynamic fields matching the group schema',
    additionalProperties: true,
  },
  response: {
    200: {
      description: 'Item updated successfully',
      type: 'object',
      additionalProperties: true,
    },
    400: {
      description: 'Validation error',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [400] },
        cause: { type: 'string', enum: ['INVALID_PAYLOAD_FORMAT'] },
        errors: { type: 'object', additionalProperties: { type: 'string' } },
      },
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
        cause: { type: 'string', enum: ['UPDATE_GROUP_ROW_ERROR'] },
      },
    },
  },
};
