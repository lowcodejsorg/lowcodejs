import type { FastifySchema } from 'fastify';

export const GroupFieldListSchema: FastifySchema = {
  tags: ['Group Fields'],
  summary: 'List fields in group',
  description: 'Lists all fields within a FIELD_GROUP.',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['slug', 'groupSlug'],
    properties: {
      slug: { type: 'string', description: 'Table slug' },
      groupSlug: { type: 'string', description: 'Group slug' },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'List of fields in the group',
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          type: { type: 'string' },
          required: { type: 'boolean' },
          multiple: { type: 'boolean' },
          showInFilter: { type: 'boolean' },
          showInForm: { type: 'boolean' },
          showInDetail: { type: 'boolean' },
          showInList: { type: 'boolean' },
          locked: { type: 'boolean' },
          native: { type: 'boolean' },
          trashed: { type: 'boolean' },
        },
      },
    },
    404: {
      description: 'Table or group not found',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [404] },
        cause: { type: 'string', enum: ['TABLE_NOT_FOUND', 'GROUP_NOT_FOUND'] },
      },
    },
    500: {
      description: 'Internal server error',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['LIST_GROUP_FIELDS_ERROR'] },
      },
    },
  },
};
