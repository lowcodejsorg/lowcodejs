import type { FastifySchema } from 'fastify';

export const TableFieldSuggestSlugSchema: FastifySchema = {
  tags: ['Fields'],
  summary: 'Suggest field slug',
  description:
    'Suggests a safe, short and unique field slug for a table based on the display title.',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['slug'],
    properties: {
      slug: {
        type: 'string',
        description: 'Table slug where the field will be created',
      },
    },
    additionalProperties: false,
  },
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 500,
        description: 'Display title used as the source for the slug suggestion',
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Suggested slug',
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          minLength: 2,
          maxLength: 80,
          pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
        },
      },
    },
  },
};
