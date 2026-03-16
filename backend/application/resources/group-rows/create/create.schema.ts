import type { FastifySchema } from 'fastify';

export const GroupRowCreateSchema: FastifySchema = {
  tags: ['Group Rows'],
  summary: 'Add item to group',
  description: 'Adds a new embedded item to a FIELD_GROUP array within a row.',
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
  body: {
    type: 'object',
    description: 'Dynamic fields matching the group schema',
    additionalProperties: true,
  },
  response: {
    201: {
      description: 'Item added to group successfully',
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
      description: 'Table, row, or group not found',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [404] },
        cause: {
          type: 'string',
          enum: ['TABLE_NOT_FOUND', 'ROW_NOT_FOUND', 'GROUP_NOT_FOUND'],
        },
      },
    },
    500: {
      description: 'Internal server error',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['CREATE_GROUP_ROW_ERROR'] },
      },
    },
  },
};
