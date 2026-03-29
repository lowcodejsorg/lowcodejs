import type { FastifySchema } from 'fastify';

export const GroupFieldUpdateSchema: FastifySchema = {
  tags: ['Group Fields'],
  summary: 'Update field in group',
  description:
    'Updates an existing field inside a FIELD_GROUP. Regenerates slug if name changed and rebuilds group and table schemas.',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['slug', 'groupSlug', 'fieldId'],
    properties: {
      slug: { type: 'string', description: 'Table slug' },
      groupSlug: { type: 'string', description: 'Group slug' },
      fieldId: { type: 'string', description: 'Field ID to update' },
    },
    additionalProperties: false,
  },
  body: {
    type: 'object',
    required: ['name', 'type'],
    properties: {
      name: { type: 'string' },
      type: { type: 'string' },
      required: { type: 'boolean', default: false },
      multiple: { type: 'boolean', default: false },
      showInFilter: { type: 'boolean', default: false },
      showInForm: { type: 'boolean', default: false },
      showInDetail: { type: 'boolean', default: false },
      showInList: { type: 'boolean', default: false },
      widthInForm: { type: 'number', nullable: true, default: 50 },
      widthInList: { type: 'number', nullable: true, default: 10 },
      widthInDetail: { type: 'number', nullable: true, default: 50 },
      locked: { type: 'boolean', default: false },
      format: { type: 'string', nullable: true, default: null },
      defaultValue: { type: 'string', nullable: true, default: null },
      dropdown: { type: 'array', nullable: true, default: [] },
      relationship: { type: 'object', nullable: true, default: null },
      category: { type: 'array', nullable: true, default: [] },
      trashed: { type: 'boolean' },
      trashedAt: { type: 'string', format: 'date-time', nullable: true },
    },
  },
  response: {
    200: {
      description: 'Field updated successfully',
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
        widthInDetail: { type: 'number', nullable: true },
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
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
    500: {
      description: 'Internal server error',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['UPDATE_GROUP_FIELD_ERROR'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  },
};
