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
          widthInForm: { type: 'number', nullable: true },
          widthInList: { type: 'number', nullable: true },
          locked: { type: 'boolean' },
          native: { type: 'boolean' },
          format: { type: 'string', nullable: true },
          defaultValue: { type: 'string', nullable: true },
          dropdown: {
            type: 'array',
            nullable: true,
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                label: { type: 'string' },
                color: { type: 'string' },
              },
            },
          },
          relationship: {
            type: 'object',
            nullable: true,
            properties: {
              table: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  slug: { type: 'string' },
                },
              },
              field: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  slug: { type: 'string' },
                },
              },
              order: { type: 'string', enum: ['asc', 'desc'] },
            },
          },
          category: {
            type: 'array',
            nullable: true,
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                label: { type: 'string' },
                children: { type: 'array' },
              },
            },
          },
          group: {
            type: 'object',
            nullable: true,
            properties: {
              _id: { type: 'string' },
              slug: { type: 'string' },
            },
          },
          trashed: { type: 'boolean' },
          trashedAt: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
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
