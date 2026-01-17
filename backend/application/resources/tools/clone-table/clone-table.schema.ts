import type { FastifySchema } from 'fastify';

export const CloneTableSchema: FastifySchema = {
  tags: ['Tools'],
  summary: 'Clone table',
  description:
    'Clones a table using its ID and a new table name',
  body: {
    type: 'object',
    required: ['baseTableId', 'name'],
    properties: {
      baseTableId: {
        type: 'string',
        description: 'ID of the base table',
      },
      name: {
        type: 'string',
        description: 'Name of the new table',
      },
    },
  },
  response: {
    200: {
      description: 'Base table retrieved successfully',
      type: 'object',
    },
    404: {
      description: 'Table not found',
      type: 'object',
      properties: {
        message: { type: 'string' },
        cause: { type: 'string' },
      },
    },
  },
};
