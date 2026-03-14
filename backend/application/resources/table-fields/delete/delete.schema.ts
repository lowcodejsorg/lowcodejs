import type { FastifySchema } from 'fastify';

export const TableFieldDeleteSchema: FastifySchema = {
  tags: ['Fields'],
  summary: 'Delete field permanently',
  description:
    'Permanently deletes a trashed field from the table. The field must be in trash before it can be permanently deleted.',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['slug', '_id'],
    properties: {
      slug: {
        type: 'string',
        description: 'Table slug containing the field',
        examples: ['users', 'products'],
      },
      _id: {
        type: 'string',
        description: 'Field ID to permanently delete',
        examples: ['507f1f77bcf86cd799439011'],
      },
    },
    additionalProperties: false,
  },
  querystring: {
    type: 'object',
    properties: {
      group: {
        type: 'string',
        description: 'Group slug (when deleting a field inside a field group)',
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Field permanently deleted',
      type: 'null',
    },
  },
};
