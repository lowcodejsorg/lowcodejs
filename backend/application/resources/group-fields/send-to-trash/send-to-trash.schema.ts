import type { FastifySchema } from 'fastify';

export const GroupFieldSendToTrashSchema: FastifySchema = {
  tags: ['Group Fields'],
  summary: 'Send group field to trash',
  description:
    'Moves a field within a FIELD_GROUP to trash. Sets trashed=true and disables display properties.',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['slug', 'groupSlug', 'fieldId'],
    properties: {
      slug: { type: 'string', description: 'Table slug' },
      groupSlug: { type: 'string', description: 'Group slug' },
      fieldId: { type: 'string', description: 'Field ID to trash' },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Field moved to trash successfully',
      type: 'object',
      properties: {
        _id: { type: 'string' },
        name: { type: 'string' },
        slug: { type: 'string' },
        type: { type: 'string' },
        required: { type: 'boolean', enum: [false] },
        showInList: { type: 'boolean', enum: [false] },
        showInForm: { type: 'boolean', enum: [false] },
        showInDetail: { type: 'boolean', enum: [false] },
        showInFilter: { type: 'boolean', enum: [false] },
        trashed: { type: 'boolean', enum: [true] },
        trashedAt: { type: 'string', format: 'date-time' },
      },
    },
    403: {
      description: 'Forbidden - Native or locked field',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [403] },
        cause: {
          type: 'string',
          enum: ['NATIVE_FIELD_CANNOT_BE_TRASHED', 'FIELD_LOCKED'],
        },
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
    409: {
      description: 'Field already in trash',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [409] },
        cause: { type: 'string', enum: ['ALREADY_TRASHED'] },
      },
    },
    500: {
      description: 'Internal server error',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['SEND_GROUP_FIELD_TO_TRASH_ERROR'] },
      },
    },
  },
};
