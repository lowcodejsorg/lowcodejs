import type { FastifySchema } from 'fastify';

export const GroupFieldShowSchema: FastifySchema = {
  tags: ['Group Fields'],
  summary: 'Get field in group',
  description: 'Retrieves a specific field by ID from a FIELD_GROUP.',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['slug', 'groupSlug', 'fieldId'],
    properties: {
      slug: { type: 'string', description: 'Table slug' },
      groupSlug: { type: 'string', description: 'Group slug' },
      fieldId: { type: 'string', description: 'Field ID' },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Field retrieved successfully',
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
        format: { type: 'string', nullable: true },
        defaultValue: { type: 'string', nullable: true },
        trashed: { type: 'boolean' },
        trashedAt: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    404: {
      description: 'Table, group, or field not found',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [404] },
        cause: {
          type: 'string',
          enum: ['TABLE_NOT_FOUND', 'GROUP_NOT_FOUND', 'FIELD_NOT_FOUND'],
        },
      },
    },
    500: {
      description: 'Internal server error',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['GET_GROUP_FIELD_ERROR'] },
      },
    },
  },
};
